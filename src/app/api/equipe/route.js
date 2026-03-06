import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // 1. Verificação de Permissão
    if (!session || !session.user?.isOwner) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!id) return NextResponse.json({ error: "ID ausente" }, { status: 400 });

    try {
        // 2. O PULO DO GATO: Deletar registros vinculados primeiro
        // Isso evita o Erro 500 de Constraint Violation
        await prisma.hireRequest.deleteMany({
            where: { userId: id }
        });

        // 3. Agora deletamos o usuário com segurança
        await prisma.user.delete({
            where: { 
                id: id,
                companyId: session.user.companyId, // Garante que é da mesma empresa
                isOwner: false // Impede o dono de se auto-deletar por erro
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("ERRO PRISMA DELETE:", error);
        return NextResponse.json({ 
            error: "Erro interno: verifique se o usuário possui vínculos ativos." 
        }, { status: 500 });
    }
}

export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) return NextResponse.json({ error: "Proibido" }, { status: 403 });

    try {
        const { userId, roleId } = await request.json();

        // Validação de entrada para evitar erro 500 por campo nulo
        if (!userId) throw new Error("userId is required");

        await prisma.user.update({
            where: { 
                id: userId,
                companyId: session.user.companyId 
            },
            data: { 
                roleId: (roleId === "" || !roleId) ? null : roleId 
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("ERRO PRISMA PATCH:", error);
        return NextResponse.json({ error: "Erro ao atualizar banco" }, { status: 500 });
    }
}