import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await req.json();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Validação: Verifica se o usuário realmente é dono da empresa para a qual quer trocar
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: session.user.id
      }
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada ou não pertence a você" }, { status: 403 });
    }

    // Atualiza o campo companyId no model User
    // Isso define qual empresa o dono está "gerenciando" no momento
    await prisma.user.update({
      where: { id: session.user.id },
      data: { companyId: companyId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao trocar empresa" }, { status: 500 });
  }
}