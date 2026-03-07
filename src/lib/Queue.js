import { prisma } from "./prisma";

class QueueManager {
    constructor() {
        // Agora controlamos o processamento por URL de Webhook específica
        this.activeWebhooks = new Set(); 
        this.handlers = new Map();
        this.DEFAULT_DELAY = 1000;

        if (typeof window === "undefined") {
            this.init();
        }
    }

    async init() {
        try {
            console.log("[Queue] Sistema iniciado. Recuperando jobs travados...");
            await prisma.queue.updateMany({
                where: { status: "processing" },
                data: { status: "pending" }
            });
            // Tenta processar o que estiver pendente no início
            this.processAll();
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

            console.log(`[Queue] Job ${job.id} adicionado.`);
            // Ao adicionar, tentamos processar apenas para o webhook deste payload
            this.processNext(payload.url); 
            return job;
        } catch (err) {
            console.error("[Queue] Erro ao adicionar job:", err);
            throw err;
        }
    }

    // Tenta rodar filas de todos os webhooks pendentes
    async processAll() {
        const pendingJobs = await prisma.queue.findMany({
            where: { status: "pending" },
            select: { payload: true }
        });

        const urls = [...new Set(pendingJobs.map(j => JSON.parse(j.payload).url))];
        urls.forEach(url => this.processNext(url));
    }

    async processNext(webhookUrl) {
        // Se já existe um processo rodando para ESTE webhook, ignora
        if (!webhookUrl || this.activeWebhooks.has(webhookUrl)) return;

        this.activeWebhooks.add(webhookUrl);

        try {
            // Busca o próximo job pendente especificamente para esta URL
            // O Prisma 5+ suporta busca dentro de JSON se configurado, 
            // mas aqui usaremos uma busca segura via contains no payload.
            const job = await prisma.queue.findFirst({
                where: { 
                    status: "pending",
                    payload: { contains: webhookUrl } 
                },
                orderBy: { createdAt: "asc" }
            });

            if (!job) {
                this.activeWebhooks.delete(webhookUrl);
                return;
            }

            await prisma.queue.update({
                where: { id: job.id },
                data: { status: "processing" }
            });

            const handler = this.handlers.get(job.taskName);
            if (handler) {
                const payload = JSON.parse(job.payload);
                
                try {
                    await handler(payload);

                    await prisma.queue.update({
                        where: { id: job.id },
                        data: { status: "completed" }
                    });

                    console.log(`[Queue] Webhook ${webhookUrl} - Job ${job.id} OK.`);
                    await this.sleep(this.DEFAULT_DELAY);

                } catch (error) {
                    if (error.status === 429) {
                        const retryAfter = (error.retryAfter || 5) * 1000;
                        console.warn(`[Queue] Rate Limit no Webhook ${webhookUrl}. Aguardando ${retryAfter}ms`);
                        
                        await prisma.queue.update({
                            where: { id: job.id },
                            data: { status: "pending" }
                        });

                        await this.sleep(retryAfter);
                    } else {
                        await prisma.queue.update({
                            where: { id: job.id },
                            data: { status: "failed", error: error.message }
                        });
                    }
                }
            }
        } catch (err) {
            console.error(`[Queue] Erro crítico na fila ${webhookUrl}:`, err);
        } finally {
            // Libera este webhook para o próximo job
            this.activeWebhooks.delete(webhookUrl);
            // Verifica se tem mais coisa para este mesmo webhook
            this.processNext(webhookUrl);
        }
    }
}

export const Queue = new QueueManager();

// --- HANDLER (Igual ao anterior, mas com log melhor) ---
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

    if (!response.ok) throw new Error(`Erro API Discord: ${response.status}`);
});