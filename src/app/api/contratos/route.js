import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: Lista os contratos abertos da empresa
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const contratos = await prisma.contract.findMany({
      where: {
        companyId: session.user.companyId,
        status: "ABERTO", // No mural, só mostramos o que está disponível
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(contratos);
  } catch (error) {
    console.error("[CONTRATOS_GET_ERROR]", error);
    return NextResponse.json({ error: "Erro ao buscar contratos" }, { status: 500 });
  }
}

// POST: Cria um novo contrato (Apenas Dono/Admin)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificação de Poder: Só dono ou quem tem canAdmin pode criar contratos
    const isAuthorized = session?.user?.isOwner || session?.user?.role?.canAdmin;
    
    if (!session?.user?.companyId || !isAuthorized) {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
    }

    const { description, reward } = await request.json();

    // Validação de entrada
    if (!description || description.trim().length < 3) {
      return NextResponse.json({ error: "Descrição muito curta" }, { status: 400 });
    }
    if (isNaN(reward) || reward <= 0) {
      return NextResponse.json({ error: "Valor de recompensa inválido" }, { status: 400 });
    }

    const newContract = await prisma.contract.create({
      data: {
        companyId: session.user.companyId,
        description: description.trim(),
        reward: parseFloat(reward),
        status: "ABERTO"
      }
    });

    // LOG AUTOMÁTICO: Registra que um contrato foi criado
    await prisma.companyLog.create({
      data: {
        companyId: session.user.companyId,
        userId: session.user.id,
        action: "CONTRATO_CRIADO",
        details: `Criou contrato: ${description} | Recompensa: $${reward}`,
        category: "FINANCEIRO"
      }
    });

    return NextResponse.json(newContract);
  } catch (error) {
    console.error("[CONTRATOS_POST_ERROR]", error);
    return NextResponse.json({ error: "Erro ao criar contrato" }, { status: 500 });
  }
}

// PUT: Finaliza/Conclui um contrato
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { contractId } = await request.json();

    // Busca o contrato para verificar se ele pertence à mesma empresa do usuário
    const contratoExistente = await prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contratoExistente || contratoExistente.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Contrato não encontrado ou acesso negado" }, { status: 404 });
    }

    if (contratoExistente.status === "CONCLUIDO") {
      return NextResponse.json({ error: "Este contrato já foi finalizado" }, { status: 400 });
    }

    // Atualiza o contrato para concluído
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: { 
        status: "CONCLUIDO",
        completedBy: session.user.id 
      }
    });

    // LOG AUTOMÁTICO: Registra quem concluiu
    await prisma.companyLog.create({
      data: {
        companyId: session.user.companyId,
        userId: session.user.id,
        action: "CONTRATO_CONCLUIDO",
        details: `Concluiu a meta: ${contratoExistente.description}`,
        category: "TAREFAS"
      }
    });

    return NextResponse.json(updatedContract);
  } catch (error) {
    console.error("[CONTRATOS_PUT_ERROR]", error);
    return NextResponse.json({ error: "Erro ao finalizar contrato" }, { status: 500 });
  }
}