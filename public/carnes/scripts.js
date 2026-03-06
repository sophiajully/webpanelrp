// SafraLog - Sistema de Gestão Industrial/Fazenda
window.app = {
    config: {
        webhookVendas: "",
        webhookLogs: "",
        nomeEmpresa: "SafraLog ERP",
        colorPrimary: "#8b0000",
        colorAccent: "#ff4c4c"
    },
    encomendaAtual: [],

    init() {
        console.log("🚜 SafraLog: Sistema Inicializado");
        this.carregarConfig();
        this.carregarCrafts();
        this.aplicarTema();
        this.renderizarPedidos();
        
        // Listeners seguros para os inputs de cor
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
calcularEncomenda() {
        const nomeCliente = document.getElementById("clienteNome")?.value;
        const contatoCliente = document.getElementById("clientePombo")?.value;

        if (!nomeCliente || this.encomendaAtual.length === 0) {
            return alert("Preencha o nome do cliente e adicione pelo menos um item!");
        }

        // 1. Calcular Total
        const total = this.encomendaAtual.reduce((acc, item) => acc + (item.precoUn * item.qtd), 0);
        const pedidoId = Math.floor(Date.now() / 1000); // Gera um ID baseado no tempo

        // 2. Criar objeto do pedido
        const novoPedido = {
            id: pedidoId,
            cliente: nomeCliente,
            contato: contatoCliente,
            itens: [...this.encomendaAtual],
            total: total,
            status: 'pendente',
            data: new Date().toLocaleString()
        };

        // 3. Salvar no LocalStorage (Histórico de Pedidos)
        const pedidosSaves = JSON.parse(localStorage.getItem("pedidos_açougue") || "[]");
        pedidosSaves.unshift(novoPedido); // Adiciona no início da lista
        localStorage.setItem("pedidos_açougue", JSON.stringify(pedidosSaves));

        // 4. Enviar Webhook de Venda para o Discord
        const itensTexto = this.encomendaAtual.map(i => `📦 **${i.nome}** (x${i.qtd})`).join('\n');
        this.enviarWebhook(this.config.webhookVendas, {
            title: "💰 Nova Encomenda Recebida!",
            color: 0x00ff90,
            fields: [
                { name: "👤 Cliente", value: nomeCliente, inline: true },
                { name: "🕊️ Contato", value: contatoCliente || "Não informado", inline: true },
                { name: "📝 Itens", value: itensTexto },
                { name: "💵 Total", value: `R$ ${total.toLocaleString()}` }
            ],
            footer: { text: `ID do Pedido: ${pedidoId}` },
            timestamp: new Date().toISOString()
        });

        // 5. Finalizar e Limpar
        alert(`Pedido #${pedidoId} finalizado com sucesso!`);
        this.encomendaAtual = [];
        document.getElementById("clienteNome").value = "";
        document.getElementById("clientePombo").value = "";
        this.atualizarViewEncomenda();
        this.renderizarPedidos(); // Atualiza a aba de pedidos se ela estiver aberta
    },
    carregarConfig() {
        const saved = JSON.parse(localStorage.getItem("painel_config") || "{}");
        this.config = { ...this.config, ...saved };
        
        // Função auxiliar para evitar repetição de código e erros de null
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };

        setVal("webhookVendasInput", this.config.webhookVendas);
        setVal("webhookLogsInput", this.config.webhookLogs);
        setVal("nomeEmpresaInput", this.config.nomeEmpresa);
        setVal("colorPrimary", this.config.colorPrimary);
        setVal("colorAccent", this.config.colorAccent);
        
        const display = document.getElementById("nomeEmpresaDisplay");
        if (display) display.innerText = this.config.nomeEmpresa;
    },

    salvarConfig() {
        const getVal = (id) => document.getElementById(id)?.value || "";

        this.config.webhookVendas = getVal("webhookVendasInput");
        this.config.webhookLogs = getVal("webhookLogsInput");
        this.config.nomeEmpresa = getVal("nomeEmpresaInput");
        this.config.colorPrimary = getVal("colorPrimary");
        this.config.colorAccent = getVal("colorAccent");

        localStorage.setItem("painel_config", JSON.stringify(this.config));
        this.aplicarTema();
        
        const display = document.getElementById("nomeEmpresaDisplay");
        if (display) display.innerText = this.config.nomeEmpresa;
        
        alert("Configurações aplicadas com sucesso!");
        if (window.toggleModal) window.toggleModal(false);
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

    async enviarWebhook(url, embed) {
        if (!url || url.trim() === "") return;
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });
        } catch (err) { console.error("Erro Webhook:", err); }
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

    registrarCraft() {
        const nomeEl = document.getElementById("craftNome");
        const unidadesEl = document.getElementById("unidades");
        if (!nomeEl || !unidadesEl) return;

        const nome = nomeEl.value;
        const unidades = parseFloat(unidadesEl.value) || 1;
        const preco = parseFloat(document.getElementById("precoVenda")?.value) || 0;
        
        if (!nome) return alert("Defina o nome do produto!");

        const insumos = [];
        document.querySelectorAll(".insumo-row").forEach(row => {
            const n = row.querySelector(".insumo-nome").value;
            const q = parseFloat(row.querySelector(".insumo-qtd").value) || 0;
            if (n) insumos.push({ nome: n, qtd: q });
        });

        const crafts = JSON.parse(localStorage.getItem("crafts") || "[]");
        crafts.push({ nome, unidades, preco, insumos });
        localStorage.setItem("crafts", JSON.stringify(crafts));

        this.enviarWebhook(this.config.webhookLogs, {
            title: "🛠️ Nova Receita SafraLog",
            color: 0x3498db,
            description: `**Item:** ${nome}\n**Produz:** ${unidades} unidades`,
            timestamp: new Date().toISOString()
        });

        alert("Receita registrada!");
        this.limparCamposCraft();
        this.carregarCrafts();
    },

 renderizarPedidos() {
    const container = document.getElementById("listaPedidosGeral");
    if (!container) return;
    const pedidos = JSON.parse(localStorage.getItem("pedidos_açougue") || "[]");

    if (pedidos.length === 0) {
        container.innerHTML = "<p style='color:#666; padding:20px; text-align:center'>Nenhum pedido no sistema.</p>";
        return;
    }

    // Estilos base para os botões
    const baseBtnStyle = "padding: 8px 15px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.75rem; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.5px;";
    const okBtnStyle = `${baseBtnStyle} background: #00ff90; color: #052c1a;`;
    const delBtnStyle = `${baseBtnStyle} background: rgba(255, 76, 76, 0.1); border: 1px solid #ff4c4c; color: #ff4c4c;`;

    container.innerHTML = pedidos.map(p => `
        <div class="card" style="border-left: 4px solid ${p.status === 'finalizado' ? '#00ff90' : '#f1c40f'}; margin-bottom: 12px; background: #161625; padding: 15px; border-radius: 10px;">
            <div style="display:flex; justify-content:space-between; align-items: center;">
                <strong style="color: #fff; font-size: 1rem;">👤 ${p.cliente}</strong>
                <span style="font-size:0.7rem; color: #666; background: #0d0d15; padding: 3px 8px; border-radius: 4px;">ID: ${p.id}</span>
            </div>
            
            <div style="margin:12px 0; font-size:0.85rem; color: #bbb; line-height: 1.5;">
                ${p.itens.map(i => `<span style="color: #eee;">•</span> ${i.nome} <b style="color: var(--accent-red)">(x${i.qtd})</b>`).join('<br>')}
            </div>

            <div style="display:flex; gap:10px; margin-top: 10px; border-top: 1px solid #2a2a3a; padding-top: 12px;">
                ${p.status === 'pendente' 
                    ? `<button onclick="window.app.alterarStatusPedido(${p.id}, 'finalizado')" style="${okBtnStyle}" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">✅ Concluir</button>` 
                    : `<span style="color: #00ff90; font-size: 0.75rem; font-weight: bold; display: flex; align-items: center;">✓ FINALIZADO</span>`
                }
                <button onclick="window.app.removerPedido(${p.id})" style="${delBtnStyle}" onmouseover="this.style.background='#ff4c4c'; this.style.color='#fff'" onmouseout="this.style.background='rgba(255, 76, 76, 0.1)'; this.style.color='#ff4c4c'">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
},

    carregarCrafts() {
        const crafts = JSON.parse(localStorage.getItem("crafts") || "[]");
        const select = document.getElementById("produtoSelect");
        if (select) {
            select.innerHTML = crafts.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        }

        const listaProd = document.getElementById("listaCrafts");
        if (listaProd) {
            listaProd.innerHTML = crafts.map((c, i) => `
                <div class="lista-item" style="background:#1c1c2e; padding:12px; border-radius:8px; margin-bottom:8px; border:1px solid #333">
                    <div style="display: flex; justify-content: space-between; align-items:center">
                        <span style="font-weight:bold">${c.nome}</span>
                        <button onclick="window.app.removerReceita(${i})" style="background:none; border:none; color:#ff4c4c; cursor:pointer">excluir</button>
                    </div>
                    <input type="number" class="qtd-desejada" data-index="${i}" placeholder="Quantidade p/ produzir" style="width:100%; margin-top:8px; padding:8px; background:#0a0a0f; border:1px solid #444; color:white; border-radius:4px">
                </div>
            `).join('');
        }
    },
