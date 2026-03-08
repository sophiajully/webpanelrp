import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Queue } from "@/lib/Queue";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const companyId = resolvedParams.id;

    if (!companyId) return NextResponse.json({ error: "ID Inválido" }, { status: 400 });

    const body = await req.json();

    // 1. Busca empresa para pegar o webhookLogs dela
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    const embedSource = body.embeds?.[0];
    if (!embedSource) return NextResponse.json({ error: "Sem dados de embed" }, { status: 400 });

    // Helper para extrair os dados
    const getFieldValue = (name) => {
      const field = embedSource.fields?.find(f => f.name.includes(name));
      return field ? field.value.replace(/`/g, '') : null;
    };

    const usuario = (embedSource.description || "").split("**")[1] || "Desconhecido";
    const armazem = getFieldValue("Armazém") || "Geral";
    const item = getFieldValue("Item") || "Desconhecido";
    const quantidade = getFieldValue("Quantidade") || "0";
    const charId = getFieldValue("ID do Personagem") || "N/A";
    const acao = getFieldValue("Ação") || "MOVIMENTAÇÃO";

    const detailsFormatado = `${usuario} (ID: ${charId}) executou ${acao} de ${quantidade}x ${item} no armazém ${armazem}.`;

    // 2. Salva no banco de dados local (Site)
    const newLog = await prisma.companyLog.create({
      data: {
        companyId: companyId,
        action: `📦 ${acao}: ${item}`.toUpperCase(),
        details: detailsFormatado,
        category: "ARMAZEM",
        userId: null,
      }
    });

    // 3. Adiciona na Fila se a empresa tiver o Webhook configurado
    if (company.webhookLogs) {
      // Adicionamos o Job na fila para processamento em background
      await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
        url: company.webhookLogs,
        embed: {
          title: `📢 LOG DE ARMAZÉM: ${acao}`,
          description: detailsFormatado,
          color: acao.includes("RETIRADA") ? 15548997 : 5763719,
          fields: [
            { name: "📋 Item", value: `\`${item}\``, inline: true },
            { name: "🔢 Quantidade", value: `\`${quantidade}\``, inline: true },
            { name: "👤 Responsável", value: usuario, inline: true }
          ],
          footer: { text: `Empresa: ${company.name} | SafraLog` },
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ success: true, id: newLog.id }, { 
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error("[WEBHOOK_LOG_ERROR]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}