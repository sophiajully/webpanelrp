import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  
  
  if (!session || !session.user.isOwner) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "Dados ausentes" }, { status: 400 });
    }

    
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao resetar senha:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}