import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import speakeasy from "speakeasy";
import { getServerSession } from "next-auth";
// Certifique-se que o caminho dos seus authOptions está correto
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { code, secret } = await req.json();

    if (!code || !secret) {
      return NextResponse.json({ error: "Código e Secret são obrigatórios" }, { status: 400 });
    }

    // Valida o código digitado contra a secret temporária
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    // Se validou, salva definitivamente no usuário
    await prisma.user.update({
      where: { username: session.user.name },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}