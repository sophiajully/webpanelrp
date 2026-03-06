import { Queue } from "@/lib/Queue"; // ajuste o caminho
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { taskName, payload } = await req.json();
        
        // Adiciona na fila do Prisma
        const job = await Queue.add(taskName, payload);
        
        return NextResponse.json({ success: true, jobId: job.id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}