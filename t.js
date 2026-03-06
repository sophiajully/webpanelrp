"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tab-vendas");
  
  // Estados para a Aba Master
  const [newKeyDays, setNewKeyDays] = useState(30);
  const [keyList, setKeyList] = useState([]);
  const [loadingKey, setLoadingKey] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      const script = document.createElement("script");
      script.src = "./carnes/scripts.js";
      script.async = true;
      script.onload = () => { if (window.app) window.app.init(); };
      document.body.appendChild(script);
      
      if (session?.user?.name === "admin") carregarKeys();
    }
  }, [status]);

  // Função Real para buscar keys do banco
  const carregarKeys = async () => {
    const res = await fetch('/api/keys');
    const data = await res.json();
    if (Array.isArray(data)) setKeyList(data);
  };

  // Função Real para gerar key no banco
  const gerarNovaKey = async () => {
    setLoadingKey(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: newKeyDays })
      });
      if (res.ok) {
        alert("Chave gerada com sucesso!");
        carregarKeys();
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoadingKey(false);
    }
  };

  if (status === "loading") return <div className="loading-screen">Carregando Açougue...</div>;

  const showTab = (tabId, title) => {
    setActiveTab(tabId);
    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.innerText = title;
  };

  return (
    <>
      <nav className="sidebar" style={styles.sidebar}>
        <div className="sidebar-top-section">
          <div className="sidebar-header" id="nomeEmpresaDisplay">
            {session?.user?.companyName || "Açougue Winchester"}
          </div>
          
          <div className="nav-menu">
            <div className={`nav-item ${activeTab === "tab-vendas" ? "active" : ""}`} onClick={() => showTab("tab-vendas", "🛒 Nova Encomenda")}>🛒 Nova Encomenda</div>
            <div className={`nav-item ${activeTab === "tab-pedidos" ? "active" : ""}`} onClick={() => showTab("tab-pedidos", "📋 Pedidos")}>📋 Pedidos</div>

            {(session?.user?.isOwner || session?.user?.role?.canCraft) && (
              <>
                <div className={`nav-item ${activeTab === "tab-registrar" ? "active" : ""}`} onClick={() => showTab("tab-registrar", "🛠️ Registrar Craft")}>🛠️ Registrar Craft</div>
                <div className={`nav-item ${activeTab === "tab-producao" ? "active" : ""}`} onClick={() => showTab("tab-producao", "🥩 Painel de Produção")}>🥩 Painel de Produção</div>
              </>
            )}

            {session?.user?.isOwner && (
              <div className={`nav-item ${activeTab === "tab-equipe" ? "active" : ""}`} onClick={() => showTab("tab-equipe", "👥 Gestão de Equipe")}>👥 Gerenciar Equipe</div>
            )}

            {session?.user?.name === "admin" && (
              <div className={`nav-item ${activeTab === "tab-master" ? "active" : ""}`} 
                   style={{borderLeft: '4px solid #f1c40f', color: '#f1c40f'}}
                   onClick={() => showTab("tab-master", "🔑 Master Keys")}>
                🔑 Master Keys
              </div>
            )}
          </div>
        </div>

        <div className="user-info-bar" style={styles.userInfoBar}>
          <div style={styles.userDetails}>
            <span style={styles.userName}>👤 {session?.user?.name}</span>
            <span style={styles.userRole}>🎖️ {session?.user?.role?.name || (session?.user?.isOwner ? "Dono" : "Funcionário")}</span>
          </div>
          <button className="btn-logout-icon" onClick={() => signOut()} style={styles.btnLogoutIcon}>🚪</button>
        </div>
      </nav>

     <main className="main-content">
  <header>
    <h2 id="page-title">Nova Encomenda</h2>
    <button className="btn-settings" onClick={() => window.toggleModal(true)}>⚙️</button>
  </header>

  {/* --- ABA: VENDAS (Sempre visível se ativa) --- */}
  <div id="tab-vendas" className={`page-content ${activeTab === "tab-vendas" ? "active" : ""}`}>
    <div className="card">
      <h3>🛒 Nova Encomenda</h3>
      <input type="text" id="clienteNome" placeholder="Nome do Cliente" />
      <input type="text" id="clientePombo" placeholder="Pombo (Contato)" />
      <h3 style={{ marginTop: "20px" }}>Produtos</h3>
      <select id="produtoSelect"></select>
      <input type="number" id="quantidadeItem" placeholder="Quantidade" />
      <button className="primary btn-theme" onClick={() => window.app.adicionarItem()}>+ Adicionar à Lista</button>
    </div>
    <div className="card">
      <h3>Resumo</h3>
      <div id="listaEncomenda"></div>
      <button onClick={() => window.app.calcularEncomenda()} className="btn-outline">Finalizar Encomenda</button>
    </div>
  </div>

  {/* --- ABA: PEDIDOS --- */}
  <div id="tab-pedidos" className={`page-content ${activeTab === "tab-pedidos" ? "active" : ""}`}>
    <div className="card">
      <h3>📋 Histórico de Pedidos</h3>
      <div id="listaPedidosGeral">Carregando pedidos...</div>
    </div>
  </div>

  {/* --- ABA: REGISTRAR CRAFT --- */}
  <div id="tab-registrar" className={`page-content ${activeTab === "tab-registrar" ? "active" : ""}`}>
    <div className="card">
      <h3>🛠️ Configurar Nova Receita</h3>
      <input type="text" id="craftNome" placeholder="Nome do Produto" />
      <input type="number" id="unidades" placeholder="Qtd. produzida" />
      <div id="areaInsumos">
        <h4>Insumos</h4>
        <div id="listaInsumosDinamicos"></div>
        <button className="btn-outline" onClick={() => window.app.adicionarCampoInsumo()}>+ Insumo</button>
      </div>
      <button className="primary" onClick={() => window.app.registrarCraft()}>Salvar Receita</button>
    </div>
  </div>

  {/* --- ABA: PAINEL DE PRODUÇÃO --- */}
  <div id="tab-producao" className={`page-content ${activeTab === "tab-producao" ? "active" : ""}`}>
    <div className="card">
      <h3>🥩 Painel de Produção</h3>
      <div id="listaCrafts"></div>
      <button className="primary" onClick={() => window.app.calcularMateriais()}>Gerar Relatório</button>
    </div>
    <div id="materiaisResultado" className="result" style={{display: 'none'}}></div>
  </div>

  {/* --- ABA: GESTÃO DE EQUIPE --- */}
  <div id="tab-equipe" className={`page-content ${activeTab === "tab-equipe" ? "active" : ""}`}>
    <div className="card">
      <h3>👥 Gestão de Colaboradores</h3>
      <div id="listaEquipeDono">Carregando equipe...</div>
    </div>
  </div>

  {/* --- ABA: MASTER KEYS (SÓ ADMIN) --- */}
  {session?.user?.name === "admin" && (
    <div id="tab-master" className={`page-content ${activeTab === "tab-master" ? "active" : ""}`}>
      {/* O conteúdo que você já tinha aqui da Master Key */}
      <div className="card" style={{border: '1px solid #f1c40f44'}}>
         <h3 style={{color: '#f1c40f'}}>🛠️ Gerador de Access Keys</h3>
         <div style={styles.masterForm}>
            <input type="number" value={newKeyDays} onChange={(e) => setNewKeyDays(e.target.value)} style={styles.masterInput} />
            <button className="primary" style={styles.masterBtn} onClick={gerarNovaKey} disabled={loadingKey}>
              {loadingKey ? "Gerando..." : "Gerar Chave"}
            </button>
         </div>
      </div>
      <div className="card">
         <h3>📋 Keys Geradas</h3>
         <div style={styles.keyList}>
            {keyList.map(k => (
              <div key={k.id} style={styles.keyItem}>
                <code>{k.key}</code>
                <span>{k.used ? "❌" : "✅"}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  )}
</main>

      {/* --- MODAL CONFIGURAÇÕES --- */}
      {/* ... (Conteúdo do modal permanece igual) ... */}
    </>
  );
}

// --- ESTILOS CORRIGIDOS ---
const styles = {
  sidebar: { position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100vh' },
  userInfoBar: { padding: '15px 20px', background: '#161625', borderTop: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' },
  userDetails: { display: 'flex', flexDirection: 'column', gap: '2px' },
  userName: { fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' },
  userRole: { fontSize: '0.7rem', color: '#ff4c4c', fontWeight: 'bold', textTransform: 'uppercase' },
  btnLogoutIcon: { background: 'rgba(255, 76, 76, 0.1)', border: '1px solid #ff4c4c', color: '#ff4c4c', borderRadius: '8px', width: '38px', height: '38px', cursor: 'pointer' },
  
  // Estilos da Aba Master
  masterForm: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    marginTop: '10px'
  },
  masterInput: {
    flex: '2', // Input agora é muito maior
    padding: '12px',
    fontSize: '1rem',
    background: '#0a0a0f',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: '6px'
  },
  masterBtn: {
    flex: '1', // Botão agora tem tamanho proporcional
    padding: '12px',
    background: '#f1c40f',
    color: '#000',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  keyList: {
    marginTop: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  keyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1c1c2e',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #333'
  }
};