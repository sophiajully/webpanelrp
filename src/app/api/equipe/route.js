import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Queue } from "@/lib/Queue";

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
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { 
                username: 'asc'
            }
        });

        
        
        
        const equipeProntaParaOFrontend = equipe.map(u => ({
            id: u.id,
            username: u.username, 
            roleId: u.roleId,     
            role: u.role          
        }));

        return NextResponse.json(equipeProntaParaOFrontend);
    } catch (error) {
        console.error("Erro Prisma GET:", error);
        return NextResponse.json({ error: "Erro ao buscar equipe" }, { status: 500 });
    }
}

export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!session || !session.user?.isOwner) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!id) return NextResponse.json({ error: "ID ausente" }, { status: 400 });

    try {
        
        const userToDisconnect = await prisma.user.findUnique({
            where: { id: id },
            include: { 
                company: {
                    select: { name: true, webhookLogs: true }
                }
            }
        });

        if (!userToDisconnect || userToDisconnect.companyId !== session.user.companyId) {
            return NextResponse.json({ error: "Membro não encontrado ou não pertence à sua empresa" }, { status: 404 });
        }

        
        await prisma.user.update({
            where: { id: id },
            data: { 
                companyId: null, 
                roleId: null 
            }
        });

        
        if (userToDisconnect.company?.webhookLogs) {
            await Queue.add("ENVIAR_WEBHOOK_DISCORD", {
                url: userToDisconnect.company.webhookLogs,
                embed: {
                    title: "👢 Membro Desvinculado",
                    color: 0xffa500, 
                    description: `O colaborador **${userToDisconnect.username}** foi removido da equipe.`,
                    fields: [
                        { name: "Empresa", value: userToDisconnect.company.name, inline: true },
                        { name: "Removido por", value: session.user.name || "Dono", inline: true }
                    ],
                    timestamp: new Date().toISOString(),
                    footer: { text: "SafraLog - Gestão de Acessos" }
                }
            });
        }

        return NextResponse.json({ success: true, message: "Membro desvinculado com sucesso" });
    } catch (error) {
        console.error("Erro ao desvincular:", error);
        return NextResponse.json({ error: "Erro ao processar o desvínculo" }, { status: 500 });
    }
}