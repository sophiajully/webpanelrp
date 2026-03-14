import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, type, companyName, accessKey, selectedCompanyId } = body;

    // 1. Validação básica de campos
    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Nome de cidadão muito curto." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 8 caracteres." }, { status: 400 });
    }

    // 2. Verificar se o cidadão já existe
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Este nome já consta nos registros do cartório." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // --- FLUXO PARA PROPRIETÁRIOS ---
    if (type === 'owner') {
      if (!companyName || !accessKey) {
        return NextResponse.json({ error: "Dados da empresa incompletos." }, { status: 400 });
      }

      const keyData = await prisma.accessKey.findUnique({ where: { key: accessKey } });

      if (!keyData || keyData.used) {
        return NextResponse.json({ error: "Chave de acesso inválida ou já utilizada." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.accessKey.update({
          where: { id: keyData.id },
          data: { used: true, usedBy: username }
        });

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + keyData.days);

        const user = await tx.user.create({
          data: {
            username,
            password: hashedPassword,
            accessKey: accessKey,
            expiresAt: expirationDate,
          },
        });

        const company = await tx.company.create({
          data: {
            name: companyName.toUpperCase(),
            ownerId: user.id,
            roles: {
              create: {
                name: 'Dono',
                isOwner: true,
                canAdmin: true,
                canCraft: true,
                canVendas: true,
                canLogs: true,
              }
            }
          },
          include: { roles: true }
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            companyId: company.id,
            roleId: company.roles[0].id
          }
        });
      });

      return NextResponse.json({ message: "Empresa fundada com sucesso!" }, { status: 201 });
    }

    // --- FLUXO PARA TRABALHADORES (CORRIGIDO) ---
    if (type === 'employee') {
      if (!selectedCompanyId) {
        return NextResponse.json({ error: "Selecione uma empresa para se alistar." }, { status: 400 });
      }

      // Validar se a empresa existe e aceita solicitações
      const targetCompany = await prisma.company.findUnique({
        where: { id: selectedCompanyId }
      });

      if (!targetCompany || !targetCompany.enableHireRequest) {
        return NextResponse.json({ error: "Esta empresa não está aceitando novos recrutas." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // Criamos o usuário SEM companyId (ele ainda não é membro oficial)
        const newUser = await tx.user.create({
          data: {
            username,
            password: hashedPassword,
            companyId: null, // Garante que começa nulo
          }
        });

        // Criamos a solicitação de contratação (HireRequest)
        await tx.hireRequest.create({
          data: {
            userId: newUser.id,
            companyId: selectedCompanyId,
            status: "pending" // Status inicial
          }
        });
      });

      return NextResponse.json({ message: "Solicitação enviada! Aguarde a aprovação do dono." }, { status: 201 });
    }

    return NextResponse.json({ error: "Função inválida." }, { status: 400 });

  } catch (error) {
    console.error("ERRO_SIGNUP:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}