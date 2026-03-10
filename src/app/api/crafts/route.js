import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    
    const craft = await prisma.craft.findUnique({
      where: { id: id }
    });

    if (!craft) {
      return NextResponse.json({ error: "Receita não encontrada" }, { status: 404 });
    }

    
    if (craft.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Você não tem permissão para excluir esta receita" }, { status: 403 });
    }

    
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
    const { name, unit, insumos, price } = await req.json();
    
    const newCraft = await prisma.craft.create({
      data: {
        name,
        unit: String(unit),
        insumos: JSON.stringify(insumos),
        price,
        companyId: session.user.companyId 
      }
    });

    return NextResponse.json(newCraft);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao salvar receita" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // 1. Tenta pegar os crafts que você acabou de colocar na sessão/company
  const craftsDaSessao = session.user.company?.crafts;

  if (craftsDaSessao && craftsDaSessao.length > 0) {
    console.log("🚀 Retornando crafts DIRETO da sessão");
    return NextResponse.json(craftsDaSessao);
  }

  // 2. Fallback: Se por algum motivo a sessão não tiver os crafts, busca no banco
  console.log("🔍 Sessão vazia, buscando crafts no Prisma...");
  const crafts = await prisma.craft.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { name: 'asc' }
  });
  
  return NextResponse.json(crafts);
}