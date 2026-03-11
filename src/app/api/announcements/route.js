import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Queue } from "@/lib/Queue"; // Importando a Fila

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        if (!session.user.companyId) {
            return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
        }

        const ads = await prisma.announcement.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(ads);
    } catch (error) {
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        
        const canPost = session?.user?.role?.isOwner || session?.user?.role?.canAdmin;
        if (!session || !canPost) {
            return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
        }

        const { title, content, priority } = await req.json();
        const authorName = session.user.username || session.user.name || "Administração";

        // 1. Criar o anúncio e incluir os dados da empresa para pegar o webhook
        const newAd = await prisma.announcement.create({
            data: {
                title,
                content,
                priority: Boolean(priority),
                author: authorName,
                companyId: session.user.companyId
            },
            include: {
                company: true // Certifique-each que a relação existe no seu schema.prisma
            }
        });

        // 2. Enviar para a Fila do Webhook se a empresa tiver um webhook configurado
        if (newAd.company?.webhookLogs) {
            await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
                url: newAd.company.webhookLogs,
                embed: {
                    title: priority ? "🚨 NOVO EDITAL URGENTE" : "📜 NOVO EDITAL PUBLICADO",
                    color: priority ? 0xFF0000 : 0xd4a91c, // Vermelho se urgente, Amarelo/Dourado se normal
                    description: content, // O conteúdo do anúncio (Markdown funciona aqui!)
                    fields: [
                        { name: "Título", value: title },
                        { name: "Autor", value: `\`${authorName}\``, inline: true },
                        { name: "Prioridade", value: priority ? "🔴 Alta" : "⚪ Normal", inline: true }
                    ],
                    footer: { text: `Fazenda: ${newAd.company.name}` },
                    timestamp: new Date().toISOString()
                }
            });
        }

        return NextResponse.json(newAd);
    } catch (error) {
        console.error("ERRO AO POSTAR ANUNCIO:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        
        // Verificação de permissão
        if (!session || !session.user.role?.canAdmin) {
            return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

        // 1. Buscar o anúncio ANTES de deletar para ter os dados no Webhook
        const adToDelete = await prisma.announcement.findUnique({
            where: { id },
            include: { company: true }
        });

        if (!adToDelete) {
            return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 });
        }

        // 2. Executar a exclusão
        await prisma.announcement.delete({ where: { id } });

        // 3. Enviar Webhook de Log de Exclusão
        if (adToDelete.company?.webhookLogs) {
            await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
                url: adToDelete.company.webhookLogs,
                embed: {
                    title: "🗑️ Edital Removido",
                    color: 0x333333, // Cinza escuro
                    description: `O edital abaixo foi removido do mural.`,
                    fields: [
                        { name: "Título Original", value: adToDelete.title },
                        { name: "Autor Original", value: adToDelete.author, inline: true },
                        { name: "Removido por", value: `\`${session.user.name}\``, inline: true }
                    ],
                    footer: { text: `Empresa: ${adToDelete.company.name}` },
                    timestamp: new Date().toISOString()
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("ERRO AO DELETAR ANUNCIO:", error);
        return NextResponse.json({ error: "Erro interno ao deletar" }, { status: 500 });
    }
}