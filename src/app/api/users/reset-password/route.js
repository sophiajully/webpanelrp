import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";
import crypto from 'node:crypto'


const gerarSenhaSegura = (tamanho = 8) => {
    const caracteres = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let senha = "";
    
    // Criamos um buffer de bytes aleatórios
    const bytesAleatorios = crypto.randomBytes(tamanho);
    
    for (let i = 0; i < tamanho; i++) {
        // Usamos o byte aleatório para pegar o índice do caractere
        senha += caracteres[bytesAleatorios[i] % caracteres.length];
    }
    return senha;
};


export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  
  // 1. Bloqueio básico de sessão
  if (!session || !session.user.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Dados ausentes" }, { status: 400 });
    }

    // 2. SEGURANÇA: Validar se o usuário alvo pertence à MESMA empresa do dono
    // E garantir que o dono não resete a própria senha por aqui ou a de outro dono
    const userToReset = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: session.user.companyId, // <--- O PULO DO GATO
      },
      include: { role: true }
    });

    if (!userToReset) {
      return NextResponse.json({ error: "Usuário não encontrado nesta organização" }, { status: 404 });
    }

    // 3. Impedir que um dono resete a senha de outro dono (opcional, mas recomendado)
    if (userToReset.role?.isOwner && userId !== session.user.id) {
       return NextResponse.json({ error: "Você não pode resetar a senha de outro proprietário" }, { status: 403 });
    }

    const newPassword = gerarSenhaSegura(12);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // 4. LOG DE SEGURANÇA (Importante para auditoria)
    await prisma.companyLog.create({
      data: {
        companyId: session.user.companyId,
        userId: session.user.id,
        action: "RESET_SENHA",
        details: `Senha do usuário ${userToReset.username} foi resetada pelo proprietário.`,
        category: "SEGURANÇA"
      }
    });

    return NextResponse.json({ success: true, newPassword });
  } catch (error) {
    console.error("Erro ao resetar senha:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}