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
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  
  const crafts = await prisma.craft.findMany({
    where: { companyId: session.user.companyId }
  });
  
  return NextResponse.json(crafts);
}