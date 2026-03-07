import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("id");

    // 1. Verificações de Segurança
    if (!session?.user) {
      return NextResponse.json({ error: "Não Autorizado" }, { status: 401 });
    }

    if (!companyId) {
      return NextResponse.json({ error: "ID da empresa não fornecido" }, { status: 400 });
    }

    // 2. Verificar se a empresa existe e se o usuário logado é o dono (ownerId)
    const empresa = await prisma.company.findFirst({
      where: { 
        id: companyId, 
        ownerId: session.user.id 
      }
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada ou você não tem permissão." }, { status: 404 });
    }

    // 3. Impedir que o dono delete a empresa que ele está "dentro" no momento
    // Isso evita bugs de sessão no frontend
    if (companyId === session.user.companyId) {
      return NextResponse.json({ 
        error: "Você está usando esta empresa no momento. Troque de empresa ativa no menu lateral antes de excluí-la." 
      }, { status: 400 });
    }

    // 4. Executar a exclusão
    // Graças ao "onDelete: Cascade" no seu schema, Pedidos, Crafts, Roles e Logs 
    // serão apagados automaticamente pelo banco de dados.
    await prisma.$transaction([
      // Primeiro, "limpamos" os usuários vinculados (setando companyId e roleId como null)
      // para que eles não fiquem presos a um ID que não existe mais
      prisma.user.updateMany({
        where: { companyId: companyId },
        data: { 
          companyId: null,
          roleId: null 
        }
      }),

      // Agora deletamos a empresa. O Cascade fará o resto do trabalho pesado.
      prisma.company.delete({
        where: { id: companyId }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("ERRO_AO_DELETAR_EMPRESA:", error);
    
    // Tratamento de erro específico para restrições remanescentes
    return NextResponse.json({ 
      error: "Erro ao excluir: Verifique se a migração do banco (npx prisma migrate dev) foi aplicada corretamente." 
    }, { status: 500 });
  }
}