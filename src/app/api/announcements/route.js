import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Verifique esse caminho
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Se o erro for aqui, é porque o companyId não existe na sessão
    if (!session.user.companyId) {
       console.error("Sessão encontrada, mas sem companyId:", session.user);
       return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const ads = await prisma.announcement.findMany({
      where: { 
        companyId: session.user.companyId 
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    });

    return NextResponse.json(ads);
  } catch (error) {
    console.error("ERRO NA API DE ANUNCIOS:", error);
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificação de Role (Dono ou Admin)
    const canPost = session?.user?.role?.isOwner || session?.user?.role?.canAdmin;
    if (!session || !canPost) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { title, content, priority } = await req.json();

    // Verificamos qual campo de nome está disponível na sua sessão
    const authorName = session.user.username || session.user.name || "Membro da Safra";

    const newAd = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: Boolean(priority),
        author: authorName, // Agora nunca será undefined
        companyId: session.user.companyId
      }
    });

    return NextResponse.json(newAd);
  } catch (error) {
    console.error("ERRO AO POSTAR ANUNCIO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.role?.canAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}