import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
    const companyId = params.id;
    const body = await req.json();

    // 1. Validar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // 2. Extrair dados do formato Discord Embed
    // Pegamos o primeiro embed do array
    const embed = body.embeds?.[0];
    if (!embed) {
      return NextResponse.json({ error: "Formato de embed inválido" }, { status: 400 });
    }

    const title = embed.title || "Movimentação";
    const description = embed.description || "";
    
    // Transformar os fields do embed em uma string de detalhes legível
    // Ex: "Item: carne, Quantidade: 5, ID: 8321"
    const fieldsContent = embed.fields?.map(f => `${f.name}: ${f.value.replace(/`/g, '')}`).join(" | ");

    // 3. Montar os dados para o seu Schema de Logs
    const logData = {
      companyId: companyId,
      action: title.toUpperCase(), // Ex: 📦 MOVIMENTAÇÃO DO ARMAZÉM
      details: `${description} | ${fieldsContent}`, 
      category: "ARMAZEM", // Categoria automática baseada no bot
      userId: null, // Como vem de webhook externo, não tem usuário logado no painel
    };

    // 4. Salvar no Banco de Dados usando o modelo que você já tem
    const newLog = await prisma.companyLog.create({
      data: logData
    });

    // 5. Retornar sucesso (Status 204 ou 200 para o script do jogo não dar erro)
    return NextResponse.json({ 
      success: true, 
      message: "Log registrado no painel",
      id: newLog.id 
    }, { status: 201 });

  } catch (error) {
    console.error("[WEBHOOK_LOG_ERROR]", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}