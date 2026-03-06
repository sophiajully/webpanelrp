import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Queue } from "@/lib/Queue";

// GET: Lista as solicitações pendentes para o dono da empresa
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isOwner || !session.user.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const requests = await prisma.hireRequest.findMany({
      where: { 
        companyId: session.user.companyId,
        status: "pending" 
      },
      include: { 
        user: { 
          select: { 
            id: true,
            username: true 
          } 
        } 
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Erro ao buscar hire requests:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH: Aprova ou Rejeita uma solicitação
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isOwner) return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const { requestId, action } = await req.json();

  try {
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

    await prisma.hireRequest.delete({ where: { id: requestId } });

    // Webhook via Queue
    if (request.company.webhookLogs) {
      const statusColor = isApproved ? 0x2ecc71 : 0xe74c3c;
      
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