import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 8;
  const search = searchParams.get("search") || ""; 
  const skip = (page - 1) * limit;
const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  try {
    
    const where = {
      
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      
      
      crafts: {
        some: {} 
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