// Definindo o objeto app globalmente para o React acessar
window.app = {
    config: {
        webhookVendas: "",
        webhookLogs: "",
        nomeEmpresa: "Açougue Winchester",
        colorPrimary: "#8b0000",
        colorAccent: "#ff4c4c"
    },
    encomendaAtual: [],

    init() {
        console.log("🥩 Sistema de Carnes Inicializado");
        this.carregarConfig();
        this.carregarCrafts();
        this.aplicarTema();
        this.renderizarPedidos();
        
        // Listeners para mudança de cor em tempo real
        const cp = document.getElementById("colorPrimary");
        const ca = document.getElementById("colorAccent");
        
        if (cp) cp.addEventListener("input", (e) => { this.config.colorPrimary = e.target.value; this.aplicarTema(); });
        if (ca) ca.addEventListener("input", (e) => { this.config.colorAccent = e.target.value; this.aplicarTema(); });
        
        // Se a área de insumos estiver vazia, adiciona o primeiro campo
        const container = document.getElementById("listaInsumosDinamicos");
        if (container && container.children.length === 0) {
            this.adicionarCampoInsumo();
        }
    },

    carregarConfig() {
        const saved = JSON.parse(localStorage.getItem("painel_config") || "{}");
        this.config = { ...this.config, ...saved };
        
        const wv = document.getElementById("webhookVendasInput");
        const wl = document.getElementById("webhookLogsInput");
        const ni = document.getElementById("nomeEmpresaInput");
        const cp = document.getElementById("colorPrimary");
        const ca = document.getElementById("colorAccent");

        if (wv) wv.value = this.config.webhookVendas || "";
        if (wl) wl.value = this.config.webhookLogs || "";
        if (ni) ni.value = this.config.nomeEmpresa || "";
        if (cp) cp.value = this.config.colorPrimary;
        if (ca) ca.value = this.config.colorAccent;
        
        const display = document.getElementById("nomeEmpresaDisplay");
        if (display) display.innerText = this.config.nomeEmpresa;
    },

    salvarConfig() {
        this.config.webhookVendas = document.getElementById("webhookVendasInput").value;
        this.config.webhookLogs = document.getElementById("webhookLogsInput").value;
        this.config.nomeEmpresa = document.getElementById("nomeEmpresaInput").value;
        this.config.colorPrimary = document.getElementById("colorPrimary").value;
        this.config.colorAccent = document.getElementById("colorAccent").value;

        localStorage.setItem("painel_config", JSON.stringify(this.config));
        this.aplicarTema();
        
        const display = document.getElementById("nomeEmpresaDisplay");
        if (display) display.innerText = this.config.nomeEmpresa;
        
        alert("Configurações salvas localmente!");
        window.toggleModal(false);
    },

    aplicarTema() {
        const root = document.documentElement;
        root.style.setProperty('--primary-red', this.config.colorPrimary);
        root.style.setProperty('--accent-red', this.config.colorAccent);
        
        const cp = document.getElementById("colorPrimary");
        const ca = document.getElementById("colorAccent");
        if (cp) cp.style.backgroundColor = this.config.colorPrimary;
        if (ca) ca.style.backgroundColor = this.config.colorAccent;

        document.querySelectorAll('.btn-border-theme').forEach(btn => {
            btn.style.borderColor = this.config.colorAccent;
            btn.style.color = this.config.colorAccent;
        });
    },

    async enviarWebhook(url, embed) {
        if (!url || url === "") return;
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });
        } catch (err) { console.error("Erro ao enviar webhook:", err); }
    },

    adicionarCampoInsumo() {
        const container = document.getElementById("listaInsumosDinamicos");
        if (!container) return;
        const div = document.createElement("div");
        div.className = "insumo-row";
        div.style.display = "flex";
        div.style.gap = "5px";
        div.style.marginBottom = "5px";
        div.innerHTML = `
            <input type="text" placeholder="Insumo" class="insumo-nome" style="flex:2">
            <input type="number" placeholder="Qtd" class="insumo-qtd" style="flex:1">
        `;
        container.appendChild(div);
    },

    registrarCraft() {
        const nome = document.getElementById("craftNome").value;
        const unidades = parseFloat(document.getElementById("unidades").value) || 1;
        const preco = parseFloat(document.getElementById("precoVenda").value) || 0;
        
        if (!nome) return alert("Nome do produto obrigatório!");

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
            title: "🛠️ Nova Receita Criada",
            color: 0x3498db,
            description: `**Produto:** ${nome}\n**Preço:** R$ ${preco}\n**Rendimento:** ${unidades} un.`,
            timestamp: new Date().toISOString()
        });

        alert("Receita salva!");
        this.limparCamposCraft();
        this.carregarCrafts();
    },

    async calcularMateriais() {
        const crafts = JSON.parse(localStorage.getItem("crafts") || "[]");
        const inputs = document.querySelectorAll(".qtd-desejada");
        const resumoInsumos = {}; 
        let logTexto = "";
        let ativo = false;

        inputs.forEach(input => {
            const qtdDesejada = parseFloat(input.value) || 0;
            if (qtdDesejada > 0) {
                ativo = true;
                const c = crafts[input.dataset.index];
                const ciclos = Math.ceil(qtdDesejada / c.unidades);
                logTexto += `🔹 **${c.nome}**: ${qtdDesejada} un. (${ciclos} ciclos)\n`;

                c.insumos.forEach(ins => {
                    resumoInsumos[ins.nome] = (resumoInsumos[ins.nome] || 0) + (ins.qtd * ciclos);
                });
            }
        });

        if (!ativo) return alert("Preencha as quantidades!");

        let insumosTexto = Object.entries(resumoInsumos).map(([n, q]) => `📍 ${n}: ${q}`).join('\n');
        this.enviarWebhook(this.config.webhookLogs, {
            title: "📊 Relatório de Produção",
            color: 0xf1c40f,
            fields: [
                { name: "📋 Planejamento", value: logTexto || "Erro" },
                { name: "📦 Insumos", value: insumosTexto || "Erro" }
            ],
            timestamp: new Date().toISOString()
        });

        const resDiv = document.getElementById("materiaisResultado");
        resDiv.style.display = "block";
        resDiv.innerHTML = `<h4>Relatório Gerado</h4><div class="total-geral">${insumosTexto.replace(/\n/g, '<br>')}</div>`;
    },

    async calcularEncomenda() {
        const cliente = document.getElementById("clienteNome").value || "Não informado";
        const pombo = document.getElementById("clientePombo").value || "Não informado";
        if (this.encomendaAtual.length === 0) return alert("Adicione itens!");

        const total = this.encomendaAtual.reduce((acc, item) => acc + (item.qtd * item.precoUn), 0);
        
        const novoPedido = {
            id: Date.now(),
            cliente,
            pombo,
            itens: [...this.encomendaAtual],
            total: total,
            status: 'pendente'
        };

        const pedidos = JSON.parse(localStorage.getItem("pedidos_açougue") || "[]");
        pedidos.unshift(novoPedido);
        localStorage.setItem("pedidos_açougue", JSON.stringify(pedidos));

        const itensFormatados = novoPedido.itens.map(i => `🔸 **${i.nome}**: ${i.qtd} un.`).join('\n');
        await this.enviarWebhook(this.config.webhookVendas, {
            title: "🥩 Nova Encomenda",
            color: 0xf1c40f,
            fields: [
                { name: "👤 Cliente", value: cliente, inline: true },
                { name: "🕊️ Contato", value: pombo, inline: true },
                { name: "💰 Total", value: `R$ ${total.toFixed(2)}` },
                { name: "📝 Itens", value: itensFormatados }
            ],
            timestamp: new Date().toISOString()
        });

        alert("Pedido registrado!");
        this.encomendaAtual = [];
        this.atualizarViewEncomenda();
        this.renderizarPedidos();
    },

    renderizarPedidos() {
        const container = document.getElementById("listaPedidosGeral");
        if (!container) return;
        const pedidos = JSON.parse(localStorage.getItem("pedidos_açougue") || "[]");

        if (pedidos.length === 0) {
            container.innerHTML = "<p style='color:#666'>Nenhum pedido registrado.</p>";
            return;
        }

        container.innerHTML = pedidos.map(p => {
            const statusColor = p.status === 'finalizado' ? '#00ff90' : (p.status === 'cancelado' ? '#ff4c4c' : '#f1c40f');
            const itensStr = p.itens.map(i => `${i.nome} (x${i.qtd})`).join(', ');

            return `
                <div class="card" style="border-left: 5px solid ${statusColor}; margin-bottom: 15px; background: #252538; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>👤 ${p.cliente}</strong>
                        <span style="color: ${statusColor}; font-weight: bold;">● ${p.status}</span>
                    </div>
                    <div style="font-size: 0.85rem; margin-top: 10px; color: #ccc">
                        <p>📦 ${itensStr}</p>
                        <p>💰 R$ ${p.total.toFixed(2)}</p>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        ${p.status === 'pendente' ? `
                            <button onclick="window.app.alterarStatusPedido(${p.id}, 'finalizado')" style="background:#00ff9022; color:#00ff90; border:1px solid #00ff90; padding:4px 8px; cursor:pointer; border-radius:4px">Finalizar</button>
                            <button onclick="window.app.alterarStatusPedido(${p.id}, 'cancelado')" style="background:#ff4c4c22; color:#ff4c4c; border:1px solid #ff4c4c; padding:4px 8px; cursor:pointer; border-radius:4px">Cancelar</button>
                        ` : ''}
                        <button onclick="window.app.removerPedido(${p.id})" style="background:none; color:#666; border:1px solid #444; padding:4px 8px; cursor:pointer; border-radius:4px">Remover</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    alterarStatusPedido(id, novoStatus) {
        let pedidos = JSON.parse(localStorage.getItem("pedidos_açougue") || "[]");
        const pIndex = pedidos.findIndex(p => p.id === id);
        
        if (pIndex !== -1) {
            pedidos[pIndex].status = novoStatus;
            localStorage.setItem("pedidos_açougue", JSON.stringify(pedidos));
            this.renderizarPedidos();
            
            this.enviarWebhook(this.config.webhookLogs, {
                title: `Pedido ${novoStatus}`,
                color: novoStatus === 'finalizado' ? 0x00ff90 : 0xff4c4c,
                description: `Pedido de **${pedidos[pIndex].cliente}** atualizado para **${novoStatus}**.`,
                timestamp: new Date().toISOString()
            });
        }
    },

    removerPedido(id) {
        if (confirm("Remover este pedido?")) {
            let pedidos = JSON.parse(localStorage.getItem("pedidos_açougue") || "[]");
            pedidos = pedidos.filter(p => p.id !== id);
            localStorage.setItem("pedidos_açougue", JSON.stringify(pedidos));
            this.renderizarPedidos();
        }
    },

    limparTodosPedidos() {
        if (confirm("Apagar todo o histórico?")) {
            localStorage.removeItem("pedidos_açougue");
            this.renderizarPedidos();
        }
    },

    carregarCrafts() {
        const crafts = JSON.parse(localStorage.getItem("crafts") || "[]");
        const select = document.getElementById("produtoSelect");
        if (select) {
            select.innerHTML = crafts.map(c => `<option value="${c.nome}">${c.nome} (R$ ${c.preco.toFixed(2)})</option>`).join('');
        }

        const listaProd = document.getElementById("listaCrafts");
        if (listaProd) {
            listaProd.innerHTML = crafts.map((c, i) => `
                <div class="lista-item" style="background:#1c1c2e; padding:10px; border-radius:8px; margin-bottom:10px">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${c.nome}</strong>
                        <button onclick="window.app.removerReceita(${i})" style="background:none; border:none; color:#ff4c4c; cursor:pointer">🗑️</button>
                    </div>
                    <input type="number" class="qtd-desejada" data-index="${i}" placeholder="Qtd. produzir" style="width:100%; margin-top:8px; padding:5px; background:#0a0a0f; border:1px solid #333; color:white">
                </div>
            `).join('');
        }
    },

    removerReceita(index) {
        const crafts = JSON.parse(localStorage.getItem("crafts") || "[]");
        if (confirm(`Remover "${crafts[index].nome}"?`)) {
            crafts.splice(index, 1);
            localStorage.setItem("crafts", JSON.stringify(crafts));
            this.carregarCrafts();
        }
    },

    adicionarItem() {
        const nome = document.getElementById("produtoSelect").value;
        const qtdInput = document.getElementById("quantidadeItem");
        const qtd = parseInt(qtdInput.value);
        if (!nome || !qtd) return;
        const crafts = JSON.parse(localStorage.getItem("crafts") || "[]");
        const produto = crafts.find(c => c.nome === nome);
        this.encomendaAtual.push({ nome, qtd, precoUn: produto ? produto.preco : 0 });
        this.atualizarViewEncomenda();
        qtdInput.value = "";
    },

    atualizarViewEncomenda() {
        const container = document.getElementById("listaEncomenda");
        if (container) {
            container.innerHTML = this.encomendaAtual.map(item => `<div class="lista-item" style="font-size:0.9rem; color:#00ff90">📦 ${item.nome} x${item.qtd}</div>`).join('');
        }
    },

    limparCamposCraft() {
        document.getElementById("craftNome").value = "";
        document.getElementById("unidades").value = "";
        document.getElementById("precoVenda").value = "";
        document.getElementById("listaInsumosDinamicos").innerHTML = "";
        this.adicionarCampoInsumo();
    },

    limparCrafts() {
        if (confirm("Apagar todas as receitas?")) {
            localStorage.removeItem("crafts");
            this.carregarCrafts();
        }
    }
};

// Funções utilitárias globais
window.toggleModal = function(show) { 
    const modal = document.getElementById('modalSettings');
    if (modal) modal.style.display = show ? 'flex' : 'none'; 
};

// Inicialização automática
window.app.init();