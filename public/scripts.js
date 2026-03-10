window.app = {
    
    config: {
        webhookVendas: "",
        webhookLogs: "",
        nomeEmpresa: "SafraLog ERP",
        colorPrimary: "#8b0000",
        colorAccent: "#ff4c4c",
        enableMarket: true,
        enableHireRequest: true
    },
    companyId: null,
    encomendaAtual: [],
    carrinhoMercado: [],
    craftsCache: [],
    mercadoRawData: [],
    logsMeta: { page: 1, totalPages: 1 },
    senhaTemporaria: null,

    
    getEl: (id) => document.getElementById(id),
    getVal: (id) => document.getElementById(id)?.value || "",
    setVal: (id, val) => { const el = document.getElementById(id); if (el) el.value = val; },
    
    
 async apiFetch(endpoint, method = 'GET', body = null) {
    // 1. Tenta usar a ponte das Server Actions (Next.js)
    if (window.serverActions && window.serverActions.apiFetch) {
        try {
            const res = await window.serverActions.apiFetch(endpoint, method, body);
            if (res && res.error) throw new Error(res.error);
            return res;
        } catch (err) {
            console.error("Erro na Server Action:", err);
            throw err;
        }
    }

    // 2. Fallback (Fetch Direto) - Melhorado para evitar o erro de JSON
    const options = { 
        method, 
        headers: { 'Content-Type': 'application/json' } 
    };
    
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(endpoint, options);
        
        // Verifica se a resposta está vazia (status 204 No Content ou corpo vazio)
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            if (res.ok) return { success: true }; // Se deu certo mas não é JSON
            const errorText = await res.text();
            throw new Error(errorText || `Erro HTTP ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("Erro no Fetch:", err);
        throw new Error("Falha na comunicação: " + err.message);
    }
},

    
    init() {
        this.companyId = document.body.getAttribute("data-company-id");
        this.carregarConfig();
        this.carregarCrafts();
        this.renderizarPedidos();
        this.carregarLogs();
        
        const cp = this.getEl("colorPrimary");
        const ca = this.getEl("colorAccent");
        if (cp) cp.oninput = (e) => { this.config.colorPrimary = e.target.value; this.aplicarTema(); };
        if (ca) ca.oninput = (e) => { this.config.colorAccent = e.target.value; this.aplicarTema(); };
        
        const containerInsumos = this.getEl("listaInsumosDinamicos");
        if (containerInsumos && containerInsumos.children.length === 0) this.adicionarCampoInsumo();
    },

    
    async carregarConfig() {
        try {
            const dbConfig = await this.apiFetch(`/api/config?companyId=${this.companyId}`);
            if (dbConfig) {
                this.config = { ...this.config, ...dbConfig, nomeEmpresa: dbConfig.name || "COMPANY_NAME" };
            }
        } catch (err) {
            console.warn("Falha na API, usando LocalStorage.", err);
            const saved = JSON.parse(localStorage.getItem("painel_config") || "{}");
            this.config = { ...this.config, ...saved };
        }
        
        this.setVal("webhookVendasInput", this.config.webhookVendas);
        this.setVal("webhookLogsInput", this.config.webhookLogs);
        this.setVal("nomeEmpresaInput", this.config.nomeEmpresa);
        this.setVal("colorPrimary", this.config.colorPrimary);
        this.setVal("colorAccent", this.config.colorAccent);
        
        // Ajuste para Checkboxes
        const hireInput = this.getEl("enableHireRequestInput");
        const marketInput = this.getEl("enableMarketInput");
        if (hireInput) hireInput.checked = this.config.enableHireRequest;
        if (marketInput) marketInput.checked = this.config.enableMarket;

        this.aplicarTema();
    },

    async salvarConfig(companyId) {
        const novaConfig = {
            companyId,
            webhookVendas: this.getVal("webhookVendasInput"),
            webhookLogs: this.getVal("webhookLogsInput"),
            name: this.getVal("nomeEmpresaInput"),
            colorPrimary: this.getVal("colorPrimary"),
            colorAccent: this.getVal("colorAccent"),
            // Capturando o estado Booleano (true/false)
            enableHireRequest: this.getEl("enableHireRequestInput")?.checked,
            enableMarket: this.getEl("enableMarketInput")?.checked
        };

        try {
            await this.apiFetch('/api/config', 'PATCH', novaConfig);
            window.showToast(`Configurações Salvas!`, 'success')
            return novaConfig; 
        } catch (err) {
            window.showToast(`Erro`, 'error')
            return null;
        }
    },


    aplicarTema() {
        const root = document.documentElement;
        root.style.setProperty('--primary-red', this.config.colorPrimary);
        root.style.setProperty('--accent-red', this.config.colorAccent);
        
        this.setVal("colorPrimary", this.config.colorPrimary); 
        this.setVal("colorAccent", this.config.colorAccent);

        document.querySelectorAll('.btn-theme').forEach(btn => {
            btn.style.backgroundColor = this.config.colorAccent;
        });
    },

    
    async registrarLog({ action, details, category = "GERAL", userId = null }) {
        try {
            await this.apiFetch('/api/company-logs', 'POST', {
                companyId: this.companyId, userId, action, details, category
            });

            if (this.config.webhookLogs) {
                await this.enviarWebhook(this.config.webhookLogs, {
                    title: `[${category}] ${action}`,
                    color: action.includes('ERRO') ? 0xff4c4c : 0xe5b95f,
                    description: details,
                    timestamp: new Date().toISOString(),
                    footer: { text: "Sistema de Auditoria SafraLog" }
                });
            }

            if (this.getEl('tab-logs')?.style.display !== 'none') this.carregarLogs(1);
        } catch (err) {
            console.error("Erro ao registrar log centralizado:", err);
        }
    },

    async carregarLogs(page = 1, search = "") {
        const corpoTabela = this.getEl("tabelaLogsCorpo");
        if (!corpoTabela) return;

        try {
            const categoria = this.getVal("categoriaLogSelect");
            const res = await this.apiFetch(`/api/company-logs?companyId=${this.companyId}&page=${page}&limit=10&search=${search}&category=${categoria}`);
            
            this.logsMeta = res.meta;

            if (!res.logs || res.logs.length === 0) {
                corpoTabela.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#4b5563;">Nenhum registro encontrado.</td></tr>`;
                return this.atualizarControlesPaginacao();
            }

            corpoTabela.innerHTML = res.logs.map(log => {
                const cor = log.category === 'FINANCEIRO' ? '#22c55e' : log.category === 'RH' ? '#3b82f6' : log.action.includes('ERRO') ? '#ef4444' : '#d4a91c';
                return `
                    <tr style="border-bottom: 1px solid #11111a; transition: background 0.2s;" onmouseover="this.style.background='#0a0a0f'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 14px 8px; font-size: 0.8rem; color: #4b5563; font-family: monospace;">${new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                        <td style="padding: 14px 8px;"><span style="background: ${cor}22; color: ${cor}; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; border: 1px solid ${cor}44;">${log.action}</span></td>
                        <td style="padding: 14px 8px; font-size: 0.85rem; color: #eee; max-width: 400px; line-height: 1.4;">${log.details}</td>
                        <td style="padding: 14px 8px; font-size: 0.85rem; font-weight: bold; color: var(--cor-primaria, #d4a91c);">${log.user?.username || 'Sistema'}</td>
                    </tr>
                `;
            }).join('');

            this.atualizarControlesPaginacao();
        } catch (err) {
            corpoTabela.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Erro ao carregar dados.</td></tr>`;
        }
    },

    atualizarControlesPaginacao() {
        const info = this.getEl("paginacaoInfo");
        const btnPrev = this.getEl("btnPrevLog");
        const btnNext = this.getEl("btnNextLog");

        if (info) info.innerText = `Página ${this.logsMeta.page} de ${this.logsMeta.totalPages || 1}`;
        
        const setBtnState = (btn, isDisabled) => {
            if (!btn) return;
            btn.disabled = isDisabled;
            btn.style.opacity = isDisabled ? "0.3" : "1";
            btn.style.cursor = isDisabled ? "default" : "pointer";
        };

        setBtnState(btnPrev, this.logsMeta.page <= 1);
        setBtnState(btnNext, this.logsMeta.page >= this.logsMeta.totalPages);
    },

    mudarPaginaLog(delta) {
        const novaPagina = this.logsMeta.page + delta;
        if (novaPagina > 0 && novaPagina <= this.logsMeta.totalPages) {
            this.carregarLogs(novaPagina, this.getVal("searchLogInput"));
        }
    },

    async enviarWebhook(url, embed) {
        if (!url || url.trim() === "") return;
        try {
            await this.apiFetch('/api/queue', 'POST', {
                taskName: "ENVIAR_WEBHOOK_DISCORD",
                payload: { url, embed }
            });
        } catch (err) {
            console.error("Erro ao agendar webhook", err);
        }
    },

    
    async carregarCrafts() {
        try {
            const crafts = await this.apiFetch('/api/crafts');
            this.craftsCache = crafts;
            
            const select = this.getEl("produtoSelect");
            if (select) select.innerHTML = crafts.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

            const listaProd = this.getEl("listaCrafts");
            if (listaProd) {
                listaProd.innerHTML = crafts.map((c) => `
                    <div class="lista-item" style="background:#0c0c0c; padding:16px; border-radius:12px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.05)">
                        <div style="display: flex; justify-content: space-between; align-items:center">
                            <span style="font-weight:bold; color:#e5b95f">🥩 ${c.name}</span>
                            <button onclick="window.app.removerReceita('${c.id}')" style="background:none; border:none; color:#ff4c4c; cursor:pointer; font-size:0.7rem; font-weight:bold; text-transform:uppercase">excluir</button>
                        </div>
                        <div style="font-size:0.75rem; color:#666; margin-top:4px">Unidade: ${c.unit}</div>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error("Erro ao carregar crafts", err);
        }
    },

    async registrarCraft() {
        const nome = this.getVal("craftNome");
        const unidade = this.getVal("unidades");
        const price = this.getVal("price");
        
        if (!nome || !unidade || !price) return window.showToast(`Preencha os dados básicos!`, 'error')

        const insumos = Array.from(document.querySelectorAll(".insumo-row")).map(row => ({
            nome: row.querySelector(".insumo-nome").value,
            qtd: row.querySelector(".insumo-qtd").value
        })).filter(i => i.nome);

        try {
            window.showToast(`Registrando...`, 'loading')
            await this.apiFetch('/api/crafts', 'POST', { name: nome, unit: unidade, insumos, price });
            this.carregarCrafts();
            window.showToast(`Receita salva com sucesso!`, 'success')
            await this.registrarLog({ action: "RECEITA_CRIADA", category: "PRODUCAO", details: `O produto "${nome}" foi adicionado.` });
           
            this.limparCamposCraft();
            
        } catch (err) {
            window.showToast(`Erro ao salvar receita`, 'error')
        }
    },
    
    async removerReceita(id) {
        if (!await window.askConfirm("⚠️ Excluir permanentemente do banco de dados?")) return;
        try {
            window.showToast(`Removendo...`, 'loading')
            await this.apiFetch(`/api/crafts?id=${id}`, 'DELETE');
            this.carregarCrafts();
            await this.registrarLog({ action: "RECEITA_REMOVIDA", category: "PRODUCAO", details: `Uma receita (ID: ${id}) foi excluída.` });
            
            window.showToast(`Receita removida com sucesso`, 'success')
        } catch (err) {
            window.showToast(`Erro ao deletar receita.`, 'error')
        }
    },

    adicionarCampoInsumo() {
        const container = this.getEl("listaInsumosDinamicos");
        if (!container) return;
        const div = document.createElement("div");
        div.className = "insumo-row";
        div.style.cssText = "display: flex; gap: 8px; margin-bottom: 8px;";
        div.innerHTML = `
            <input type="text" placeholder="Insumo (Ex: Sal)" class="insumo-nome" style="flex:2; padding:8px; background:#0a0a0f; border:1px solid #333; color:white; border-radius:4px">
            <input type="number" placeholder="Qtd" class="insumo-qtd" style="flex:1; padding:8px; background:#0a0a0f; border:1px solid #333; color:white; border-radius:4px">
        `;
        container.appendChild(div);
    },

    limparCamposCraft() {
        this.setVal("craftNome", "");
        this.setVal("unidades", "");
        this.setVal("price", "");
        const li = this.getEl("listaInsumosDinamicos");
        if (li) { li.innerHTML = ""; this.adicionarCampoInsumo(); }
    },

    calcularMateriais(craftList, producaoQtds) {
        const totaisMateriais = {};
        const resumoCrafts = [];

        if (!craftList || !producaoQtds || Object.keys(producaoQtds).length === 0) {
            return window.showToast(`Digite a quantidade desejada antes de calcular!`, 'error')
        }

        Object.entries(producaoQtds).forEach(([id, qtd]) => {
            const qtdDesejada = parseInt(qtd);
            if (isNaN(qtdDesejada) || qtdDesejada <= 0) return;

            const craft = this.craftsCache.find(c => c.id == id);
            if (craft) {
                const unidadesPorCraft = parseInt(craft.unit) || 1;
                const rodadasDeCraft = Math.ceil(qtdDesejada / unidadesPorCraft);

                resumoCrafts.push({ nome: craft.name, rodadas: rodadasDeCraft, totalGerado: rodadasDeCraft * unidadesPorCraft });

                let insumos = typeof craft.insumos === 'string' ? JSON.parse(craft.insumos || '[]') : (craft.insumos || []);
                insumos.forEach(insumo => {
                    const nomeMaterial = insumo.nome || insumo.item; 
                    if (nomeMaterial) {
                        totaisMateriais[nomeMaterial] = (totaisMateriais[nomeMaterial] || 0) + (Number(insumo.qtd) || 0) * rodadasDeCraft;
                    }
                });
            }
        });

        this.renderizarResultadoProducao(resumoCrafts, totaisMateriais);
    },

    renderizarResultadoProducao(resumoCrafts, totaisMateriais) {
        const resDiv = this.getEl("materiaisResultado");
        const listaUl = this.getEl("listaInsumosSomados");

        listaUl.innerHTML = `
            <div style="margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">
                <h5 style="color: #d4a91c; margin-bottom: 8px; font-size: 0.8rem; text-transform: uppercase;">🔨 Execução de Crafts</h5>
                ${resumoCrafts.map(c => `
                    <div style="display:flex; justify-content:space-between; font-size: 0.85rem; margin-bottom: 4px;">
                        <span>${c.nome}</span><b style="color: #fff;">Fazer ${c.rodadas}x <small style="color: #666;">(Gera ${c.totalGerado})</small></b>
                    </div>`).join('')}
            </div>
            <div>
                <h5 style="color: #00ff90; margin-bottom: 8px; font-size: 0.8rem; text-transform: uppercase;">📦 Total de Materiais</h5>
                ${Object.entries(totaisMateriais).map(([nome, qtd]) => `
                    <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px solid #1f2430;">
                        <span style="color: #bbb;">${nome}</span><b style="color: #00ff90;">x${qtd}</b>
                    </div>`).join('')}
            </div>
        `;
        resDiv.style.display = 'block';
        resDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    
    adicionarItem() {
        const nome = this.getVal("produtoSelect");
        const qtd = parseInt(this.getVal("quantidadeItem"));
        
        if (!nome || !qtd) return window.showToast(`Selecione a quantidade do Item`, "error")

        const produto = this.craftsCache.find(c => c.name === nome);
        this.encomendaAtual.push({ nome, qtd, precoUn: produto?.price || 0 });
        
        this.atualizarViewEncomenda();
        this.setVal("quantidadeItem", "");
    },

    atualizarViewEncomenda() {
        const container = this.getEl("listaEncomenda");
        if (container) {
            container.innerHTML = this.encomendaAtual.map(item => `
                <div style="padding:5px 0; border-bottom:1px solid #333; font-size:0.9rem">📦 <b>${item.nome}</b> x${item.qtd}</div>
            `).join('');
        }
    },

  async calcularEncomenda() {
    window.showToast("A registar encomenda...", "loading");
    const name = this.getVal("clienteNome");
    const pombo = this.getVal("clientePombo") || "Não informado";

    if (!name || this.encomendaAtual.length === 0) {
        return window.showToast(`Preencha o nome/dados do cliente`, "error")
    }

    // Cálculo do total
    const total = this.encomendaAtual.reduce((acc, item) => {
        const preco = parseFloat(String(item.precoUn).replace(',', '.'));
        return acc + (preco * item.qtd);
    }, 0);

    // --- FEEDBACK VISUAL INSTANTÂNEO (UI OTIMISTA) ---
    const btn = document.querySelector('button[onclick*="calcularEncomenda"]');
    const containerPedidos = this.getEl("listaPedidosGeral");
    
    if (btn) btn.disabled = true; // Evita cliques duplos durante o processamento
    if (containerPedidos) containerPedidos.style.opacity = "0.5"; // Indica que está salvando

    try {

        const pedidoCriado = await this.apiFetch('api/pedidos', 'POST', { 
        name, 
        pombo, 
        produtos: this.encomendaAtual 
    }).catch(e => console.log(e.message))


    // Verificação de segurança: se a action falhou mas não jogou erro
    if (!pedidoCriado || pedidoCriado.error) {
        throw new Error(pedidoCriado?.error || "Resposta inválida do servidor");
    }
        // 3. Registro de Log Centralizado
        // Esta função também usará a Server Action internamente via apiFetch
        await this.registrarLog({ 
            action: "VENDA_REALIZADA", 
            category: "FINANCEIRO", 
            details: `Venda para ${name}. Total: $${total.toLocaleString()}.` 
        });

        // 4. Disparo do Webhook via Fila (Queue) no Servidor
        const itensTexto = this.encomendaAtual.map(i => `🔸 **${i.nome}** (x${i.qtd})`).join('\n');
        
        await this.enviarWebhook(this.config.webhookVendas, {
            title: "Nova Encomenda Recebida!",
            color: 0x00ff90,
            fields: [
                { name: "👤 Cliente", value: name, inline: true },
                { name: "🕊️ Contato", value: pombo, inline: true },
                { name: "💰 Valor total", value: `$ ${total.toLocaleString()}` },
                { name: "📝 Itens da Encomenda", value: itensTexto }
            ],
            footer: { text: `SafraLog ID: ${pedidoCriado.id || 'Processado'}` },
            timestamp: new Date().toISOString()
        });

        // 5. Limpeza e Atualização da Interface
        this.encomendaAtual = [];
        this.setVal("clienteNome", "");
        this.setVal("clientePombo", "");
        
        this.atualizarViewEncomenda(); // Limpa a lista de itens atual
        await this.renderizarPedidos(); // Atualiza a lista geral de pedidos

        window.showToast("Encomenda guardada com sucesso!", "success");

    } catch (err) {
        console.error("Erro na operação:", err.message);
        window.showToast("Erro na operação: " + err.message, "error");
    } finally {
        // Restaura o estado visual original
        if (btn) btn.disabled = false;
        if (containerPedidos) containerPedidos.style.opacity = "1";
    }
},

    async renderizarPedidos() {
        const container = this.getEl("listaPedidosGeral");
        if (!container) return;

        try {
            const pedidos = await this.apiFetch('/api/pedidos');
            if (!pedidos || pedidos.length === 0) {
                return container.innerHTML = "<p style='color:#666; padding:20px; text-align:center'>Nenhum pedido no sistema.</p>";
            }

            container.innerHTML = pedidos.map(p => `
                <div class="card" style="border-left: 4px solid ${p.status === 'finalizado' ? '#00ff90' : '#f1c40f'}; margin-bottom: 12px; background: #161625; padding: 15px; border-radius: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items: center;">
                        <strong style="color: #fff; font-size: 1rem;">👤 ${p.name}</strong>
                        <span style="font-size:0.6rem; color: #555; background: #0d0d15; padding: 3px 8px; border-radius: 4px;">ID: ${p.id.slice(0,8)}...</span>
                    </div>
                    <div style="margin:12px 0; font-size:0.85rem; color: #bbb; line-height: 1.5;">
                        <div style="color: #888; margin-bottom: 5px;">📞 Contato: ${p.pombo}</div>
                        ${p.produtos.map(i => `<span style="color: #eee;">•</span> ${i.nome} <b style="color: #ff4c4c">(x${i.qtd})</b>`).join('<br>')}
                    </div>
                    <div style="display:flex; gap:10px; margin-top: 10px; border-top: 1px solid #2a2a3a; padding-top: 12px;">
                        ${p.status !== 'finalizado' 
                            ? `<button onclick="window.app.alterarStatusPedido('${p.id}', 'finalizado')" class="btn-ok" style="background: #00ff90; color: #052c1a; padding: 8px 15px; border-radius: 6px; font-weight: bold; border:none; cursor:pointer;">✅ Concluir</button>` 
                            : `<span style="color: #00ff90; font-size: 0.75rem; font-weight: bold;">✓ FINALIZADO</span>`
                        }
                        <button onclick="window.app.removerPedido('${p.id}')" style="background: rgba(255, 76, 76, 0.1); border: 1px solid #ff4c4c; color: #ff4c4c; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor:pointer;">🗑️ Excluir</button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = "<p style='color:red; text-align:center'>Erro ao carregar pedidos.</p>";
        }
    },

async alterarStatusPedido(id, status) {

    const card = document.querySelector(`[onclick*="${id}"]`).closest('.card');
    if (card) {
        card.style.opacity = '0.5'; 
        card.style.borderLeftColor = '#00ff90';
    }

    try {
        await this.apiFetch('/api/pedidos', 'PATCH', { id, status });
        this.renderizarPedidos(); 
        card.style.opacity = '1';
         await this.registrarLog({ action: "PEDIDO_FINALIZADO", category: "LOGISTICA", details: `Pedido de ${p.name} concluído.` });
    } catch (err) { 
        // 3. Reverte se der erro
        window.showToast("Error: " + err.message, "error");
        this.renderizarPedidos(); 
    }
},


    async removerPedido(id) {
        if (!await window.askConfirm(`⚠️ Deseja realmente excluir este pedido?`)) return;
        try {
            await this.apiFetch(`/api/pedidos?id=${id}`, 'DELETE');
            await this.registrarLog({ action: "PEDIDO_REMOVIDO", category: "LOGISTICA", details: `Pedido ${id} removido.` });
            this.renderizarPedidos();
        } catch (err) { window.showToast("Error: " + err.message, "error"); }
    },

    
    adicionarAoCarrinhoMercado(id, nome, preco) {
        const qtd = parseInt(this.getVal(`qtd_mercado_${id}`));
        if (!qtd || qtd <= 0) return window.showToast("Quantidade Invalida!", "error");

        const existente = this.carrinhoMercado.find(i => i.id === id);
        existente ? existente.qtd += qtd : this.carrinhoMercado.push({ id, nome, preco, qtd });
        
        this.renderizarCarrinhoMercado();
        this.setVal(`qtd_mercado_${id}`, "");
    },

    removerDoCarrinhoMercado(index) {
        this.carrinhoMercado.splice(index, 1);
        this.renderizarCarrinhoMercado();
    },

    renderizarCarrinhoMercado() {
        const container = this.getEl("itensCarrinhoMercado");
        if (!container) return;
        if (this.carrinhoMercado.length === 0) return container.innerHTML = '<span style="color:#4b5563;">Vazio...</span>';

        const total = this.carrinhoMercado.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
        container.innerHTML = this.carrinhoMercado.map((item, index) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:rgba(255,255,255,0.03); padding:8px; border-radius:6px; border: 1px solid rgba(255,255,255,0.05)">
                <div style="display:flex; flex-direction:column">
                    <span style="font-size:0.85rem; color:#eee">${item.nome}</span>
                    <span style="font-size:0.7rem; color:#666">x${item.qtd} - $${(item.preco * item.qtd).toFixed(2)}</span>
                </div>
                <button onclick="window.app.removerDoCarrinhoMercado(${index})" style="background:none; border:none; color:#ff4c4c; cursor:pointer; font-weight:bold;">✕</button>
            </div>
        `).join('') + `
            <div style="margin-top:15px; border-top:1px dashed #3d2b1f; padding-top:10px; display:flex; justify-content:space-between; align-items:center">
                <span style="color:#d4a91c; font-size:0.8rem; font-weight:bold">TOTAL:</span>
                <span style="color:#00ff90; font-weight:bold; font-size:1.1rem">$ ${total.toFixed(2)}</span>
            </div>
        `;
    },

    async enviarPropostaMercado() {
        if (this.carrinhoMercado.length === 0 || !this.empresaSelecionadaId) return window.showToast("Carrinho vazio ou empresa não selecionada!", "error")
        const empresaAlvo = this.mercadoRawData.find(c => c.id === this.empresaSelecionadaId);
        if(!empresaAlvo) return window.showToast("Empresa alvo não encontrada nos dados.", "error")

        const total = this.carrinhoMercado.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
        const itensTexto = this.carrinhoMercado.map(i => `🔸 **${i.nome}** (x${i.qtd}) - $${(i.preco * i.qtd).toFixed(2)}`).join('\n');

        try {
            if (empresaAlvo.webhookVendas) {
                await this.enviarWebhook(empresaAlvo.webhookVendas, {
                    title: "Nova Proposta Comercial Recebida!",
                    color: 0xd4a91c,
                    fields: [
                        { name: "👤 Cliente", value: this.config.nomeEmpresa, inline: true },
                        { name: "💰 Valor total", value: `$ ${total.toFixed(2)}` },
                        { name: "📝 Itens da Encomenda", value: itensTexto }
                    ],
                    footer: { text: `SafraLog` },
                    timestamp: new Date().toISOString()
                });
            }
             window.showToast(`Proposta comercial enviada para ${empresaAlvo.name}!`, "success")

            this.carrinhoMercado = [];
            this.renderizarCarrinhoMercado();
        } catch (err) { window.showToast(`Não foi possível enviar a proposta`, "error") }
    },

    
    gerarSenhaForte(tamanho) {
        const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return Array.from({length: tamanho}, () => charset.charAt(Math.floor(Math.random() * charset.length))).join('');
    },

    abrirModalContratacao() {
        this.senhaTemporaria = this.gerarSenhaForte(8);
        this.getEl('new_func_pass_display').innerText = this.senhaTemporaria;
        this.setVal('new_func_username', "");
        this.getEl('modalContratacao').style.display = 'flex';
    },

    exibirModalSenha(username, senha) {
        const html = `
            <div id="tempModalSenha" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999;">
                <div style="background:#1e1e2f; padding:30px; border-radius:15px; border-top:5px solid #00ff90; width:350px; text-align:center; box-shadow: 0 10px 30px rgba(0,0,0,0.5)">
                    <h3 style="color:#fff; margin-bottom:10px">🔑 Senha Gerada</h3>
                    <p style="color:#888; font-size:0.9rem">Passe os dados abaixo para <b>${username}</b></p>
                    <div style="background:#0d0f14; padding:15px; border-radius:8px; margin:20px 0; border:1px dashed #00ff90; position:relative">
                        <span style="color:#00ff90; font-family:monospace; font-size:1.2rem; letter-spacing:2px">${senha}</span>
                    </div>
                    <button onclick="navigator.clipboard.writeText('${senha}');  window.showToast('Copiado', 'success')" style="width:100%; background:#00ff90; color:#000; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:10px">COPIAR SENHA</button>
                    <button onclick="document.getElementById('tempModalSenha').remove()" style="background:none; border:none; color:#ff4c4c; cursor:pointer; font-size:0.8rem">FECHAR</button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    async resetarSenhaFuncionario(userId, username) {
        const novaSenha = this.gerarSenhaForte(8);
        if (!await window.askConfirm(`Deseja resetar a senha de ${username}?\nA nova senha será: ${novaSenha}`)) return;

        try {
            await this.apiFetch('/api/users/reset-password', 'PATCH', { userId, newPassword: novaSenha });
            await this.registrarLog({ action: "SENHA_RESETADA", category: "SEGURANCA", details: `Senha de ${username} redefinida.` });
            this.exibirModalSenha(username, novaSenha);
            if(this.getEl('modalContratacao')) this.getEl('modalContratacao').style.display = 'none';
        } catch (err) { window.showToast(`Erro ao resetar senha`, 'error') }
    },

    async executarContratacao() {
        const roleInput = this.getEl('new_func_role');
        const username = this.getVal('new_func_username').trim();
        const roleId = roleInput?.value || "";
        const roleText = roleInput?.options[roleInput.selectedIndex]?.text || "Não definido";
        const password = this.senhaTemporaria; 

        if (!username) return window.showToast(`Digite um nome de usuário`, 'error');

        try {
            await this.apiFetch('/api/users', 'POST', { username, password, roleId, companyId: this.companyId });
            await this.registrarLog({ action: "FUNCIONARIO_ADMITIDO", category: "RH", details: `Colaborador ${username} contratado.` });
            
            window.showToast(`✅ FUNCIONÁRIO CONTRATADO!\nUsuário: ${username}\nSenha: ${password}\nCopie-a agora!`, 'success')

            this.getEl('modalContratacao').style.display = 'none';
            typeof this.carregarEquipe === "function" ? this.carregarEquipe() : window.location.reload();
        } catch (err) { window.showToast(`Erro ao tentar contratar`, 'error') }
    },

    async excluirRole(id, nome) {
        if (!await window.askConfirm(`⚠️ Excluir o cargo "${nome}" permanentemente?`)) return;
        try {
            await this.apiFetch(`/api/roles?id=${id}`, 'DELETE');
            await this.registrarLog({ action: "CARGO_REMOVIDO", category: "RH", details: `Cargo ${nome} excluído.` });
            window.showToast(`Cargo excluído com sucesso!`, 'success')
            if(window.carregarRoles) window.carregarRoles();
        } catch (err) { window.showToast(`Falha ao excluir cargo`, 'error') }
    }
};


window.toggleModal = function(show) { 
    const modal = document.getElementById('modalSettings');
    if (modal) modal.style.display = show ? 'flex' : 'none'; 
};


if (document.readyState === "complete" || document.readyState === "interactive") {
    window.app.init();
} else {
    document.addEventListener("DOMContentLoaded", () => window.app.init());
}