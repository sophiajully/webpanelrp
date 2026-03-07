import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    const token = await getToken({ req });
 const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!token || !token.companyId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const pedidos = await prisma.pedido.findMany({
      where: { companyId: token.companyId },
      orderBy: { id: 'desc' } 
    });

    
    const pedidosFormatados = pedidos.map(p => ({
      ...p,
      produtos: JSON.parse(p.produtos)
    }));

    return NextResponse.json(pedidosFormatados);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}


export async function PATCH(req) {
  try {
    const token = await getToken({ req });
    const { id, name, pombo, produtos, status } = await req.json();

    if (!token || !token.companyId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    
    const pedidoExistente = await prisma.pedido.findUnique({ where: { id } });
    
    if (!pedidoExistente || pedidoExistente.companyId !== token.companyId) {
      return NextResponse.json({ error: "Pedido não encontrado ou sem permissão" }, { status: 403 });
    }

    const updated = await prisma.pedido.update({
      where: { id },
      data: {
        name,
        pombo,
        status,
        produtos: JSON.stringify(produtos)
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}


export async function DELETE(req) {
  try {
    const token = await getToken({ req });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!token || !token.companyId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    
    const pedido = await prisma.pedido.findUnique({ where: { id } });

    if (!pedido || pedido.companyId !== token.companyId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.pedido.delete({ where: { id } });

    return NextResponse.json({ message: "Pedido removido" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}


export async function POST(req) {
  try {
    const token = await getToken({ req });
    if (!token || !token.companyId) return NextResponse.json({ status: 401 });

    const { name, pombo, produtos } = await req.json();

    const novoPedido = await prisma.pedido.create({
      data: {
        name,
        pombo,
        companyId: token.companyId,
        produtos: JSON.stringify(produtos)
      }
    });

    return NextResponse.json(novoPedido);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}