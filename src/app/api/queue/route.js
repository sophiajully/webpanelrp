import { Queue } from "@/lib/Queue"; 
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export async function POST(req) {
    const session = await getServerSession(authOptions);
    
      
      if (!session || session.user.name !== "admin") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
    try {
        const { taskName, payload } = await req.json();
        
        
        const job = await Queue.add(taskName, payload);
        
        return NextResponse.json({ success: true, jobId: job.id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}