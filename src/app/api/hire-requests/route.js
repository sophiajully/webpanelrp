import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Queue } from "@/lib/Queue";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { companyId } = await req.json();

    // 1. Verifica duplicidade
    const existing = await prisma.hireRequest.findFirst({
      where: { userId: session.user.id, companyId, status: "pending" }
    });

    if (existing) return NextResponse.json({ error: "Você já tem uma solicitação pendente nesta empresa." }, { status: 400 });

    // 2. Busca dados da empresa para o Webhook
    const targetCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, webhookLogs: true, colorPrimary: true }
    });

    // 3. Cria a solicitação
    const request = await prisma.hireRequest.create({
      data: {
        userId: session.user.id,
        companyId: companyId,
        status: "pending"
      }
    });

    // 4. WEBHOOK: Alerta de Nova Solicitação
    if (targetCompany?.webhookLogs) {
      await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
        url: targetCompany.webhookLogs,
        embed: {
          title: "📩 Nova Solicitação de Entrada",
          color: 0x3498db, // Azul
          description: `O usuário **${session.user.name}** solicitou acesso à empresa.`,
          fields: [
            { name: "Usuário", value: session.user.name, inline: true },
            { name: "Empresa", value: targetCompany.name, inline: true },
            { name: "Status", value: "Aguardando Aprovação", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "SafraLog - Sistema de Recrutamento" }
        }
      });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Erro POST hire-requests:", error);
    return NextResponse.json({ error: "Erro ao enviar solicitação" }, { status: 500 });
  }
}

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isOwner || !session?.user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
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
            username: true,
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
      // 1. Vincula o usuário à empresa
      // 2. Opcional: Atribuir um Role padrão de "Funcionário" aqui se desejar
      await prisma.user.update({
        where: { id: request.userId },
        data: { companyId: request.companyId }
      });
    }

    // Deleta o pedido processado
    await prisma.hireRequest.delete({ where: { id: requestId } });

    // WEBHOOK: Resultado da análise
    if (request.company.webhookLogs) {
      const statusColor = isApproved ? 0x2ecc71 : 0xe74c3c; // Verde ou Vermelho
      
      await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
        url: request.company.webhookLogs,
        embed: {
          title: isApproved ? "✅ Solicitação Aprovada" : "❌ Solicitação Recusada",
          color: statusColor,
          description: `A solicitação de **${request.user.username}** foi processada.`,
          fields: [
            { name: "Resultado", value: isApproved ? "Aprovado / Contratado" : "Recusado", inline: true },
            { name: "Responsável", value: session.user.name, inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "SafraLog - Gestão de Equipe" }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH hire-requests:", error);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}