



window.app = {
    config: {
        webhookVendas: "",
        webhookLogs: "",
        nomeEmpresa: "SafraLog ERP",
        colorPrimary: "#8b0000",
        colorAccent: "#ff4c4c"
    },
    encomendaAtual: [],
    companyId: null,

    init() {

        this.companyId = document.body.getAttribute("data-company-id");

        
        this.carregarConfig();
        this.carregarCrafts();
        this.aplicarTema();
        this.renderizarPedidos();
        this.carregarLogs()
        const cp = document.getElementById("colorPrimary");
        const ca = document.getElementById("colorAccent");
        
        if (cp) cp.oninput = (e) => { this.config.colorPrimary = e.target.value; this.aplicarTema(); };
        if (ca) ca.oninput = (e) => { this.config.colorAccent = e.target.value; this.aplicarTema(); };
        
        // Inicializa o primeiro campo de insumo se estiver na aba de craft
        const container = document.getElementById("listaInsumosDinamicos");
        if (container && container.children.length === 0) {
            this.adicionarCampoInsumo();
        }
    },
async calcularEncomenda() {
    const nomeCliente = document.getElementById("clienteNome")?.value;
    const contatoCliente = document.getElementById("clientePombo")?.value;

    if (!nomeCliente || this.encomendaAtual.length === 0) {
        return alert("Preencha o nome do cliente e adicione pelo menos um item!");
    }




    // 1. Calcular Total (apenas para o Webhook, já que a Model Pedido foca nos itens)
   const total = this.encomendaAtual.reduce((acc, item) => {
    const p = parseFloat(String(item.precoUn).replace(',', '.'));

    return acc + (p * item.qtd);
}, 0);


    // 2. Preparar os dados para o Banco de Dados (API POST)
    const dadosPedido = {
        name: nomeCliente,
        pombo: contatoCliente || "Não informado",
        produtos: this.encomendaAtual // O backend vai transformar em String JSON
    };

    try {
        // 3. Enviar para a API
        const response = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPedido)
        });

        if (!response.ok) throw new Error("Erro ao salvar o pedido no servidor.");

        const pedidoCriado = await response.json();

        const itensTexto = this.encomendaAtual.map(i => `🔸 **${i.nome}** (x${i.qtd})`).join('\n');
        await this.registrarLog({
    action: "VENDA_REALIZADA",
    category: "FINANCEIRO",
    details: `Nova venda registrada para ${nomeCliente}. Valor Total: $${total.toLocaleString()}.`
});
        await this.enviarWebhook(this.config.webhookVendas, {
            title: "Nova Encomenda Recebida!",
            color: 0x00ff90,
            fields: [
                { name: "👤 Cliente", value: nomeCliente, inline: true },
                { name: "🕊️ Contato", value: contatoCliente || "Não informado", inline: true },
                { name: "💰 Valor total", value: `$ ${total.toLocaleString()}` },
                { name: "📝 Itens da Encomenda", value: itensTexto },
                
            ],
            footer: { text: `SafraLog ID: ${pedidoCriado.id}` },
            timestamp: new Date().toISOString()
        });

        // 5. Finalizar e Limpar Interface
        alert(`Pedido finalizado com sucesso!`);
        
        this.encomendaAtual = [];
        const inputNome = document.getElementById("clienteNome");
        const inputPombo = document.getElementById("clientePombo");
        if (inputNome) inputNome.value = "";
        if (inputPombo) inputPombo.value = "";

        this.atualizarViewEncomenda();
        this.renderizarPedidos(); // Recarrega a lista da aba de pedidos vindo do banco

    } catch (err) {

        alert("Falha ao salvar pedido: " + err.message);
    }
},

    async carregarConfig() {
        const companyId = this.companyId
        // 1. Tenta carregar do Prisma via API
        try {
            const response = await fetch(`/api/config?companyId=${companyId}`);


            const dbConfig = await response.json();

            if (dbConfig && !dbConfig.error) {
                this.config = {
                    webhookVendas: dbConfig.webhookVendas || "",
                    webhookLogs: dbConfig.webhookLogs || "",
                    nomeEmpresa: dbConfig.name || "COMPANY_NAME",
                    colorPrimary: dbConfig.colorPrimary || "#8b0000",
                    colorAccent: dbConfig.colorAccent || "#ff4c4c"
                };
            }
        } catch (err) {

            // Fallback para LocalStorage se a rede falhar
            const saved = JSON.parse(localStorage.getItem("painel_config") || "{}");
            this.config = { ...this.config, ...saved };
        }
        
        // Atualiza os inputs na tela
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };

        setVal("webhookVendasInput", this.config.webhookVendas);
        setVal("webhookLogsInput", this.config.webhookLogs);
        setVal("nomeEmpresaInput", this.config.nomeEmpresa);
        setVal("colorPrimary", this.config.colorPrimary);
        setVal("colorAccent", this.config.colorAccent);
        
        this.aplicarTema();
    },