removerReceita(index) {
        if (!confirm("⚠️ Deseja realmente excluir esta receita permanentemente?")) return;

        // 1. Pega a lista atual do localStorage
        const crafts = JSON.parse(localStorage.getItem("crafts") || "[]");

        // 2. Remove o item pelo índice recebido
        crafts.splice(index, 1);

        // 3. Salva a lista atualizada de volta
        localStorage.setItem("crafts", JSON.stringify(crafts));

        // 4. Manda um log para o Discord (opcional, usando sua função existente)
        this.enviarWebhook(this.config.webhookLogs, {
            title: "🗑️ Receita Removida",
            color: 0xff4c4c,
            description: `Uma receita foi excluída do sistema.`,
            timestamp: new Date().toISOString()
        });

        // 5. Atualiza a tela e o select de vendas na hora
        this.carregarCrafts();
        
        alert("Receita removida com sucesso!");
    },
    adicionarItem() {
        const select = document.getElementById("produtoSelect");
        const qtdInput = document.getElementById("quantidadeItem");
        if (!select || !qtdInput) return;

        const nome = select.value;
        const qtd = parseInt(qtdInput.value);
        if (!nome || !qtd) return alert("Selecione o item e a quantidade!");

        const crafts = JSON.parse(localStorage.getItem("crafts") || "[]");
        const produto = crafts.find(c => c.nome === nome);
        
        this.encomendaAtual.push({ nome, qtd, precoUn: produto ? produto.preco : 0 });
        this.atualizarViewEncomenda();
        qtdInput.value = "";
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
        const pv = document.getElementById("precoVenda");
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