import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    
    if (!companyId) {
      return NextResponse.json({ error: "ID da empresa é obrigatório" }, { status: 400 });
    }

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    
    const where = {
      companyId: companyId,
      OR: search ? [
        { details: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ] : undefined
    };

    const [logs, total] = await Promise.all([
      prisma.companyLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { username: true }
          }
        },
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.companyLog.count({ where })
    ]);

    return NextResponse.json({
      logs,
      meta: { 
        total, 
        page, 
        totalPages: Math.ceil(total / limit) 
      }
    });
  } catch (error) {
    console.error("[LOGS_GET_ERROR]", error);
    return NextResponse.json({ logs: [], meta: {} }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { companyId, action, details, category, userId } = body;

    const newLog = await prisma.companyLog.create({
      data: {
        companyId,
        action,
        details,
        category: category || "GERAL",
        userId: userId || session?.user?.id || null,
      }
    });

    return NextResponse.json(newLog);
  } catch (error) {
    console.error("[LOGS_POST_ERROR]", error);
    return NextResponse.json({ error: "Erro ao registrar log" }, { status: 500 });
  }
}