// scripts.js
async salvarConfig(companyId) {
    const getVal = (id) => document.getElementById(id)?.value || "";

    const novaConfig = {
        companyId: companyId,
        webhookVendas: getVal("webhookVendasInput"),
        webhookLogs: getVal("webhookLogsInput"),
        name: getVal("nomeEmpresaInput"),
        colorPrimary: getVal("colorPrimary"),
        colorAccent: getVal("colorAccent")
    };

    try {
        const response = await fetch('/api/config', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaConfig)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "Erro desconhecido");

        alert("Configurações salvas!");
        if (window.toggleModal) window.toggleModal(false);


        return novaConfig; 

    } catch (err) {

        alert(`Erro ao salvar: ${err.message}`);
        return null;
    }
},
// Adicione estas funções dentro do objeto window.app = { ... }

    // --- ESTADO DOS LOGS ---
    logsMeta: { page: 1, totalPages: 1 },

    // --- FUNÇÃO MESTRA: REGISTRAR E ENVIAR LOG ---
    async registrarLog({ action, details, category = "GERAL" }) {
        try {
            // 1. Salva no Banco de Dados (Prisma)
            const res = await fetch('/api/company-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: this.companyId,
                    action: action,
                    details: details,
                    category: category
                })
            });

            if (document.getElementById('tab-logs')?.style.display !== 'none') {
                this.carregarLogs(1);
            }
        } catch (err) {
            console.error("Erro ao registrar log:", err);
        }
    },

    // --- CARREGAR LOGS COM PAGINAÇÃO E FILTRO ---
    async carregarLogs(page = 1, search = "") {
        const corpoTabela = document.getElementById("tabelaLogsCorpo");
        if (!corpoTabela) return;

        try {
            // Adicionamos a categoria se houver um select de filtro
            const categoria = document.getElementById("categoriaLogSelect")?.value || "";
            
            const url = `/api/company-logs?companyId=${this.companyId}&page=${page}&limit=10&search=${search}&category=${categoria}`;
            const res = await fetch(url);
            const { logs, meta } = await res.json();

            this.logsMeta = meta;

            if (!logs || logs.length === 0) {
                corpoTabela.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#4b5563;">Nenhum registro encontrado.</td></tr>`;
                this.atualizarControlesPaginacao();
                return;
            }

            corpoTabela.innerHTML = logs.map(log => {
                const cor = log.category === 'FINANCEIRO' ? '#22c55e' : 
                            log.category === 'RH' ? '#3b82f6' : 
                            log.action.includes('ERRO') ? '#ef4444' : '#d4a91c';

                return `
                    <tr style="border-bottom: 1px solid #11111a; transition: background 0.2s;" onmouseover="this.style.background='#0a0a0f'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 14px 8px; font-size: 0.8rem; color: #4b5563; font-family: monospace;">
                            ${new Date(log.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td style="padding: 14px 8px;">
                            <span style="background: ${cor}22; color: ${cor}; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; border: 1px solid ${cor}44;">
                                ${log.action}
                            </span>
                        </td>
                        <td style="padding: 14px 8px; font-size: 0.85rem; color: #eee; max-width: 400px; line-height: 1.4;">
                            ${log.details}
                        </td>
                        <td style="padding: 14px 8px; font-size: 0.85rem; font-weight: bold; color: var(--cor-primaria, #d4a91c);">
                            ${log.user?.username || 'Sistema'}
                        </td>
                    </tr>
                `;
            }).join('');

            this.atualizarControlesPaginacao();
        } catch (err) {
            console.error("Erro ao carregar logs:", err);
            corpoTabela.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Erro ao carregar dados.</td></tr>`;
        }
    },

    // --- CONTROLES DE NAVEGAÇÃO ---
    atualizarControlesPaginacao() {
        const info = document.getElementById("paginacaoInfo");
        const btnPrev = document.getElementById("btnPrevLog");
        const btnNext = document.getElementById("btnNextLog");

        if (info) info.innerText = `Página ${this.logsMeta.page} de ${this.logsMeta.totalPages || 1}`;
        
        if (btnPrev) {
            btnPrev.disabled = this.logsMeta.page <= 1;
            btnPrev.style.opacity = btnPrev.disabled ? "0.3" : "1";
            btnPrev.style.cursor = btnPrev.disabled ? "default" : "pointer";
        }
        
        if (btnNext) {
            btnNext.disabled = this.logsMeta.page >= this.logsMeta.totalPages;
            btnNext.style.opacity = btnNext.disabled ? "0.3" : "1";
            btnNext.style.cursor = btnNext.disabled ? "default" : "pointer";
        }
    },

    mudarPaginaLog(delta) {
        const novaPagina = this.logsMeta.page + delta;
        if (novaPagina > 0 && novaPagina <= this.logsMeta.totalPages) {
            const busca = document.getElementById("searchLogInput")?.value || "";
            this.carregarLogs(novaPagina, busca);
        }
    },
    aplicarTema() {
        const root = document.documentElement;
        root.style.setProperty('--primary-red', this.config.colorPrimary);
        root.style.setProperty('--accent-red', this.config.colorAccent);
        
        const cp = document.getElementById("colorPrimary");
        const ca = document.getElementById("colorAccent");
        if (cp) cp.style.backgroundColor = this.config.colorPrimary;
        if (ca) ca.style.backgroundColor = this.config.colorAccent;

        document.querySelectorAll('.btn-theme').forEach(btn => {
            btn.style.backgroundColor = this.config.colorAccent;
        });
    },
    async excluirRole(id, nome) {
        // Validação básica para não excluir sem querer
        if (!confirm(`⚠️ Tem certeza que deseja excluir o cargo "${nome}" permanentemente?`)) return;

        try {
            // 1. Chamada para a API (seguindo seu padrão de DELETE)
            const res = await fetch(`/api/roles?id=${id}`, { method: 'DELETE' });
            
            if (!res.ok) {
                const erro = await res.json();
                throw new Error(erro.error || "Erro ao deletar do servidor");
            }

            // 2. Enviar Webhook de Log (opcional, seguindo seu padrão)
            this.enviarWebhook(this.config.webhookLogs, {
                title: "🛡️ Cargo Removido",
                color: 0xff4c4c,
                description: `O cargo **${nome}** foi excluído do sistema por um administrador.`,
                timestamp: new Date().toISOString()
            });

            alert("Cargo excluído com sucesso!");

            // 3. Recarregar para atualizar a lista (como você faz em removerReceita)
            window.carregarRoles()

        } catch (err) {

            alert("Falha ao excluir: " + err.message);
        }
    },
async carregarCrafts() {
        try {
            const res = await fetch('/api/crafts'); // A rota API já filtra por empresa no servidor
            const crafts = await res.json();
            
            const select = document.getElementById("produtoSelect");
            if (select) {
                select.innerHTML = crafts.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            }

            const listaProd = document.getElementById("listaCrafts");
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
            // Guarda na memória para uso rápido na venda
            this.craftsCache = crafts;
        } catch (err) {

        }
    },
    adicionarAoCarrinhoMercado(id, nome, preco) {
        const input = document.getElementById(`qtd_mercado_${id}`);
        const qtd = parseInt(input?.value);

        if (!qtd || qtd <= 0) return alert("Digite uma quantidade válida!");

        // Verifica se já tem no carrinho para só somar a quantidade
        const itemExistente = this.carrinhoMercado.find(i => i.id === id);
        if (itemExistente) {
            itemExistente.qtd += qtd;
        } else {
            this.carrinhoMercado.push({ id, nome, preco, qtd });
        }
        
        this.renderizarCarrinhoMercado();
        if (input) input.value = "";
    },

   removerDoCarrinhoMercado(index) {
        this.carrinhoMercado.splice(index, 1);
        this.renderizarCarrinhoMercado();
    },
    renderizarCarrinhoMercado() {
        const container = document.getElementById("itensCarrinhoMercado");
        if (!container) return;

        if (this.carrinhoMercado.length === 0) {
            container.innerHTML = '<span style="color: #4b5563;">Nenhum item selecionado...</span>';
            return;
        }

        const total = this.carrinhoMercado.reduce((acc, item) => acc + (item.preco * item.qtd), 0);

        container.innerHTML = this.carrinhoMercado.map((item, index) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:rgba(255,255,255,0.03); padding:8px; border-radius:6px; border: 1px solid rgba(255,255,255,0.05)">
                <div style="display:flex; flex-direction:column">
                    <span style="font-size:0.85rem; color:#eee">${item.nome}</span>
                    <span style="font-size:0.7rem; color:#666">x${item.qtd} - $${(item.preco * item.qtd).toFixed(2)}</span>
                </div>
                <button onclick="window.app.removerDoCarrinhoMercado(${index})" style="background:none; border:none; color:#ff4c4c; cursor:pointer; font-weight:bold; padding:5px">✕</button>
            </div>
        `).join('') + `
            <div style="margin-top:15px; border-top:1px dashed #3d2b1f; padding-top:10px; display:flex; justify-content:space-between; align-items:center">
                <span style="color:#d4a91c; font-size:0.8rem; font-weight:bold">TOTAL:</span>
                <span style="color:#00ff90; font-weight:bold; font-size:1.1rem">$ ${total.toFixed(2)}</span>
            </div>
        `;
    },

    
    async enviarPropostaMercado() {
        if (this.carrinhoMercado.length === 0 || !this.empresaSelecionadaId) {
            return alert("O carrinho está vazio ou nenhuma empresa foi selecionada!");
        }

        const empresaAlvo = this.mercadoRawData.find(c => c.id === this.empresaSelecionadaId);
        console.log("EMPRESA ALVO", empresaAlvo)
        const total = this.carrinhoMercado.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
        const itensTexto = this.carrinhoMercado.map(i => `🔸 **${i.nome}** (x${i.qtd}) - $${(i.preco * i.qtd).toFixed(2)}`).join('\n');

        try {
            // Envia o Webhook (se a empresa alvo tiver configurado)
            if (empresaAlvo.webhookVendas) {
                await this.enviarWebhook(empresaAlvo.webhookVendas, {
            title: "Nova Proposta Comercial Recebida!",
            color:  0xd4a91c,
            fields: [
                { name: "👤 Cliente", value: this.config.nomeEmpresa, inline: true },
                { name: "🕊️ Contato", value: this.config.nomeEmpresa || "Não informado", inline: true },
                { name: "💰 Valor total", value: `$ ${total.toFixed(2)}` },
                { name: "📝 Itens da Encomenda", value: itensTexto },
                
            ],
            footer: { text: `SafraLog` },
            timestamp: new Date().toISOString()
        });
            } else {
                console.warn("A empresa destino não possui webhook cadastrado.");
            }

            // Opcional: Aqui você pode disparar também um POST para a sua api/pedidos para salvar no banco o pedido na aba de quem vai VENDER
            
            alert("Proposta comercial enviada com sucesso para " + empresaAlvo.name + "!");
            this.carrinhoMercado = [];
            this.renderizarCarrinhoMercado();
            
        } catch (err) {
            alert("Erro ao enviar proposta comercial.");
        }
    },
    // --- FIM DA LÓGICA DO MERCANTÃO ---
