import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { pombo: true }
        });
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
    }
}

export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    try {
        const { pombo } = await request.json();

        if (!pombo || pombo.trim() === "") {
            return NextResponse.json({ error: "O ID do Pombo não pode estar vazio." }, { status: 400 });
        }

        
        const pombosExistente = await prisma.user.findFirst({
            where: { 
                pombo: pombo,
                NOT: { id: session.user.id } 
            }
        });

        if (pombosExistente) {
            return NextResponse.json({ error: "Este ID de Pombo já pertence a outro morador." }, { status: 400 });
        }

        
        await prisma.user.update({
            where: { id: session.user.id },
            data: { pombo: pombo }
        });

        return NextResponse.json({ success: true, message: "Pombo atualizado!" });
    } catch (error) {
        console.error("Erro Pombo:", error);
        return NextResponse.json({ error: "Erro interno ao salvar" }, { status: 500 });
    }
}