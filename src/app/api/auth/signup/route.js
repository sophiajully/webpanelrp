import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, type, companyName, accessKey, selectedCompanyId } = body;

    // 1. Validação básica de campos
    if (!username || !password || !type) {
      return NextResponse.json({ error: "Nome ou Senha inválidos." }, { status: 400 });
    }

    // 2. Verificar se o cidadão já existe
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Nome ou Senha inválidos." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // --- FLUXO PARA PROPRIETÁRIOS (FUNDAÇÃO DE EMPRESA) ---
    if (type === 'owner') {
      if (!companyName || !accessKey) {
        return NextResponse.json({ error: "Nome da empresa e Chave de Acesso são necessários." }, { status: 400 });
      }

      // 3. Validar a AccessKey antes de qualquer coisa
      const keyData = await prisma.accessKey.findUnique({
        where: { key: accessKey }
      });

      if (!keyData) {
        return NextResponse.json({ error: "Esta Chave de Acesso é inexistente ou inválida." }, { status: 400 });
      }

      if (keyData.used) {
        return NextResponse.json({ error: "Esta Chave de Acesso já foi utilizada por outro cidadão." }, { status: 400 });
      }

      // 4. Iniciar Transação
      await prisma.$transaction(async (tx) => {
        
        // A. Marcar a chave como usada para evitar race conditions
        await tx.accessKey.update({
          where: { id: keyData.id },
          data: { 
            used: true,
            usedBy: username
          }
        });

        // B. Calcular data de expiração baseada nos dias da chave
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + keyData.days);

        // C. Criar o Usuário
        const user = await tx.user.create({
          data: {
            username,
            password: hashedPassword,
            accessKey: accessKey,
            expiresAt: expirationDate,
          },
        });

        // D. Criar a Empresa e a Role de Dono
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

        // E. Vincular usuário à empresa e ao cargo
        await tx.user.update({
          where: { id: user.id },
          data: {
            companyId: company.id,
            roleId: company.roles[0].id
          }
        });
      });

      return NextResponse.json({ message: "Sua empresa foi fundada com sucesso!" }, { status: 201 });
    }

    // --- FLUXO PARA TRABALHADORES (ALISTAMENTO) ---
    if (type === 'employee') {
      if (!selectedCompanyId) {
        return NextResponse.json({ error: "Selecione uma empresa para se alistar." }, { status: 400 });
      }

      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          companyId: selectedCompanyId,
        }
      });

      return NextResponse.json({ message: "Alistamento concluído!" }, { status: 201 });
    }

    return NextResponse.json({ error: "Função inválida." }, { status: 400 });

  } catch (error) {
    console.error("ERRO_SIGNUP:", error);
    return NextResponse.json({ error: "Erro interno no cartório da fronteira." }, { status: 500 });
  }
}