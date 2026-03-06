import { prisma } from "./prisma";

class QueueManager {
    constructor() {
        this.isProcessing = false;
        this.handlers = new Map();
        this.DEFAULT_DELAY = 1000; // 1 segundo de intervalo entre jobs (Rate Limit preventivo)

        // Inicia a limpeza de jobs travados e processamento assim que a classe é instanciada
        if (typeof window === "undefined") {
            this.init();
        }
    }

    // Método para rodar assim que o servidor subir
    async init() {
        try {
            console.log("[Queue] Sistema iniciado. Recuperando jobs travados...");
            // Se o servidor caiu no meio de um processo, volta o job para pendente
            await prisma.queue.updateMany({
                where: { status: "processing" },
                data: { status: "pending" }
            });
            this.processNext();
        } catch (err) {
            console.error("[Queue] Erro na inicialização:", err);
        }
    }

    define(taskName, handler) {
        this.handlers.set(taskName, handler);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async add(taskName, payload = {}) {
        try {
            const job = await prisma.queue.create({
                data: {
                    taskName,
                    payload: JSON.stringify(payload),
                    status: "pending"
                }
            });

            console.log(`[Queue] Job ${job.id} adicionado à fila.`);
            this.processNext();
            return job;
        } catch (err) {
            console.error("[Queue] Erro ao adicionar job:", err);
            throw err;
        }
    }

    async processNext() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Busca o próximo da fila (mais antigo primeiro)
            const job = await prisma.queue.findFirst({
                where: { status: "pending" },
                orderBy: { createdAt: "asc" }
            });

            if (!job) {
                this.isProcessing = false;
                return;
            }

            // Marca como em processamento
            await prisma.queue.update({
                where: { id: job.id },
                data: { status: "processing" }
            });

            const handler = this.handlers.get(job.taskName);

            if (handler) {
                const payload = JSON.parse(job.payload);
                
                // Executa a tarefa real
                await handler(payload);

                // Sucesso: Marca como completado
                await prisma.queue.update({
                    where: { id: job.id },
                    data: { status: "completed" }
                });

                console.log(`[Queue] Job ${job.id} finalizado com sucesso.`);

                // Aguarda o delay padrão para não estressar a API do Discord
                await this.sleep(this.DEFAULT_DELAY);

            } else {
                throw new Error(`Nenhum handler definido para ${job.taskName}`);
            }

        } catch (error) {
            console.error(`[Queue] Erro no job:`, error.message);

            // LOGICA DE RATE LIMIT DO DISCORD (HTTP 429)
            if (error.status === 429) {
                const retryAfter = (error.retryAfter || 5) * 1000;
                console.warn(`[Queue] Rate Limit! Aguardando ${retryAfter}ms antes de tentar novamente.`);
                
                // Volta para pending para ser tentado de novo
                await prisma.queue.update({
                    where: { id: (await prisma.queue.findFirst({ where: { status: "processing" } }))?.id || "" }, // Garante pegar o ID atual
                    data: { status: "pending" }
                });

                await this.sleep(retryAfter);
            } else {
                // Erro fatal ou de código: Marca como falho para não travar a fila
                // O findFirst aqui é uma garantia caso o objeto 'job' esteja inacessível
                const currentJob = await prisma.queue.findFirst({ where: { status: "processing" } });
                if (currentJob) {
                    await prisma.queue.update({
                        where: { id: currentJob.id },
                        data: { 
                            status: "failed", 
                            error: error.message 
                        }
                    });
                }
            }
        }

        this.isProcessing = false;
        // Chama a si mesmo para verificar se há mais itens
        this.processNext();
    }
}

// Exporta a instância única
export const Queue = new QueueManager();

// --- DEFINIÇÃO DOS HANDLERS (BACKEND) ---

Queue.define("ENVIAR_WEBHOOK_DISCORD", async (data) => {
    const { url, embed } = data;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: "SafraLog",
            avatar_url: "https://i.imgur.com/cfehoGH.png",
            embeds: [embed]
        })
    });

    if (response.status === 429) {
        const json = await response.json();
        const error = new Error("Rate Limited");
        error.status = 429;
        error.retryAfter = json.retry_after; 
        throw error;
    }

    if (!response.ok) {
        throw new Error(`Discord API erro: ${response.status}`);
    }
});