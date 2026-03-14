import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { LRUCache } from 'lru-cache';

// Nota sobre o cache: Em ambientes Serverless/Edge (como Vercel), 
// a memória não é compartilhada entre as instâncias. O rate limit será por "nó".
const cache = new LRUCache({
  max: 10000,
  ttl: 500 * 1000,
});

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/')) {
    
    // Defesa A: Impede o usuário de digitar a URL no navegador (Navegação Direta)
    // O navegador envia 'navigate' quando o usuário acessa pela barra de endereços
    const secFetchMode = req.headers.get('sec-fetch-mode');
    if (secFetchMode === 'navigate') {
      return new NextResponse(
        JSON.stringify({ 
          error: "Acesso negado", 
          message: "Acesso direto a esta rota pelo navegador não é permitido." 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    
    const internalSecret = req.headers.get('x-internal-secret');
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
      return new NextResponse(
        JSON.stringify({ error: "Acesso não autorizado", message: "Credenciais de servidor inválidas." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
  }

  // ----------------------------------------------------------------------
  // 2. CAMADA DE SEGURANÇA: RATE LIMITING & AUTENTICAÇÃO
  // ----------------------------------------------------------------------
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  const id = token?.sub || req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
  
  const limit = 60; 
  const currentUsage = cache.get(id) || 0;

  if (currentUsage >= limit) {
    return new NextResponse(
      JSON.stringify({ 
        error: "Muitas requisições", 
        message: "Você atingiu o limite global de segurança. Tente novamente em 1 minuto." 
      }),
      { 
        status: 429, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  cache.set(id, currentUsage + 1);

  const response = NextResponse.next();
  
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', (limit - currentUsage - 1).toString());
  
  return response;
}

export const config = {
  // ATENÇÃO: O Next.js Middleware suporta estritamente o Edge Runtime.
  // Se você for fazer deploy na Vercel, 'nodejs' pode causar erro no build para o middleware.
  // Se der problema, remova a linha abaixo ou troque para 'edge'.
  runtime: 'nodejs', 
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};