import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";


export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isOwner) return NextResponse.json({ error: "Proibido" }, { status: 403 });

    try {
        const { userId, roleId } = await request.json();
        await prisma.user.update({
            where: { id: userId },
            data: { roleId: roleId === "" ? null : roleId }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const equipe = await prisma.user.findMany({
            where: { 
                companyId: session.user.companyId,
                NOT: { 
                    id: session.user.id 
                } 
            },
            select: { 
                id: true, 
                username: true, 
                roleId: true,
                role: {
                    select: {
                        name: true,
                        id: true
                    }
                }
            },
            orderBy: { 
                username: 'asc' // Aqui estava o erro: name -> username
            }
        });

        // Mapeamos para o formato que o seu React espera (usando .name)
        const equipeFormatada = equipe.map(u => ({
            id: u.id,
            name: u.username, 
            role: u.role?.name || "Funcionário"
        }));

        return NextResponse.json(equipeFormatada);
    } catch (error) {
        console.error("Erro Prisma GET:", error);
        return NextResponse.json({ error: "Erro ao buscar equipe" }, { status: 500 });
    }
}

export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!session || !session.user.isOwner) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        await prisma.user.delete({
            where: { 
                id: id,
                companyId: session.user.companyId // Segurança: só deleta se for da mesma empresa
            }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });
    }
}