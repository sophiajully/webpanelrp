import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  // Segurança: Só o admin master pode gerar chaves
  if (!session || session.user.name !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { days } = await req.json();
    
    // Gerar uma chave aleatória estilo XXXX-XXXX-XXXX
    const randomKey = Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
                      Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
                      Math.random().toString(36).substring(2, 6).toUpperCase();

    const newKey = await prisma.accessKey.create({
      data: {
        key: randomKey,
        days: parseInt(days),
        used: false
      }
    });

    return NextResponse.json(newKey);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao gerar chave" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.name !== "admin") return NextResponse.json([], { status: 401 });

  const keys = await prisma.accessKey.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  return NextResponse.json(keys);
}