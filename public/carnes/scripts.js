// AgroLegacy - Sistema de Gestão Industrial/Fazenda
window.app = {
    config: {
        webhookVendas: "",
        webhookLogs: "",
        nomeEmpresa: "AgroLegacy ERP",
        colorPrimary: "#8b0000",
        colorAccent: "#ff4c4c"
    },
    encomendaAtual: [],

    init() {
        console.log("🚜 AgroLegacy: Sistema Inicializado");
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
            title: "🛠️ Nova Receita AgroLegacy",
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

        container.innerHTML = pedidos.map(p => `
            <div class="card" style="border-left: 4px solid ${p.status === 'finalizado' ? '#00ff90' : '#f1c40f'}; margin-bottom: 12px;">
                <div style="display:flex; justify-content:space-between">
                    <strong>👤 ${p.cliente}</strong>
                    <span style="font-size:0.8rem; opacity:0.7">ID: ${p.id}</span>
                </div>
                <div style="margin:10px 0; font-size:0.9rem">
                    ${p.itens.map(i => `• ${i.nome} (x${i.qtd})`).join('<br>')}
                </div>
                <div style="display:flex; gap:8px">
                    ${p.status === 'pendente' ? `<button onclick="window.app.alterarStatusPedido(${p.id}, 'finalizado')" class="btn-status-ok">Concluir</button>` : ''}
                    <button onclick="window.app.removerPedido(${p.id})" class="btn-status-del">Excluir</button>
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
                        <button onclick="window.app.removerReceita(${i})" style="background:none; border:none; color:#ff4c4c; cursor:pointer">🗑️</button>
                    </div>
                    <input type="number" class="qtd-desejada" data-index="${i}" placeholder="Quantidade p/ produzir" style="width:100%; margin-top:8px; padding:8px; background:#0a0a0f; border:1px solid #444; color:white; border-radius:4px">
                </div>
            `).join('');
        }
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