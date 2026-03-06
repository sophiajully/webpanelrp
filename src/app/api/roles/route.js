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
            include: { _count: { select: { users: true } } } // Mostra quantos usuários têm esse cargo
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