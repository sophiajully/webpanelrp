import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true }
    });
    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}