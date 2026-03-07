import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, roleId, companyId } = body;

    // LOG DE DEPURAÇÃO: Se der erro, olhe o console do VSCode e veja o que aparece aqui
    console.log("DADOS RECEBIDOS NA API:", { username, password: !!password, roleId, companyId });

    // Verificação de segurança: Se a senha não chegar, retorna erro antes de tentar o hash
    if (!password || password === "") {
      return NextResponse.json({ error: "A senha não foi fornecida pelo sistema." }, { status: 400 });
    }

    if (!username || !companyId) {
      return NextResponse.json({ error: "Username e CompanyId são obrigatórios." }, { status: 400 });
    }

    // 1. Verifica se o usuário já existe
    const userExists = await prisma.user.findUnique({ where: { username } });
    if (userExists) {
      return NextResponse.json({ error: "Este nome de usuário já existe." }, { status: 400 });
    }

    // 2. Lógica para garantir que exista um Role (Cargo) válido
    let finalRoleId = roleId;
    const roleCheck = finalRoleId ? await prisma.role.findUnique({ where: { id: finalRoleId } }) : null;

    if (!finalRoleId || !roleCheck) {
      const existingRole = await prisma.role.findFirst({ where: { companyId: companyId } });
      if (existingRole) {
        finalRoleId = existingRole.id;
      } else {
        const defaultRole = await prisma.role.create({
          data: {
            name: "Funcionário",
            companyId: companyId,
            canCraft: true 
          }
        });
        finalRoleId = defaultRole.id;
      }
    }

    // 3. Hash da senha (Agora garantido que password existe)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Cria o usuário
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        companyId,
        roleId: finalRoleId,
        isOwner: false,
      }
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username } });

  } catch (error) {
    console.error("Erro fatal na API de usuários:", error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}