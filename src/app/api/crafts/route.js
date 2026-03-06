import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";


export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // Pegamos o ID da URL (ex: /api/crafts?id=123)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // 1. Primeiro, buscamos o craft para conferir a propriedade
    const craft = await prisma.craft.findUnique({
      where: { id: id }
    });

    if (!craft) {
      return NextResponse.json({ error: "Receita não encontrada" }, { status: 404 });
    }

    // 2. SEGURANÇA: Verifica se o craft pertence à empresa do usuário
    if (craft.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Você não tem permissão para excluir esta receita" }, { status: 403 });
    }

    // 3. Deleta após passar na verificação
    await prisma.craft.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Receita removida com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar craft:", error);
    return NextResponse.json({ error: "Erro interno ao deletar" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { name, unit, insumos } = await req.json();
    
    const newCraft = await prisma.craft.create({
      data: {
        name,
        unit: String(unit),
        insumos: JSON.stringify(insumos),
        companyId: session.user.companyId // Vincula automaticamente à empresa do usuário
      }
    });

    return NextResponse.json(newCraft);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao salvar receita" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // FILTRO CRUCIAL: Só traz os crafts da empresa do usuário logado
  const crafts = await prisma.craft.findMany({
    where: { companyId: session.user.companyId }
  });
  
  return NextResponse.json(crafts);
}