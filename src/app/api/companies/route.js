import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 12;
  const search = searchParams.get("search") || "";
  
  // Se 'all' for true, mostramos TUDO. 
  // Se não for passado (ou for false), mantemos o filtro de ter crafts.
  const showAll = searchParams.get("all") === "true";
  
  const skip = (page - 1) * limit;

  try {
    const where = {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      
      // Lógica Opcional: 
      // Se showAll for false, aplica o filtro de 'crafts: some'
      ...(!showAll ? { crafts: { some: {} } } : {})
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