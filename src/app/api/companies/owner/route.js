import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { ownerId: session.user.id }, 
          { users: { some: { id: session.user.id } } } 
        ]
      },
      select: {
        id: true,
        name: true,
        colorPrimary: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("[API_COMPANIES_USER_LINKED]", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}