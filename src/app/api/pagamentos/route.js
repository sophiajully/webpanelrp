import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Queue } from "@/lib/Queue"; // Ajuste o caminho para onde está seu QueueManager

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const { companyId, id: userId } = session.user;
        const isOwner = session.user.isOwner || session.user.role?.isOwner;

        const pagamentos = await prisma.payment.findMany({
            where: isOwner ? { companyId } : { companyId, userId },
            include: {
                user: { select: { username: true } },
                paidBy: { select: { username: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(pagamentos);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const { action } = await req.json();
        if (!action) return NextResponse.json({ error: "Ação não informada" }, { status: 400 });

        // 1. Criar o registro no banco
        const novoPagamento = await prisma.payment.create({
            data: {
                action,
                companyId: session.user.companyId,
                userId: session.user.id,
                status: "PENDENTE"
            }
        });

        // 2. Buscar dados da empresa para o Webhook
        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
            select: { webhookLogs: true, name: true }
        });

        // 3. Enviar para a Fila se houver Webhook
        if (company?.webhookLogs) {
            await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
                url: company.webhookLogs,
                embed: {
                    title: "📝 Nova Ação Registrada",
                    color: 0xFFA500, // Laranja
                    fields: [
                        { name: "Funcionário", value: `\`${session.user.name}\``, inline: true },
                        { name: "Empresa", value: company.name, inline: true },
                        { name: "Ação", value: action },
                        { name: "Status", value: "🟡 Pendente de Pagamento" }
                    ],
                    timestamp: new Date().toISOString()
                }
            });
        }

        return NextResponse.json({ success: true, pagamento: novoPagamento });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro ao registrar" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        const isOwner = session?.user?.isOwner || session?.user?.role?.isOwner;
        if (!isOwner) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

        const { paymentId, amount } = await req.json();

        // 1. Atualizar e já buscar dados do funcionário que vai receber
        const pagamento = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                amount: parseFloat(amount),
                status: "PAGO",
                paidById: session.user.id
            },
            include: {
                user: { select: { username: true } },
                company: { select: { webhookLogs: true, name: true } }
            }
        });

        // 2. Enviar Log de Pagamento para a Fila
        if (pagamento.company?.webhookLogs) {
            await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
                url: pagamento.company.webhookLogs,
                embed: {
                    title: "💰 Pagamento Efetuado",
                    color: 0x00FF00, // Verde
                    fields: [
                        { name: "Funcionário", value: `\`${pagamento.user.username}\``, inline: true },
                        { name: "Valor", value: `\`$ ${parseFloat(amount).toLocaleString('pt-BR')}\``, inline: true },
                        { name: "Ação realizada", value: pagamento.action },
                        { name: "Pago por", value: `\`${session.user.name}\`` },
                        { name: "Status", value: "🟢 Concluído" }
                    ],
                    footer: { text: `Empresa: ${pagamento.company.name}` },
                    timestamp: new Date().toISOString()
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro ao pagar" }, { status: 500 });
    }
}