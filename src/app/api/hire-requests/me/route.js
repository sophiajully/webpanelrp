import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const requests = await prisma.hireRequest.findMany({
    where: { userId: session.user.id, status: "pending" },
    select: { companyId: true }
  });
  return NextResponse.json(requests);
}