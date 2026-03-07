import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ... seus imports
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 8;
  const search = searchParams.get("search") || ""; // Pega o termo de busca
  const skip = (page - 1) * limit;

  try {
    const where = search 
      ? { name: { contains: search, mode: 'insensitive' } } 
      : {};

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where, // Aplica o filtro aqui
        skip,
        take: limit,
        select: { 
          id: true, 
          name: true, 
          colorPrimary: true,
          _count: { select: { users: true, crafts: true } }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.company.count({ where }) // Conta o total baseado no filtro
    ]);

    return NextResponse.json({
      companies,
      meta: { total, page, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return NextResponse.json({ companies: [], meta: {} }, { status: 500 });
  }
}