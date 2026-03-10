'use server'

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function submitServerAction(endpoint, method = 'GET', body = null) {
    try {
        // 1. LIMPEZA DA URL
        let cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        if (!cleanPath.startsWith('/api/')) {
            cleanPath = `/api${cleanPath}`;
        }

        // 2. O SEGREDO PARA VERCEL: 
        // Se estivermos no servidor, usamos uma URL RELATIVA ou o Host interno.
        // Na Vercel, o 'fetch' para rotas internas deve preferencialmente ser evitado,
        // mas se for usar, precisamos garantir o protocolo correto.
        
        const host = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : (process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000');
            
        const url = `${host}${cleanPath}`;

        console.log(`[Server Action] Tentando conectar em: ${url}`);

        const cookieStore = await cookies();
        // Importante: Pegar apenas o cookie de sessão para evitar headers gigantes
        const sessionCookie = cookieStore.get('next-auth.session-token') || cookieStore.get('__Secure-next-auth.session-token');
        const cookieHeader = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : '';

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader // Envia apenas o necessário
            },
            cache: 'no-store',
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        // 3. FETCH COM TIMEOUT (Para não travar a Vercel)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8 segundos de limite

        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);

        const text = await res.text();
        
        if (!res.ok) {
            return { error: `Erro na API (${res.status}): ${text}` };
        }

        if (!text) return { success: true };

        const data = JSON.parse(text);
        if (method !== 'GET') revalidatePath('/');
        return data;

    } catch (e) {
        console.error("ERRO CRÍTICO NA ACTION:", e.message);
        return { error: `Erro: ${e.message === 'The user aborted a request.' ? 'Timeout na conexão interna' : e.message}` };
    }
}