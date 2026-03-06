import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ROTA PARA SALVAR (PATCH)
export async function PATCH(req) {
  try {
    const token = await getToken({ req });

    if (!token || !token.companyId) {
      return NextResponse.json({ error: "Sessão inválida ou expirada" }, { status: 401 });
    }

    const body = await req.json();
    const { webhookVendas, webhookLogs, name, colorPrimary, colorAccent } = body;

    const updated = await prisma.company.update({
      where: { id: token.companyId },
      data: { 
        webhookVendas, 
        webhookLogs, 
        name, 
        colorPrimary, 
        colorAccent 
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro no PATCH:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ROTA PARA CARREGAR (GET)
export async function GET(req) {
  try {
    // Usando getToken para consistência e performance
    const token = await getToken({ req });

    if (!token || !token.companyId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: token.companyId }
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Erro no GET config:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}