



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
        this.carregarEmpresasMercado();
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

        // 4. Enviar Webhook de Venda para o Discord
        const itensTexto = this.encomendaAtual.map(i => `🔸 **${i.nome}** (x${i.qtd})`).join('\n');
        
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
// ... dentro de window.app ...

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

    // 4. Renderiza o carrinho lateral
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

    removerDoCarrinhoMercado(index) {
        this.carrinhoMercado.splice(index, 1);
        this.renderizarCarrinhoMercado();
    },

    // 5. Finaliza a Encomenda
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
async removerReceita(id) {
    if (!confirm("⚠️ Excluir permanentemente do banco de dados?")) return;

    try {
        const res = await fetch(`/api/crafts?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            this.enviarWebhook(this.config.webhookLogs, {
                title: "🗑️ Receita Removida",
                color: 0xff4c4c,
                description: `A receita ID ${id} foi deletada.`,
                timestamp: new Date().toISOString()
            });
            
            alert("Receita removida!");
            
            // Força o recarregamento da página para o React buscar a lista nova do banco
            window.location.reload(); 
        }
    } catch (err) {
        alert("Erro ao deletar: " + err.message);
    }
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
    }
};

Object.assign(window.app, {
    mercadoRawData: [],
    empresaSelecionadaId: null,
    carrinhoMercado: [],

    async carregarEmpresasMercado() {
        console.log("🔍 [Mercadão] Tentando carregar empresas...");
        try {
            // Chamada com caminho absoluto
            const res = await fetch('/api/companies');
            if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
            
            const companies = await res.json();
            console.log("📦 [Mercadão] Dados recebidos:", companies);

            this.companyId = document.body.getAttribute("data-company-id");

            // Filtro com tratamento de erro e logs
            this.mercadoRawData = companies.filter(c => {
                return String(c.id) !== String(this.companyId);
            });

            this.renderizarCardsEmpresas(this.mercadoRawData);
        } catch (err) {
            console.error("❌ [Mercadão] Erro fatal:", err);
            const container = document.getElementById("gridEmpresasMercado");
            if (container) container.innerHTML = `<p style="color:red">Erro: ${err.message}</p>`;
        }
    },

    renderizarCardsEmpresas(lista) {
        const container = document.getElementById("gridEmpresasMercado");
        if (!container) return console.log("CONTAINER NAO ECONTRADO ", container)

        if (!lista || lista.length === 0) {
            container.innerHTML = "<p style='color:#666'>Nenhum fornecedor disponível.</p>";
            return;
        }

        // Layout otimizado para não "bugar" com muitas empresas
        container.innerHTML = lista.map(c => `
            <div id="empresa_card_${c.id}" 
                 onclick="window.app.selecionarFornecedor('${c.id}')"
                 style="background:#1c1f26; padding:10px; border-radius:6px; border:1px solid #333; cursor:pointer; text-align:center; min-height:50px; display:flex; align-items:center; justify-content:center;">
                <span style="font-weight:bold; color:#fff; font-size:0.75rem; line-height:1.1">${c.name}</span>
            </div>
        `).join('');
    },

    selecionarFornecedor(id) {
        this.empresaSelecionadaId = String(id);
        const empresa = this.mercadoRawData.find(c => String(c.id) === String(id));

        // Feedback visual imediato nos cards
        this.mercadoRawData.forEach(c => {
            const el = document.getElementById(`empresa_card_${c.id}`);
            if (el) {
                const ativo = String(c.id) === String(id);
                el.style.borderColor = ativo ? "#d4a91c" : "#333";
                el.style.background = ativo ? "rgba(212,169,28,0.1)" : "#1c1f26";
            }
        });

        const container = document.getElementById("gridProdutosMercado");
        if (!container || !empresa) return;

        // Se tiver MUITO craft, o grid-template-columns auto-fill resolve o bug visual
        if (!empresa.crafts || empresa.crafts.length === 0) {
            container.innerHTML = "<p style='color:#666'>Nenhum produto cadastrado.</p>";
            return;
        }

        container.innerHTML = empresa.crafts.map(p => `
            <div style="background:#161922; padding:12px; border-radius:8px; border:1px solid #2d2d2d; display:flex; flex-direction:column; gap:5px">
                <span style="color:#d4a91c; font-weight:bold; font-size:0.8rem">📦 ${p.name}</span>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:#00ff90; font-weight:bold">$${p.price}</span>
                    <small style="color:#555">${p.unit || 'un'}</small>
                </div>
                <div style="display:flex; gap:4px; margin-top:5px">
                    <input type="number" id="qtd_mercado_${p.id}" value="1" min="1" style="width:50px; background:#000; color:#fff; border:1px solid #444; border-radius:4px; padding:2px 5px">
                    <button onclick="window.app.adicionarAoCarrinhoMercado('${p.id}', '${p.name}', ${p.price})" style="flex:1; background:#d4a91c; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-size:0.7rem">ADD</button>
                </div>
            </div>
        `).join('');
    }
});

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