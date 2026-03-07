import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";



export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    if (!session?.user?.isOwner) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const { name, colorPrimary } = await req.json();
    const MAX_COMPANIES = 5; 

    
    const count = await prisma.company.count({
      where: { ownerId: session.user.id }
    });

    if (count >= MAX_COMPANIES) {
      return NextResponse.json({ 
        error: `Você atingiu o limite máximo de ${MAX_COMPANIES} empresas.` 
      }, { status: 400 });
    }

    const novaEmpresa = await prisma.company.create({
      data: {
        name,
        ownerId: session.user.id,
        colorPrimary: colorPrimary || "#d4a91c",
        colorAccent: colorPrimary || "#d4a91c"
      }
    });

    return NextResponse.json(novaEmpresa);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}