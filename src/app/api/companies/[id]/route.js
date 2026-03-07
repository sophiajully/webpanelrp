import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  // Em Next.js 15, params é uma Promise
  const { id } = await params;

  try {
    const company = await prisma.company.findUnique({
      where: { id: id },
      include: {
        crafts: true,
        owner: true // Aqui garantimos que os produtos venham junto
      }
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}