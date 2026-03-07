import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, roleId, companyId } = body;
const session = await getServerSession(authOptions);

  
  if (!session || session.user.name !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
    
    console.log("DADOS RECEBIDOS NA API:", { username, password: !!password, roleId, companyId });

    
    if (!password || password === "") {
      return NextResponse.json({ error: "A senha não foi fornecida pelo sistema." }, { status: 400 });
    }

    if (!username || !companyId) {
      return NextResponse.json({ error: "Username e CompanyId são obrigatórios." }, { status: 400 });
    }

    
    const userExists = await prisma.user.findUnique({ where: { username } });
    if (userExists) {
      return NextResponse.json({ error: "Este nome de usuário já existe." }, { status: 400 });
    }

    
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

    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    
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