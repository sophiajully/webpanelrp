import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, type, companyName, accessKey, selectedCompanyId } = body;

    // 1. Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Este nome de usuário já está em uso." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // --- LÓGICA PARA DONO ---
  // --- LÓGICA PARA DONO ---
if (type === 'owner') {
  // Validar a Key
  const validKey = await prisma.accessKey.findUnique({
    where: { key: accessKey, used: false }
  });

  if (!validKey) {
    return NextResponse.json({ error: "Key de acesso inválida ou já utilizada." }, { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validKey.days);

  // Transação corrigida
  const result = await prisma.$transaction(async (tx) => {
    // 1. Criamos o Usuário e a Empresa simultaneamente
    // Assim o Prisma resolve os IDs automaticamente para você
    const user = await tx.user.create({
      data: {
        username,
        password: hashedPassword,
        isOwner: true,
        expiresAt: expiresAt,
        // Aqui está o segredo: Criamos a empresa dentro da criação do usuário
        company: {
          create: {
            name: companyName,
          }
        }
      },
      include: { company: true } // Para termos acesso ao ID da empresa depois se precisar
    });

    // 2. Agora vinculamos o ownerId na empresa (se o seu esquema exigir isso explicitamente)
    await tx.company.update({
      where: { id: user.companyId },
      data: { ownerId: user.id }
    });

    // 3. Queima a key
    await tx.accessKey.update({
      where: { id: validKey.id },
      data: { used: true, usedBy: username }
    });

    return user;
  });

  return NextResponse.json({ message: "Empresa e Dono criados com sucesso!" }, { status: 201 });
}

    // --- LÓGICA PARA FUNCIONÁRIO ---
    if (type === 'employee') {
      if (!selectedCompanyId) {
        return NextResponse.json({ error: "Selecione uma empresa." }, { status: 400 });
      }

      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          isOwner: false,
          // Criamos a solicitação de contratação pendente
          requests: {
            create: {
              companyId: selectedCompanyId,
              status: "pending"
            }
          }
        }
      });

      return NextResponse.json({ message: "Solicitação enviada! Aguarde a aprovação do dono." }, { status: 201 });
    }

  } catch (error) {
    console.error("Erro no Signup:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}