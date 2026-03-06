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

  const [loadingKey, setLoadingKey] = useState(false);

  // Estados de Dados
  const [teamList, setTeamList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [keyList, setKeyList] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Estados para Novos Cargos
  const [newRole, setNewRole] = useState({
    name: "", canVendas: true, canCraft: true, canLogs: false, canAdmin: false
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const script = document.createElement("script");
      script.src = "./carnes/scripts.js";
      script.async = true;
      script.onload = () => { if (window.app) window.app.init(); };
      document.body.appendChild(script);
      refreshData();
    }
  }, [status]);

  const refreshData = () => {
    if (session?.user?.name === "admin") carregarKeys();
    if (session?.user?.isOwner) {
      carregarEquipe();
      carregarRoles();
    }
  };


  const carregarEquipe = async () => {
    const res = await fetch('/api/equipe');
    const data = await res.json();
    if (Array.isArray(data)) setTeamList(data);
  };

  const carregarRoles = async () => {
    const res = await fetch('/api/roles');
    const data = await res.json();
    if (Array.isArray(data)) setRoleList(data);
  };

  const mudarRoleUsuario = async (userId, roleId) => {
    const novoRoleId = roleId === "" ? null : roleId;

    // Atualização Otimista na UI para o nome mudar na hora
    setTeamList(prev => prev.map(m => {
      if (m.id === userId) {
        const dadosCargo = roleList.find(r => String(r.id) === String(roleId));
        return { 
          ...m, 
          roleId: novoRoleId, 
          role: dadosCargo ? { name: dadosCargo.name } : null 
        };
      }
      return m;
    }));

    setLoadingAction(true);
    try {
      const res = await fetch(`/api/equipe`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleId: novoRoleId })
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      alert("Erro ao atualizar no banco de dados.");
      carregarEquipe(); // Reverte para o estado real do banco
    } finally {
      setLoadingAction(false);
    }
  };

  const removerMembro = async (id) => {
    if (!confirm("⚠️ Deseja realmente remover este colaborador da empresa?")) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/equipe?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTeamList(prev => prev.filter(m => m.id !== id));
        alert("Membro removido!");
      }
    } catch (err) { alert("Erro ao deletar."); }
    finally { setLoadingAction(false); }
  };

  const criarRole = async () => {
    if (!newRole.name) return alert("Nome do cargo é obrigatório");
    setLoadingAction(true);
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRole)
    });
    if (res.ok) {
      setNewRole({ name: "", canVendas: true, canCraft: true, canLogs: false, canAdmin: false });
      carregarRoles();
    }
    setLoadingAction(false);
  };



  if (status === "loading") return <div className="loading-screen">Sincronizando SafraLog...</div>;



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
              <>
              <div className={`nav-item ${activeTab === "tab-roles" ? "active" : ""}`} onClick={() => showTab("tab-roles", "🛡️ Gestão de Cargos")}>🛡️ Gerenciar Cargos</div>
              <div className={`nav-item ${activeTab === "tab-equipe" ? "active" : ""}`} onClick={() => showTab("tab-equipe", "👥 Gestão de Equipe")}>👥 Gerenciar Equipe</div>
           </>
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
            <div style={styles.teamList}>
              {teamList.map(m => (
                <div key={m.id} style={styles.teamItem}>
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <b style={{color: '#fff', fontSize: '1rem'}}>{m.name}</b>
                      <span style={styles.badgeRole}>
                        {m.role?.name || "Sem Cargo"}
                      </span>
                    </div>
                    <div style={{marginTop: '8px'}}>
                      <span style={{fontSize:'0.65rem', color:'#666', display:'block', marginBottom:'2px', fontWeight:'bold'}}>ALTERAR CARGO:</span>
                      <select 
                        style={styles.roleSelect}
                        value={String(m.roleId ?? "")} 
                        onChange={(e) => mudarRoleUsuario(m.id, e.target.value)}
                      >
                        <option value="">🚫 Sem Cargo</option>
                        {roleList.map(role => (
                          <option key={role.id} value={String(role.id)}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button 
                    style={styles.btnRemove}
                    onClick={() => removerMembro(m.id)}
                    disabled={loadingAction}
                  >
                    REMOVER
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
<div id="tab-roles" className={`page-content ${activeTab === "tab-roles" ? "active" : ""}`}>
  <div style={styles.gridContainer}>
    
    {/* COLUNA ESQUERDA: FORMULÁRIO */}
    <div className="card" style={{ flex: 1, height: 'fit-content' }}>
      <h3 style={styles.cardTitle}>🛡️ Criar Novo Cargo</h3>
      <div style={{ marginBottom: '20px' }}>
        <label style={styles.labelInput}>Nome do Cargo</label>
        <input 
          type="text" 
          placeholder="Ex: Gerente, Açougueiro..." 
          className="m-input" 
          value={newRole.name} 
          onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} 
        />
      </div>

      <label style={styles.labelInput}>Permissões de Acesso</label>
      <div style={styles.checkboxGrid}>
        <label style={styles.checkLabel}>
          <input type="checkbox" checked={newRole.canVendas} onChange={(e) => setNewRole({ ...newRole, canVendas: e.target.checked })} />
          <span>🛒 Vendas</span>
        </label>
        <label style={styles.checkLabel}>
          <input type="checkbox" checked={newRole.canCraft} onChange={(e) => setNewRole({ ...newRole, canCraft: e.target.checked })} />
          <span>🛠️ Craft</span>
        </label>
        <label style={styles.checkLabel}>
          <input type="checkbox" checked={newRole.canLogs} onChange={(e) => setNewRole({ ...newRole, canLogs: e.target.checked })} />
          <span>📜 Logs</span>
        </label>
        <label style={styles.checkLabel}>
          <input type="checkbox" checked={newRole.canAdmin} onChange={(e) => setNewRole({ ...newRole, canAdmin: e.target.checked })} />
          <span>🔑 Admin</span>
        </label>
      </div>

      <button className="primary" style={styles.btnSave} onClick={criarRole} disabled={loadingAction}>
        {loadingAction ? "Processando..." : "Salvar Cargo"}
      </button>
    </div>

    {/* COLUNA DIREITA: LISTAGEM DE CARGOS EXISTENTES */}
    <div className="card" style={{ flex: 1.2 }}>
      <h3 style={styles.cardTitle}>📋 Cargos Ativos</h3>
      <div style={styles.roleListScroll}>
        {roleList.length > 0 ? (
          roleList.map((role) => (
            <div key={role.id} style={styles.roleCard}>
              <div style={styles.roleHeader}>
                <span style={styles.roleName}>{role.name}</span>
                <span style={styles.memberCount}>👥 {role._count?.users || 0} membros</span>
              </div>
              <div style={styles.permissionBadgeContainer}>
                {role.canVendas && <span style={styles.permBadge}>🛒 Vendas</span>}
                {role.canCraft && <span style={styles.permBadge}>🛠️ Craft</span>}
                {role.canLogs && <span style={styles.permBadge}>📜 Logs</span>}
                {role.canAdmin && <span style={{ ...styles.permBadge, borderColor: '#ff4c4c', color: '#ff4c4c' }}>🔑 Admin</span>}
              </div>
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>Nenhum cargo cadastrado ainda.</div>
        )}
      </div>
    </div>

  </div>
</div>
  {/* --- ABA: MASTER KEYS (SÓ ADMIN) --- */}
   {session?.user?.name === "admin" && (
          <div id="tab-master" className={`page-content ${activeTab === "tab-master" ? "active" : ""}`}>
            <div className="card" style={{border: '1px solid #f1c40f44'}}>
              <h3 style={{color: '#f1c40f'}}>🛠️ Gerador de Access Keys</h3>
              <p style={{marginBottom: '15px', color: '#aaa'}}>Defina a validade da licença para o novo cliente.</p>
              
              <div style={styles.masterForm}>
                <input 
                  type="number" 
                  placeholder="Ex: 30 dias" 
                  value={newKeyDays} 
                  onChange={(e) => setNewKeyDays(e.target.value)}
                  style={styles.masterInput}
                />
                <button 
                  className="primary" 
                  style={styles.masterBtn} 
                  onClick={gerarNovaKey}
                  disabled={loadingKey}
                >
                  {loadingKey ? "Gerando..." : "Gerar Chave"}
                </button>
              </div>
            </div>

            <div className="card">
              <h3>📋 Últimas Keys Geradas</h3>
              <div style={styles.keyList}>
                {keyList.map((k) => (
                  <div key={k.id} style={styles.keyItem}>
                    <code style={{color: '#f1c40f', fontSize: '1.1rem'}}>{k.key}</code>
                    <span style={{fontSize: '0.8rem', color: k.used ? '#ff4c4c' : '#00ff90'}}>
                      {k.used ? "❌ USADA" : `✅ DISPONÍVEL (${k.days} dias)`}
                    </span>
                  </div>
                ))}
                {keyList.length === 0 && <p style={{color: '#666'}}>Nenhuma chave encontrada no banco.</p>}
              </div>
            </div>
          </div>
        )}
</main>

       <div className="modal-overlay" id="modalSettings">
        <div className="modal">
          <h3>⚙️ Configurações do Painel</h3>
          
          <label>Nome da Empresa:</label>
          <input type="text" id="nomeEmpresaInput" />
          
          <label>Webhook Encomendas:</label>
          <input type="text" id="webhookVendasInput" placeholder="URL para pedidos" />

          <label>Webhook Logs:</label>
          <input type="text" id="webhookLogsInput" placeholder="URL para registros internos" />
          
          <div style={{display: 'flex', gap: '10px'}}>
            <div style={{flex: 1}}>
                <label>Cor Primária:</label>
                <input type="color" id="colorPrimary" />
            </div>
            <div style={{flex: 1}}>
                <label>Cor Destaque:</label>
                <input type="color" id="colorAccent" />
            </div>
          </div>

          <button className="primary btn-theme" onClick={() => app.salvarConfig()}>Salvar Configurações</button>
          <button className="btn-outline" onClick={() => toggleModal(false)}>Fechar</button>
        </div>
      </div>
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
  },
   // UI EQUIPE
  badgeRole: { background: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', border: '1px solid rgba(241, 196, 15, 0.3)', textTransform: 'uppercase' },
  roleSelect: { background: '#0a0a0f', border: '1px solid #333', color: '#fff', fontSize: '0.8rem', padding: '6px', borderRadius: '5px', width: '100%', maxWidth: '180px', cursor: 'pointer', outline: 'none' },
  btnRemove: { background: 'transparent', border: '1px solid #ff4c4c', color: '#ff4c4c', padding: '8px 15px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
  gridContainer: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  cardTitle: {
    fontSize: '1.1rem',
    marginBottom: '20px',
    color: '#fff',
    borderBottom: '1px solid #333',
    paddingBottom: '10px'
  },
  labelInput: {
    fontSize: '0.7rem',
    color: '#aaa',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
    display: 'block'
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    background: '#0d0d15',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #222'
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#eee',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '5px'
  },
  btnSave: {
    marginTop: '20px',
    width: '100%',
    padding: '12px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  roleListScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '500px',
    overflowY: 'auto',
    paddingRight: '5px'
  },
  roleCard: {
    background: '#161625',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    padding: '15px',
    transition: '0.2s hover',
  },
  roleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  roleName: {
    fontWeight: 'bold',
    color: '#f1c40f',
    fontSize: '1rem'
  },
  memberCount: {
    fontSize: '0.75rem',
    color: '#666'
  },
  permissionBadgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  permBadge: {
    fontSize: '0.65rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #444',
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#bbb'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#555',
    fontStyle: 'italic'
  },
  teamList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  teamItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#1c1c2e', borderRadius: '8px', border: '1px solid #333' }

};