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
    // CORREÇÃO AQUI: No Next.js 15+, params é uma Promise!
    const resolvedParams = await params; 
    const companyId = resolvedParams.id;

    // Verificação extra para evitar o erro do Prisma
    if (!companyId) {
      return NextResponse.json({ error: "ID da empresa não identificado na URL" }, { status: 400 });
    }

    const body = await req.json();

    // 1. Validar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // 2. Extrair dados do formato Discord Embed
    const embed = body.embeds?.[0];
    if (!embed) {
      return NextResponse.json({ error: "Formato de embed inválido" }, { status: 400 });
    }

    const title = embed.title || "Movimentação";
    const description = (embed.description || "").replace(/\*\*/g, ''); // Limpa os negritos do Discord
    
    // Transformar os fields em string, limpando as crases
    const fieldsContent = embed.fields?.map(f => `${f.name}: ${f.value.replace(/`/g, '')}`).join(" | ");

    // 3. Montar e Salvar o Log
    const newLog = await prisma.companyLog.create({
      data: {
        companyId: companyId,
        action: title.toUpperCase(),
        details: `${description} | ${fieldsContent}`, 
        category: "ARMAZEM",
        userId: null, 
      }
    });

    // 4. Resposta com Headers de CORS para não travar no site de teste
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