async registrarLog({ action, details, category = "GERAL", userId = null }) {
        try {
            // 1. Salva no Banco de Dados (Prisma)
            const resLog = await fetch('/api/company-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: this.companyId,
                    userId: userId, // ID de quem fez a ação
                    action: action,
                    details: details,
                    category: category
                })
            });

            // 2. Dispara o Webhook para o Discord (Se houver URL configurada)
            if (this.config.webhookLogs) {
                await this.enviarWebhook(this.config.webhookLogs, {
                    title: `[${category}] ${action}`,
                    color: action.includes('ERRO') ? 0xff4c4c : 0xe5b95f,
                    description: details,
                    timestamp: new Date().toISOString(),
                    footer: { text: "Sistema de Auditoria SafraLog" }
                });
            }
        } catch (err) {
            console.error("Erro ao registrar log centralizado:", err);
        }
    },
    async registrarCraft() {
        const nome = document.getElementById("craftNome")?.value;
        const unidade = document.getElementById("unidades")?.value;
        const price = document.getElementById("price")?.value;
        
        if (!nome || !unidade || !price) return alert("Preencha os dados básicos!");

        const insumos = [];
        document.querySelectorAll(".insumo-row").forEach(row => {
            const n = row.querySelector(".insumo-nome").value;
            const q = row.querySelector(".insumo-qtd").value;
            if (n) insumos.push({ nome: n, qtd: q });
        });

        try {
            const res = await fetch('/api/crafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: nome, 
                    unit: unidade, 
                    insumos: insumos,
                    price
                })
            });

            if (res.ok) {
                await this.registrarLog({
    action: "RECEITA_CRIADA",
    category: "PRODUCAO",
    details: `O produto "${nome}" foi adicionado ao catálogo de craft.`
});
                this.enviarWebhook(this.config.webhookLogs, {
                    title: "🛠️ Nova Receita Registrada",
                    color: 0xe5b95f,
                    description: `**Produto:** ${nome}\n**Empresa:** ${this.config.nomeEmpresa}`,
                    timestamp: new Date().toISOString()
                });
                alert("Receita salva com sucesso!");
                this.limparCamposCraft();
                this.carregarCrafts();
            }
        } catch (err) {
            alert("Erro ao salvar no banco de dados.");
        }
    },

    async removerReceita(id) {
        if (!confirm("⚠️ Excluir permanentemente do banco de dados?")) return;

        try {
            const res = await fetch(`/api/crafts?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await this.registrarLog({
    action: "RECEITA_REMOVIDA",
    category: "PRODUCAO",
    details: `Uma receita (ID: ${id}) foi excluída do sistema.`
});
                this.enviarWebhook(this.config.webhookLogs, {
                    title: "🗑️ Receita Removida",
                    color: 0xff4c4c,
                    description: `Uma receita foi deletada do sistema.`,
                    timestamp: new Date().toISOString()
                });
                this.carregarCrafts();
            }
        } catch (err) {
            alert("Erro ao deletar.");
        }
    },

    // --- LOGICA DE VENDAS ---

    adicionarItem() {
        const select = document.getElementById("produtoSelect");
        const qtdInput = document.getElementById("quantidadeItem");
        if (!select || !qtdInput) return;

        const nome = select.value;
        const qtd = parseInt(qtdInput.value);
        if (!nome || !qtd) return alert("Selecione o item e a quantidade!");

        // Busca no cache que carregamos do banco
        const produto = this.craftsCache.find(c => c.name === nome);


        
        this.encomendaAtual.push({ 
            nome, 
            qtd, 
            precoUn: produto.price || 0
        });
        
        this.atualizarViewEncomenda();
        qtdInput.value = "";
    },
    async enviarWebhook(url, embed) {
    if (!url || url.trim() === "") return;

    try {
        // Em vez de enviar pro Discord direto, enviamos para a nossa Fila no banco
        await fetch('/api/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskName: "ENVIAR_WEBHOOK_DISCORD",
                payload: { url, embed }
            })
        });

    } catch (err) {

    }
},

    adicionarCampoInsumo() {
        const container = document.getElementById("listaInsumosDinamicos");
        if (!container) return;
        const div = document.createElement("div");
        div.className = "insumo-row";
        div.style.display = "flex";
        div.style.gap = "8px";
        div.style.marginBottom = "8px";
        div.innerHTML = `
            <input type="text" placeholder="Insumo (Ex: Sal)" class="insumo-nome" style="flex:2; padding:8px; background:#0a0a0f; border:1px solid #333; color:white; border-radius:4px">
            <input type="number" placeholder="Qtd" class="insumo-qtd" style="flex:1; padding:8px; background:#0a0a0f; border:1px solid #333; color:white; border-radius:4px">
        `;
        container.appendChild(div);
    },

mostrarResultadoProducao(totais) {
    const resDiv = document.getElementById("materiaisResultado");
    const listaUl = document.getElementById("listaInsumosSomados");
    
    if (Object.keys(totais).length === 0) {
        alert("Digite a quantidade de pelo menos um item!");
        return;
    }

    listaUl.innerHTML = Object.entries(totais)
        .map(([nome, qtd]) => `
            <li style="padding: 8px 0; border-bottom: 1px dashed #ddd;">
                ✅ <strong>${qtd}x</strong> ${nome}
            </li>
        `).join('');

    resDiv.style.display = 'block';
    resDiv.scrollIntoView({ behavior: 'smooth' });
},
// scripts.js

calcularMateriais(craftList, producaoQtds) {


    const totaisMateriais = {};
    const resumoCrafts = [];

    if (!craftList || !producaoQtds || Object.keys(producaoQtds).length === 0) {
        alert("Digite a quantidade desejada antes de calcular!");
        return;
    }

    Object.entries(producaoQtds).forEach(([id, qtd]) => {
        const qtdDesejada = parseInt(qtd);
        if (isNaN(qtdDesejada) || qtdDesejada <= 0) return;

        const craft = this.craftsCache.find(c => c.id == id);
        
        if (craft) {
            const unidadesPorCraft = parseInt(craft.unit) || 1;
            const rodadasDeCraft = Math.ceil(qtdDesejada / unidadesPorCraft);

            resumoCrafts.push({
                nome: craft.name,
                rodadas: rodadasDeCraft,
                totalGerado: rodadasDeCraft * unidadesPorCraft
            });

            let insumos = [];
            try {
                insumos = typeof craft.insumos === 'string' ? JSON.parse(craft.insumos) : craft.insumos;
            } catch (e) {}

            // CORREÇÃO AQUI:
            insumos.forEach(insumo => {
                // No seu registrarCraft você usa 'nome', então aqui deve ser 'insumo.nome'
                const nomeMaterial = insumo.nome || insumo.item; 
                const qtdUnitaria = Number(insumo.qtd) || 0;
                const totalNecessario = qtdUnitaria * rodadasDeCraft;

                if (nomeMaterial) {
                    totaisMateriais[nomeMaterial] = (totaisMateriais[nomeMaterial] || 0) + totalNecessario;
                }
            });
        }
    });

    this.renderizarResultadoProducao(resumoCrafts, totaisMateriais);
},
renderizarResultadoProducao(resumoCrafts, totaisMateriais) {
    const resDiv = document.getElementById("materiaisResultado");
    const listaUl = document.getElementById("listaInsumosSomados");

    // Criamos um HTML organizado em duas partes: Quantos Crafts fazer e Quais materiais coletar
    let htmlFinal = `
        <div style="margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">
            <h5 style="color: #d4a91c; margin-bottom: 8px; font-size: 0.8rem; text-transform: uppercase;">🔨 Execução de Crafts</h5>
            ${resumoCrafts.map(c => `
                <div style="display:flex; justify-content:space-between; font-size: 0.85rem; margin-bottom: 4px;">
                    <span>${c.nome}</span>
                    <b style="color: #fff;">Fazer ${c.rodadas}x <small style="color: #666;">(Gera ${c.totalGerado})</small></b>
                </div>
            `).join('')}
        </div>
        <div>
            <h5 style="color: #00ff90; margin-bottom: 8px; font-size: 0.8rem; text-transform: uppercase;">📦 Total de Materiais</h5>
            ${Object.entries(totaisMateriais).map(([nome, qtd]) => `
                <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px solid #1f2430;">
                    <span style="color: #bbb;">${nome}</span>
                    <b style="color: #00ff90;">x${qtd}</b>
                </div>
            `).join('')}
        </div>
    `;

    listaUl.innerHTML = htmlFinal;
    resDiv.style.display = 'block';
    resDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
},



async renderizarPedidos() {
    const container = document.getElementById("listaPedidosGeral");
    if (!container) return;

    try {
        // 1. Busca os dados da API em vez do localStorage
        const response = await fetch('/api/pedidos');
        const pedidos = await response.json();

        if (!pedidos || pedidos.length === 0) {
            container.innerHTML = "<p style='color:#666; padding:20px; text-align:center'>Nenhum pedido no sistema.</p>";
            return;
        }

        const baseBtnStyle = "padding: 8px 15px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.75rem; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.5px;";
        const okBtnStyle = `${baseBtnStyle} background: #00ff90; color: #052c1a;`;
        const delBtnStyle = `${baseBtnStyle} background: rgba(255, 76, 76, 0.1); border: 1px solid #ff4c4c; color: #ff4c4c;`;

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
                        ? `<button onclick="window.app.alterarStatusPedido('${p.id}', 'finalizado')" style="${okBtnStyle}" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">✅ Concluir</button>` 
                        : `<span style="color: #00ff90; font-size: 0.75rem; font-weight: bold; display: flex; align-items: center;">✓ FINALIZADO</span>`
                    }
                    <button onclick="window.app.removerPedido('${p.id}')" style="${delBtnStyle}" onmouseover="this.style.background='#ff4c4c'; this.style.color='#fff'" onmouseout="this.style.background='rgba(255, 76, 76, 0.1)'; this.style.color='#ff4c4c'">🗑️ Excluir</button>
                </div>
            </div>
        `).join('');
    } catch (err) {

        container.innerHTML = "<p style='color:red; text-align:center'>Erro ao carregar pedidos do servidor.</p>";
    }
},

async alterarStatusPedido(id, novoStatus) {
    try {
        // 1. Atualiza no Banco de Dados via PATCH
        const res = await fetch('/api/pedidos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: novoStatus }) // Certifique-se que sua API PATCH aceita 'status'
        });

        if (!res.ok) throw new Error("Falha ao atualizar status");

        const pedidoAtualizado = await res.json();
        await this.registrarLog({
    action: "PEDIDO_FINALIZADO",
    category: "LOGISTICA",
    details: `O pedido de ${pedidoAtualizado.name} foi marcado como concluído.`
});
        
        // 2. Envia Webhook de Log
        this.enviarWebhook(this.config.webhookLogs, {
            title: "✅ Pedido Finalizado",
            color: 0x00ff90,
            description: `O pedido de **${pedidoAtualizado.name}** foi marcado como concluído no sistema.`,
            timestamp: new Date().toISOString()
        });

        this.renderizarPedidos(); // Recarrega a lista
    } catch (err) {
        alert("Erro ao finalizar pedido: " + err.message);
    }
},

async removerPedido(id) {
    if (!confirm(`⚠️ Deseja realmente excluir este pedido permanentemente?`)) return;

    try {
        // 1. Deleta no Banco via API
        const res = await fetch(`/api/pedidos?id=${id}`, { method: 'DELETE' });
        
        if (!res.ok) throw new Error("Erro ao deletar do servidor");

        // 2. Webhook de Log
        this.enviarWebhook(this.config.webhookLogs, {
            title: "🗑️ Pedido Excluído",
            color: 0xff4c4c,
            description: `Um pedido (ID: ${id}) foi removido permanentemente.`,
            timestamp: new Date().toISOString()
        });

        this.renderizarPedidos();
    } catch (err) {
        alert("Erro ao remover: " + err.message);
    }
},


    atualizarViewEncomenda() {
        const container = document.getElementById("listaEncomenda");
        if (!container) return;
        container.innerHTML = this.encomendaAtual.map(item => `
            <div style="padding:5px 0; border-bottom:1px solid #333; font-size:0.9rem">
                📦 <b>${item.nome}</b> x${item.qtd}
            </div>
        `).join('');
    },

    limparCamposCraft() {
        const cn = document.getElementById("craftNome");
        const un = document.getElementById("unidades");
        const pv = document.getElementById("price");
        const li = document.getElementById("listaInsumosDinamicos");

        if (cn) cn.value = "";
        if (un) un.value = "";
        if (pv) pv.value = "";
        if (li) {
            li.innerHTML = "";
            this.adicionarCampoInsumo();
        }
    },
    // Dentro de window.app = { ... }

// 1. Abre o modal e gera a senha aleatória
abrirModalContratacao() {
    const pass = this.gerarSenhaForte(8);
    this.senhaTemporaria = pass; // Guarda na memória do objeto
    
    document.getElementById('new_func_pass_display').innerText = pass;
    document.getElementById('new_func_username').value = "";
    document.getElementById('modalContratacao').style.display = 'flex';
},

gerarSenhaForte(tamanho) {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sem caracteres confusos como 0 e O
    let retVal = "";
    for (let i = 0, n = charset.length; i < tamanho; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
},
// Exemplo de como ficaria a chamada no scripts.js
exibirModalSenha(username, senha) {
    const html = `
        <div id="tempModalSenha" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999;">
            <div style="background:#1e1e2f; padding:30px; border-radius:15px; border-top:5px solid #00ff90; width:350px; text-align:center; box-shadow: 0 10px 30px rgba(0,0,0,0.5)">
                <h3 style="color:#fff; margin-bottom:10px">🔑 Senha Gerada</h3>
                <p style="color:#888; font-size:0.9rem">Passe os dados abaixo para <b>${username}</b></p>
                
                <div style="background:#0d0f14; padding:15px; border-radius:8px; margin:20px 0; border:1px dashed #00ff90; position:relative">
                    <span id="txtSenha" style="color:#00ff90; font-family:monospace; font-size:1.2rem; letter-spacing:2px">${senha}</span>
                </div>

                <button onclick="window.app.copiarSenhaDireto('${senha}')" style="width:100%; background:#00ff90; color:#000; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:10px">COPIAR SENHA</button>
                <button onclick="document.getElementById('tempModalSenha').remove()" style="background:none; border:none; color:#ff4c4c; cursor:pointer; font-size:0.8rem">FECHAR</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
},

// Função de apoio para o botão do modal
copiarSenhaDireto(senha) {
    navigator.clipboard.writeText(senha);
    alert("Copiado!");
},
async resetarSenhaFuncionario(userId, username) {

    const novaSenha = this.gerarSenhaForte(8);


    const confirmar = confirm(`Deseja realmente resetar a senha de ${username}?\n\nA nova senha será: ${novaSenha}\n\n(Copie a senha antes de confirmar!)`);
    
    if (!confirmar) return;

    try {
        const res = await fetch('/api/users/reset-password', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                newPassword: novaSenha
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
await this.registrarLog({
    action: "SENHA_RESETADA",
    category: "SEGURANCA",
    details: `A senha de acesso do usuário ${username} foi redefinida por um administrador.`
});
        // Envia Log para o Discord avisando do Reset (sem mostrar a senha por segurança)
        await this.enviarWebhook(this.config.webhookLogs, {
            title: "🔑 Senha Resetada",
            color: 0xf1c40f,
            description: `A senha do colaborador **${username}** foi alterada pelo administrador.`,
            timestamp: new Date().toISOString()
        });

        this.exibirModalSenha(username, novaSenha); // password é a senha temporária gerada
        document.getElementById('modalContratacao').style.display = 'none';

    } catch (err) {
        alert("Erro ao resetar senha: " + err.message);
    }
},
async executarContratacao() {
    const usernameInput = document.getElementById('new_func_username');
    const roleInput = document.getElementById('new_func_role');
    const roleText = roleInput.options[roleInput.selectedIndex]?.text || "Não definido";
    
    const username = usernameInput ? usernameInput.value.trim() : "";
    const roleId = roleInput ? roleInput.value : "";
    
    // A senha permanece na memória para o envio à API, mas não irá para o Webhook
    const password = this.senhaTemporaria; 

    if (!username) return alert("Digite um nome de usuário!");
    if (!password) return alert("Erro: Senha não foi gerada.");

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password, 
                roleId: roleId,
                companyId: this.companyId
            })
        });

        const data = await res.json();
        
        if (data.error) {
            alert("Erro do Servidor: " + data.error);
            return;
        }

        await this.registrarLog({
    action: "FUNCIONARIO_ADMITIDO",
    category: "RH",
    details: `O colaborador ${username} foi contratado com o cargo ${roleText}.`
});

        // --- WEBHOOK ATUALIZADO (SEM SENHA) ---
        await this.enviarWebhook(this.config.webhookLogs, {
            title: "👤 Novo Funcionário Registrado",
            color: 0x2b2d31, // Cor mais sóbria (cinza escuro)
            description: `Um novo colaborador foi inserido no sistema.`,
            fields: [
                { name: "🏷️ Usuário", value: `**${username}**`, inline: true },
                { name: "💼 Cargo", value: `\`${roleText}\``, inline: true },
                { name: "🛡️ Status", value: `✅ Conta Ativa`, inline: true },
                { name: "⚠️ Aviso", value: "A senha foi entregue apenas ao administrador no ato da criação.", inline: false }
            ],
            footer: { text: `Gestão de Equipe - ${this.config.nomeEmpresa}` },
            timestamp: new Date().toISOString()
        });

        // Exibimos a senha uma última vez para o dono copiar
        alert(`✅ FUNCIONÁRIO CONTRATADO!\n\nUsuário: ${username}\nSenha: ${password}\n\n⚠️ IMPORTANTE: A senha NÃO foi enviada para os logs por segurança. Copie-a agora!`);
        
        document.getElementById('modalContratacao').style.display = 'none';
        
        if(typeof this.carregarEquipe === "function") {
            this.carregarEquipe();
        } else {
            window.location.reload();
        }

    } catch (err) {
        console.error("Erro no fetch:", err);
        alert("Erro de conexão ao tentar contratar.");
    }
}





};


// Funções globais de Modal
window.toggleModal = function(show) { 
    const modal = document.getElementById('modalSettings');
    if (modal) modal.style.display = show ? 'flex' : 'none'; 
};

// Inicialização segura
if (document.readyState === "complete" || document.readyState === "interactive") {
    window.app.init();
} else {
    document.addEventListener("DOMContentLoaded", () => window.app.init());
}