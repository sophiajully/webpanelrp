import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Queue } from "@/lib/Queue";

        // await fetch('/api/queue', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     taskName: "ENVIAR_WEBHOOK_DISCORD",
        //     payload: { 
              
        //     }
        //   })
        // });

export async function GET(req) {
  try {
    const token = await getToken({ req });
    if (!token?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const pedidos = await prisma.pedido.findMany({
      where: { companyId: token.companyId },
      orderBy: { id: 'desc' } 
    });

    const pedidosFormatados = pedidos.map(p => {
      let produtosValidos = [];
      try {
        // Tenta dar o parse, se falhar ou estiver vazio, retorna array vazio
        produtosValidos = p.produtos ? JSON.parse(p.produtos) : [];
      } catch (e) {
        console.error(`Erro no parse do pedido ${p.id}:`, e);
        produtosValidos = [];
      }

      return {
        ...p,
        produtos: produtosValidos
      };
    });

    return NextResponse.json(pedidosFormatados);
  } catch (error) {
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
    const session = await getServerSession(authOptions);
    const token = await getToken({ req });
    const companyId = session?.user?.companyId || token?.companyId;

    if (!companyId) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const body = await req.json();
    const { name, pombo, produtos } = body;

    // 1. Busca os dados da empresa para pegar o webhookVendas
    const empresa = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, webhookVendas: true }
    });

    // 2. Criando o pedido no banco de dados
    const novoPedido = await prisma.pedido.create({
      data: {
        name: name,
        pombo: pombo || "Não informado",
        companyId: companyId,
        status: "pendente",
        produtos: JSON.stringify(produtos)
      }
    });

    // 3. Se a empresa tiver um webhook configurado, envia para a fila (Queue)
    if (empresa?.webhookVendas) {
      // Formata a string de produtos para o Discord
      const itensTexto = produtos.map(p => 
        `• ${p.quantity}x **${p.name}**`
      ).join('\n') || "Nenhum item listado";

      // Calcula o total (assumindo que p.price e p.quantity existem)
      const total = produtos.reduce((acc, p) => acc + (p.price * p.quantity), 0);

      await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
        url: empresa.webhookVendas,
        embed: {
          title: "📩 Nova Proposta Comercial!",
          color: 0xd4a91c,
          fields: [
            { name: "👤 Cliente", value: name || "Desconhecido", inline: true },
            { name: "📫 Pombo", value: pombo || "Não Informado", inline: true },
            { name: "💰 Valor total", value: `**$ ${total.toFixed(2)}**` },
            { name: "📝 Itens", value: itensTexto },
          ],
          footer: { text: `Mercadão | Fornecedor: ${empresa.name}` },
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json(novoPedido);
  } catch (error) {
    console.error("ERRO NO POST PEDIDO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}