import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const companyId = resolvedParams.id;

    if (!companyId) {
      return NextResponse.json({ error: "ID da empresa não identificado" }, { status: 400 });
    }

    const body = await req.json();

    // 1. Buscar a empresa e o link do webhook dela
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const embed = body.embeds?.[0];
    if (!embed) return NextResponse.json({ error: "Formato inválido" }, { status: 400 });

    const getFieldValue = (name) => {
      const field = embed.fields?.find(f => f.name.includes(name));
      return field ? field.value.replace(/`/g, '') : null;
    };

    const usuario = (embed.description || "").split("**")[1] || "Desconhecido";
    const armazem = getFieldValue("Armazém");
    const item = getFieldValue("Item");
    const quantidade = getFieldValue("Quantidade");
    const charId = getFieldValue("ID do Personagem");
    const acao = getFieldValue("Ação") || "MOVIMENTAÇÃO";

    const detailsFormatado = `${usuario} (ID: ${charId}) executou ${acao} de ${quantidade}x ${item} no armazém ${armazem}.`;

    // 2. Salvar no Banco do Site
    const newLog = await prisma.companyLog.create({
      data: {
        companyId: companyId,
        action: `📦 ${acao}: ${item}`.toUpperCase(),
        details: detailsFormatado,
        category: "ARMAZEM",
        userId: null,
      }
    });

    // 3. Enviar para o Discord da Empresa (se ela tiver um webhook configurado)
    if (company.webhookLogs) {
      try {
        await fetch(company.webhookLogs, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: "Painel de Gestão - Safra",
            avatar_url: "https://tysaiw.com/logo.png", // Sua logo aqui
            embeds: [{
              title: `📢 LOG DE ARMAZÉM: ${acao}`,
              description: detailsFormatado,
              color: acao.includes("RETIRADA") ? 15548997 : 5763719, // Vermelho para retirada, Verde para entrada
              fields: [
                { name: "📋 Item", value: `\`${item}\``, inline: true },
                { name: "🔢 Qtd", value: `\`${quantidade}\``, inline: true },
                { name: "👤 Responsável", value: usuario, inline: true }
              ],
              footer: { text: `Empresa: ${company.name} | Webpanel RP` },
              timestamp: new Date().toISOString()
            }]
          })
        });
      } catch (discordError) {
        console.error("Erro ao enviar para o Discord da empresa:", discordError);
        // Não barramos a resposta do site se o discord falhar
      }
    }

    return NextResponse.json({ 
      success: true, 
      id: newLog.id 
    }, { 
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error("[WEBHOOK_LOG_ERROR]", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}