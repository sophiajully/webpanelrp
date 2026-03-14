'use server'

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const getSafeUrl = (endpoint) => {
    const host = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : (process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000');

    let cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (!cleanPath.startsWith('/api/')) {
        cleanPath = `/api${cleanPath}`;
    }
    return `${host}${cleanPath}`;
}


export async function getAppData(endpoint) {
    try {
        const url = getSafeUrl(endpoint);

        const res = await fetch(url, {
            cache: 'no-store',
            headers: {
    'Content-Type': 'application/json',
    'x-internal-secret': process.env.INTERNAL_API_SECRET, 
  }
        });
        
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        
        return await res.json();
    } catch (e) {
        console.error("Erro no getAppData:", e.message);
        return { error: "Falha ao carregar dados no servidor" };
    }
}

export async function submitServerAction(endpoint, method = 'GET', body = null) {
    try {
        const url = getSafeUrl(endpoint);

        console.log(`[Server Action] Tentando conectar em: ${url}`);

        const cookieStore = await cookies();
        const allCookies = cookieStore.toString(); 

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': allCookies,
                'x-internal-secret': process.env.INTERNAL_API_SECRET, 
            },
            cache: 'no-store',
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

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