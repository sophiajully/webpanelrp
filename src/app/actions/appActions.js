'use server'

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Exemplo de uma Server Action para buscar dados
export async function getAppData(endpoint) {
    try {

        const res = await fetch(`${endpoint}`, {
            cache: 'no-store'
        });
        return await res.json();
    } catch (e) {
        return { error: "Falha ao carregar dados no servidor" };
    }
}


export async function submitServerAction(endpoint, method = 'GET', body = null) {
    try {
        let cleanPath = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        if (!cleanPath.startsWith('api/')) {
            cleanPath = `api/${cleanPath}`;
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000';
        const url = `${baseUrl}/${cleanPath}`;

        console.log(`[Server Action] Executando: ${method} ${url}`);

        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

  
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': allCookies
            },
            cache: 'no-store',
        };


        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(url, options);

        // 3. Verificação de conteúdo antes de dar .json()
        const text = await res.text();
        
        if (!res.ok) {
            console.error(`[API Error] Status ${res.status}: ${text}`);
            return { error: `Erro na API (${res.status}): ${text || 'Sem resposta'}` };
        }

        if (!text) return { success: true };

        try {
            const data = JSON.parse(text);
            if (method !== 'GET') revalidatePath('/');
            return data;
        } catch (parseError) {
            return { error: "O servidor não retornou um JSON válido.", details: text };
        }

    } catch (e) {
        console.error("ERRO CRÍTICO NA ACTION:", e.message);
        return { error: `Falha de conexão interna: ${e.message}` };
    }
}