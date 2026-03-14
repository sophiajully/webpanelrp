import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(hoje.getDate() - 7);

    // 1. Métricas de Vendas e Lucro
    const [vendasHoje, lucroSemana, totalFuncionarios] = await Promise.all([
      // Vendas realizadas hoje
      prisma.payment.aggregate({
        where: { companyId, createdAt: { gte: hoje }, status: "PAGO" },
        _sum: { amount: true },
        _count: true
      }),
      // Lucro nos últimos 7 dias
      prisma.payment.aggregate({
        where: { companyId, createdAt: { gte: umaSemanaAtras }, status: "PAGO" },
        _sum: { amount: true }
      }),
      // Funcionários ativos na empresa
      prisma.user.count({ where: { companyId } })
    ]);

    // 2. Ranking de Produtividade (Funcionário do Mês/Semana)
    // Agrupa pagamentos/ações por usuário para ver quem mais trabalhou
    const rankingProdutividade = await prisma.payment.groupBy({
      by: ['userId'],
      where: { 
        companyId, 
        createdAt: { gte: umaSemanaAtras },
        // Opcional: contar apenas o que já foi pago ou tudo o que foi registrado
        // status: "PAGO" 
      },
      _count: { 
        id: true 
      },
      _sum: { 
        amount: true 
      },
      orderBy: {
        _count: {
          id: 'desc' // O erro estava aqui: troquei 'true' por 'desc'
        }
      },
      take: 5
    });

    // Buscar os nomes dos usuários do ranking
    const rankingComNomes = await Promise.all(
      rankingProdutividade.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { username: true }
        });
        return {
          username: user?.username || "Desconhecido",
          acoes: item._count.id,
          ganhos: item._sum.amount || 0
        };
      })
    );

    return NextResponse.json({
      metrics: {
        saldoTotal: lucroSemana._sum.amount || 0, // Exemplo: lucro acumulado
        vendasHojeCount: vendasHoje._count || 0,
        vendasHojeValor: vendasHoje._sum.amount || 0,
        funcionariosTotal: totalFuncionarios
      },
      ranking: rankingComNomes
    });

  } catch (error) {
    console.error("[DASHBOARD_ERROR]", error);
    return NextResponse.json({ error: "Erro ao processar dashboard" }, { status: 500 });
  }
}