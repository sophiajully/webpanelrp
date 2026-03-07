import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isOwner) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    try {
        const roles = await prisma.role.findMany({
            where: { companyId: session.user.companyId },
            include: { _count: { select: { users: true } } } 
        });
        return NextResponse.json(roles);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar roles" }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isOwner) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    try {
        const data = await request.json();
        const newRole = await prisma.role.create({
            data: {
                name: data.name,
                companyId: session.user.companyId,
                canVendas: data.canVendas,
                canCraft: data.canCraft,
                canLogs: data.canLogs,
                canAdmin: data.canAdmin,
            }
        });
        return NextResponse.json(newRole);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao criar role" }, { status: 500 });
    }
}

export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    
    
    if (!session || !session.user.isOwner) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID do cargo não fornecido" }, { status: 400 });
        }

        
        const roleWithUsers = await prisma.role.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } }
        });

        if (!roleWithUsers) {
            return NextResponse.json({ error: "Cargo não encontrado" }, { status: 404 });
        }

        if (roleWithUsers._count.users > 0) {
            return NextResponse.json({ 
                error: `Não é possível excluir: existem ${roleWithUsers._count.users} usuários com este cargo.` 
            }, { status: 400 });
        }

        
        await prisma.role.delete({
            where: { 
                id: id,
                companyId: session.user.companyId 
            }
        });

        return NextResponse.json({ message: "Cargo excluído com sucesso" });

    } catch (error) {
        console.error("Erro ao excluir role:", error);
        return NextResponse.json({ error: "Erro interno ao excluir cargo" }, { status: 500 });
    }
}