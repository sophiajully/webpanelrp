import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { LRUCache } from 'lru-cache';
const cache = new LRUCache({
  max: 10000,
  ttl: 60 * 1000,
});


export async function middleware(req) {
  
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
  runtime: 'nodejs', 
  matcher: [
    /*
     * Aplica em todas as rotas de API e páginas, exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone)
     * - public (arquivos públicos como imagens/logos)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};