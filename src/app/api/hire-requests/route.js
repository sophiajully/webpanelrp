
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Queue } from "@/lib/Queue"; // Certifique-se de que o caminho está correto

export async function GET(req) {
  const session = await getServerSession(authOptions);

  // 1. Segurança: Só o dono pode ver quem quer entrar
  if (!session?.user?.isOwner || !session?.user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    // 2. Busca todas as solicitações pendentes para a empresa do dono
    const requests = await prisma.hireRequest.findMany({
      where: {
        companyId: session.user.companyId,
        status: "pending" // Garante que só pegamos os novos
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            // Adicione outros campos do user que queira mostrar no card
          }
        }
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isOwner) return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const { requestId, action } = await req.json();

  try {
    // 1. Busca os dados da solicitação ANTES de deletar/alterar
    const request = await prisma.hireRequest.findUnique({
      where: { id: requestId },
      include: { 
        user: { select: { username: true } },
        company: { select: { name: true, webhookLogs: true, colorPrimary: true } }
      }
    });

    if (!request) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    const isApproved = action === 'approve';

    if (isApproved) {
      await prisma.user.update({
        where: { id: request.userId },
        data: { companyId: request.companyId }
      });
    }

    // Deleta o pedido (independente de aprovar ou reprovar)
    await prisma.hireRequest.delete({ where: { id: requestId } });

    // 2. DISPARAR PARA A FILA (WEBHOOK DISCORD)
    if (request.company.webhookLogs) {
      const statusColor = isApproved ? 0x2ecc71 : 0xe74c3c; // Verde ou Vermelho
      
      await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
        url: request.company.webhookLogs,
        embed: {
          title: isApproved ? "✅ Novo Membro Aprovado" : "❌ Solicitação Recusada",
          color: statusColor,
          description: `O usuário **${request.user.username}** foi ${isApproved ? "aprovado" : "rejeitado"} para entrar na equipe.`,
          fields: [
            { name: "Empresa", value: request.company.name, inline: true },
            { name: "Responsável", value: session.user.name, inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "SafraLog - Gestão de Equipe" }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}