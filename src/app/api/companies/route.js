import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 8;
  const search = searchParams.get("search") || ""; 
  const skip = (page - 1) * limit;

  try {
    // Montamos o filtro
    const where = {
      // 1. Filtro de busca por nome (se existir)
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      
      // 2. Filtra APENAS empresas que possuem pelo menos 1 craft
      crafts: {
        some: {} // Isso garante que a lista de crafts não esteja vazia
      }
    };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        select: { 
          id: true, 
          name: true, 
          colorPrimary: true,
          // O _count correto fica apenas aqui dentro do select
          _count: { 
            select: { 
              users: true, 
              crafts: true 
            } 
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.company.count({ where }) 
    ]);

    return NextResponse.json({
      companies,
      meta: { total, page, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("ERRO_GET_COMPANIES:", error);
    return NextResponse.json({ companies: [], meta: {} }, { status: 500 });
  }
}