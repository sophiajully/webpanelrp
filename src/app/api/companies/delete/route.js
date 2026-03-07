import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("id");

    if (!session?.user?.isOwner) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

    // Validação: A empresa realmente pertence a esse dono?
    const empresa = await prisma.company.findFirst({
      where: { id: companyId, ownerId: session.user.id }
    });

    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    // Não permitir deletar a empresa que ele está usando agora (opcional, mas seguro)
    if (companyId === session.user.companyId) {
      return NextResponse.json({ error: "Troque de empresa antes de excluí-la." }, { status: 400 });
    }

    // Deletar a empresa (O Prisma cuidará das relações se estiver em Cascade ou você limpa manualmente)
    await prisma.company.delete({ where: { id: companyId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}