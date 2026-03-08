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

const embed = body.embeds?.[0];
if (!embed) return NextResponse.json({ error: "Formato inválido" }, { status: 400 });

// Função auxiliar para pegar valor de um campo pelo nome
const getFieldValue = (name) => {
  const field = embed.fields?.find(f => f.name.includes(name));
  return field ? field.value.replace(/`/g, '') : null;
};

// Mapeando os dados específicos do seu webhook
const usuario = (embed.description || "").split("**")[1] || "Desconhecido"; // Pega o nome entre os primeiros **
const armazem = getFieldValue("Armazém");
const item = getFieldValue("Item");
const quantidade = getFieldValue("Quantidade");
const charId = getFieldValue("ID do Personagem");
const acao = getFieldValue("Ação") || "MOVIMENTAÇÃO";

// 3. Criando o DETAILS Personalizado
// Exemplo: "Sarah Whinchester (ID: 83215) RETIROU 1x mane_chicken do armazém fazenda_10"
const detailsFormatado = `${usuario} (ID: ${charId}) executou ${acao} de ${quantidade}x ${item} no armazém ${armazem}.`;

// 4. Salvar no Banco
const newLog = await prisma.companyLog.create({
  data: {
    companyId: companyId,
    action: `📦 ${acao}: ${item}`.toUpperCase(), // Ex: 📦 RETIRADA: MANE_CHICKEN
    details: detailsFormatado, 
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