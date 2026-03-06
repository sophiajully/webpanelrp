"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ShoppingCart, 
  ClipboardList, 
  Hammer, 
  Beef, 
  Shield, 
  Users, 
  Key, 
  User, 
  Medal, 
  LogOut, 
  Settings, 
  Trash2, 
  Calculator, 
  Package, 
  CheckCircle, 
  XCircle, 
  Ban,
  UserPlus
} from "lucide-react";

export default function Home() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("tab-vendas");
  const [producaoQtds, setProducaoQtds] = useState({});
  const [newKeyDays, setNewKeyDays] = useState(30);
  const [loadingKey, setLoadingKey] = useState(false);
  const [craftList, setCraftList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [keyList, setKeyList] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "", canVendas: true, canCraft: true, canLogs: false, canAdmin: false
  });

  const handleQtdChange = (id, valor) => {
    setProducaoQtds(prev => ({ ...prev, [id]: valor }));
  };

  const handleSalvarConfig = async () => {
  // Chama a função do scripts.js e espera os dados
  const novosDados = await window.app.salvarConfig(session?.user?.companyId);
  console.log(session.user)
  // Se salvou com sucesso no banco, atualizamos a sessão no React
  if (novosDados && update) {
    await update({
      ...session,
      user: {
        ...session.user,
        colorPrimary: novosDados.colorPrimary,
        colorAccent: novosDados.colorAccent,
        companyName: novosDados.name
      }
    });
     if (status === "authenticated") {
    // Pegue as cores da sessão (Verifique no console se os nomes dos campos estão certos)
    const corPrimaria = session?.user?.colorPrimary || "#d4a91c";
    const corDestaque = session?.user?.colorAccent || "#f1c40f";

    console.log("Cores carregadas:", { corPrimaria, corDestaque });

    const root = document.documentElement;
    root.style.setProperty('--cor-primaria', corPrimaria);
    root.style.setProperty('--cor-destaque', corDestaque);
    
    // Versões com transparência para o background dos itens ativos
    root.style.setProperty('--cor-primaria-bg', `${corPrimaria}1A`); 
    root.style.setProperty('--cor-destaque-bg', `${corDestaque}1A`);
  }
    console.log("Sessão atualizada com as novas cores!");
  }
};

  const carregarCrafts = useCallback(async () => {
    const res = await fetch('/api/crafts');
    const data = await res.json();
    if (Array.isArray(data)) {
      const formatados = data.map(c => ({
        ...c,
        insumos: JSON.parse(c.insumos)
      }));
      setCraftList(formatados); 
    }
  }, []);
const [hireRequests, setHireRequests] = useState([]);

// No seu useEffect que carrega a equipe, adicione:
const carregarSolicitacoes = async () => {
  const res = await fetch('/api/hire-requests');
  const data = await res.json();
  setHireRequests(data);
};

const gerenciarSolicitacao = async (requestId, action) => {
  setLoadingAction(true);
  try {
    const res = await fetch('/api/hire-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action })
    });
    
    if (res.ok) {
      // Recarrega as duas listas para atualizar a tela
      carregarSolicitacoes();
      carregarEquipe(); 
    }
  } catch (err) {
    alert("Erro ao processar solicitação");
  } finally {
    setLoadingAction(false);
  }
};
  const excluirKey = async (id) => {
  if (!confirm("Deseja realmente excluir esta chave de acesso?")) return;
  
  setLoadingAction(true);
  try {
    const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setKeyList(prev => prev.filter(k => k.id !== id));
      alert("Chave excluída com sucesso!");
    } else {
      alert("Erro ao excluir a chave.");
    }
  } catch (err) {
    alert("Erro de conexão.");
  } finally {
    setLoadingAction(false);
  }
};

  const carregarKeys = useCallback(async () => {
    const res = await fetch('/api/keys');
    const data = await res.json();
    if (Array.isArray(data)) setKeyList(data);
  }, []);

  const carregarEquipe = useCallback(async () => {
    const res = await fetch('/api/equipe');
    const data = await res.json();
    if (Array.isArray(data)) setTeamList(data);
  }, []);

  const carregarRoles = useCallback(async () => {
    const res = await fetch('/api/roles');
    const data = await res.json();
    if (Array.isArray(data)) setRoleList(data);
  }, []);

  const refreshData = useCallback(() => {
    if (session?.user?.name === "admin") carregarKeys();
    if (session?.user?.isOwner) {
      carregarEquipe();
      carregarRoles();
      carregarCrafts();
      carregarSolicitacoes();
       const corPrimaria = session?.user?.colorPrimary || "#d4a91c";
    const corDestaque = session?.user?.colorAccent || "#f1c40f";

    console.log("Cores carregadas:", { corPrimaria, corDestaque });

    const root = document.documentElement;
    root.style.setProperty('--cor-primaria', corPrimaria);
    root.style.setProperty('--cor-destaque', corDestaque);
    
    // Versões com transparência para o background dos itens ativos
    root.style.setProperty('--cor-primaria-bg', `${corPrimaria}1A`); 
    root.style.setProperty('--cor-destaque-bg', `${corDestaque}1A`);
    }
  }, [session, carregarKeys, carregarEquipe, carregarRoles, carregarCrafts]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      document.body.setAttribute("data-company-id", session?.user?.companyId || "");
      const script = document.createElement("script");
      script.src = "./carnes/scripts.js";
      script.async = true;
      script.onload = () => { if (window.app) window.app.init(); };
      document.body.appendChild(script);
      refreshData();

    }
  }, [status, session, router, refreshData]);

  useEffect(() => {
    if (activeTab === "tab-roles") {
      carregarRoles();
    }
    window.carregarRoles = carregarRoles;
  }, [activeTab, carregarRoles]);

  const mudarRoleUsuario = async (userId, roleId) => {
    const novoRoleId = roleId === "" ? null : roleId;

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
      carregarEquipe();
    } finally {
      setLoadingAction(false);
    }
  };

  const removerMembro = async (id) => {
    if (!confirm("Deseja realmente remover este colaborador da empresa?")) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/equipe?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTeamList(prev => prev.filter(m => m.id !== id));
        alert("Membro removido!");
      }
    } catch (err) { 
      alert("Erro ao deletar."); 
    } finally { 
      setLoadingAction(false); 
    }
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

  const showTab = (tabId, title) => {
    setActiveTab(tabId);
    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.innerText = title;
  };

  if (status === "loading") {
    return (
      <div style={styles.loadingScreen}>
        Sincronizando Sistema...
      </div>
    );
  }

  return (
    <div style={styles.layoutWrapper}>
      <nav style={styles.sidebar}>
        <div style={styles.sidebarTopSection}>
          <div style={styles.sidebarHeader} id="nomeEmpresaDisplay">
            {session?.user?.companyName || "Açougue Winchester"}
          </div>
          
          <div style={styles.navMenu}>
            <div 
              style={{...styles.navItem, ...(activeTab === "tab-vendas" ? styles.navItemActive : {})}} 
              onClick={() => showTab("tab-vendas", "Nova Encomenda")}
            >
              <ShoppingCart size={18} /> Nova Encomenda
            </div>
            
            <div 
              style={{...styles.navItem, ...(activeTab === "tab-pedidos" ? styles.navItemActive : {})}} 
              onClick={() => showTab("tab-pedidos", "Pedidos")}
            >
              <ClipboardList size={18} /> Pedidos
            </div>

            {(session?.user?.isOwner || session?.user?.role?.canCraft) && (
              <>
                <div 
                  style={{...styles.navItem, ...(activeTab === "tab-registrar" ? styles.navItemActive : {})}} 
                  onClick={() => showTab("tab-registrar", "Registrar Craft")}
                >
                  <Hammer size={18} /> Registrar Craft
                </div>
                <div 
                  style={{...styles.navItem, ...(activeTab === "tab-producao" ? styles.navItemActive : {})}} 
                  onClick={() => showTab("tab-producao", "Painel de Produção")}
                >
                  <Beef size={18} /> Painel de Produção
                </div>
              </>
            )}

            {session?.user?.isOwner && (
              <>
                <div 
                  style={{...styles.navItem, ...(activeTab === "tab-roles" ? styles.navItemActive : {})}} 
                  onClick={() => showTab("tab-roles", "Gerenciar Cargos")}
                >
                  <Shield size={18} /> Gerenciar Cargos
                </div>
                <div 
                  style={{...styles.navItem, ...(activeTab === "tab-equipe" ? styles.navItemActive : {})}} 
                  onClick={() => showTab("tab-equipe", "Gerenciar Equipe")}
                >
                  <Users size={18} /> Gerenciar Equipe
                </div>
              </>
            )}

            {session?.user?.name === "admin" && (
  <>
    <div style={{ padding: '10px 20px 5px', fontSize: '0.65rem', color: '#444', fontWeight: 'bold' }}>ADMINISTRAÇÃO</div>
    <div 
      style={{...styles.navItem, ...(activeTab === "tab-master" ? styles.navItemMasterActive : styles.navItemMaster)}} 
      onClick={() => showTab("tab-master", "Master Keys")}
    >
      <Key size={18} /> Master Keys
    </div>
  </>
)}
          </div>
        </div>

        <div style={styles.userInfoBar}>
          <div style={styles.userDetails}>
            <span style={styles.userName}>
              <User size={14} style={{ marginRight: '4px' }} /> 
              {session?.user?.name}
            </span>
            <span style={styles.userRole}>
              <Medal size={12} style={{ marginRight: '4px' }} /> 
              {session?.user?.role?.name || (session?.user?.isOwner ? "Dono" : "Funcionário")}
            </span>
          </div>
          <button style={styles.btnLogoutIcon} onClick={() => signOut()}>
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main style={styles.mainContent}>
        <header style={styles.mainHeader}>
          <h2 id="page-title" style={styles.pageTitle}>Nova Encomenda</h2>
          <button style={styles.btnSettings} onClick={() => window.toggleModal(true)}>
            <Settings size={20} />
          </button>
        </header>

        <div id="tab-vendas" style={{...styles.pageContent, display: activeTab === "tab-vendas" ? "block" : "none"}}>
          <div style={styles.card}>
            <h3 style={styles.cardHeader}><ShoppingCart size={20} /> Nova Encomenda</h3>
            <div style={styles.inputGroup}>
              <input type="text" id="clienteNome" placeholder="Nome do Cliente" style={styles.baseInput} />
              <input type="text" id="clientePombo" placeholder="Pombo (Contato)" style={styles.baseInput} />
            </div>
            <h3 style={{ ...styles.cardHeader, marginTop: "24px" }}>Produtos</h3>
            <div style={styles.inputGroup}>
              <select id="produtoSelect" style={styles.baseInput}></select>
              <input type="number" id="quantidadeItem" placeholder="Quantidade" style={styles.baseInput} />
            </div>
            <button style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '16px'}} onClick={() => window.app.adicionarItem()}>
              + Adicionar à Lista
            </button>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardHeader}>Resumo</h3>
            <div id="listaEncomenda" style={{ marginBottom: '16px' }}></div>
            <button onClick={() => window.app.calcularEncomenda()} style={{...styles.baseButton, ...styles.buttonOutline}}>
              Finalizar Encomenda
            </button>
          </div>
        </div>

        <div id="tab-pedidos" style={{...styles.pageContent, display: activeTab === "tab-pedidos" ? "block" : "none"}}>
          <div style={styles.card}>
            <h3 style={styles.cardHeader}><ClipboardList size={20} /> Histórico de Pedidos</h3>
            <div id="listaPedidosGeral" style={{ color: '#8a8f9c' }}>Carregando pedidos...</div>
          </div>
        </div>

        <div id="tab-registrar" style={{...styles.pageContent, display: activeTab === "tab-registrar" ? "block" : "none"}}>
          <div style={styles.card}>
            <h3 style={styles.cardHeader}><Hammer size={20} /> Configurar Nova Receita</h3>
            <div style={styles.inputGroup}>
              <input type="text" id="craftNome" placeholder="Nome do Produto" style={styles.baseInput} />
              <input type="number" id="unidades" placeholder="Qtd. produzida" style={styles.baseInput} />
            </div>
            <div id="areaInsumos" style={{ marginTop: '24px' }}>
              <h4 style={{ color: '#e6e6e6', marginBottom: '12px', fontSize: '0.9rem' }}>Insumos</h4>
              <div id="listaInsumosDinamicos" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}></div>
              <button style={{...styles.baseButton, ...styles.buttonOutline}} onClick={() => window.app.adicionarCampoInsumo()}>
                + Adicionar Insumo
              </button>
            </div>
            <button style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '24px', width: '100%'}} onClick={() => {
              window.app.registrarCraft();
              refreshData()
            }}>
              Salvar Receita
            </button>
          </div>
        </div>

        <div id="tab-producao" style={{...styles.pageContent, display: activeTab === "tab-producao" ? "block" : "none"}}>
          <div style={styles.card}>
            <h3 style={styles.cardHeader}><Beef size={20} /> Painel de Produção</h3>
            <p style={{fontSize: '0.85rem', color: '#8a8f9c', marginBottom: '20px'}}>
              Insira a quantidade que deseja fabricar:
            </p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {craftList.map((item) => (
                <div key={item.id} style={styles.producaoItem}>
                  <div style={{flex: 1}}>
                    <b style={{color: '#fff', fontSize: '0.95rem'}}>{item.name}</b>
                    <span style={{display: 'block', fontSize: '0.75rem', color: '#8a8f9c', marginTop: '4px'}}>Unidade: {item.unit}</span>
                  </div>
                  
                  <input 
                    type="number" 
                    placeholder="0"
                    min="0"
                    value={producaoQtds[item.id] || ""} 
                    onChange={(e) => handleQtdChange(item.id, e.target.value)}
                    style={styles.producaoInput} 
                  />

                  <button 
                    onClick={() => window.app.removerReceita(item.id)}
                    style={styles.btnIconDanger}
                    title="Excluir Receita"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button 
              style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '24px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} 
              onClick={() => window.app.calcularMateriais(craftList, producaoQtds)}
            >
              <Calculator size={18} /> Calcular Materiais Necessários
            </button>
          </div>

          <div id="materiaisResultado" style={{...styles.card, display: 'none', marginTop: '20px', borderLeft: '4px solid #d4a91c'}}>
            <h4 style={{color: '#d4a91c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Package size={18} /> Total para Coleta:
            </h4>
            <div id="listaInsumosSomados"></div>
          </div>
        </div>

        <div id="tab-equipe" style={{...styles.pageContent, display: activeTab === "tab-equipe" ? "block" : "none"}}>
          <div style={styles.card}>
            <h3 style={styles.cardHeader}><Users size={20} /> Gestão de Colaboradores</h3>
            <div style={styles.teamList}>
              {teamList.map(m => (
                <div key={m.id} style={styles.teamItem}>
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                      <b style={{color: '#fff', fontSize: '1rem'}}>{m.name}</b>
                      <span style={styles.badgeRole}>
                        {m.role?.name || "Sem Cargo"}
                      </span>
                    </div>
                    <div>
                      <span style={{fontSize:'0.7rem', color:'#8a8f9c', display:'block', marginBottom:'6px', fontWeight:'600'}}>ALTERAR CARGO:</span>
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
                    style={{...styles.baseButton, ...styles.buttonDangerGhost}}
                    onClick={() => removerMembro(m.id)}
                    disabled={loadingAction}
                  >
                    REMOVER
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={{...styles.card, marginBottom: '20px', border: '1px solid #f1c40f44'}}>
  <h3 style={{...styles.cardHeader, color: '#f1c40f'}}>
    <UserPlus size={20} /> Solicitações de Entrada
  </h3>
  <div style={styles.teamList}>
    {hireRequests.length === 0 && (
      <p style={{color: '#8a8f9c', padding: '10px'}}>Nenhuma solicitação pendente.</p>
    )}
    {hireRequests.map(req => (
      <div key={req.id} style={{...styles.teamItem, borderLeft: '3px solid #f1c40f'}}>
        <div style={{flex: 1}}>
          <b style={{color: '#fff'}}>{req.user.username}</b>
          <span style={{display:'block', fontSize:'0.75rem', color:'#8a8f9c'}}>Solicitou entrada na sua empresa</span>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button 
            style={{...styles.baseButton, background: '#2ecc71', color: '#fff', padding: '8px 15px'}}
            onClick={() => gerenciarSolicitacao(req.id, 'approve')}
          >
            APROVAR
          </button>
          <button 
            style={{...styles.baseButton, background: '#e74c3c', color: '#fff', padding: '8px 15px'}}
            onClick={() => gerenciarSolicitacao(req.id, 'reject')}
          >
            REJEITAR
          </button>
        </div>
      </div>
    ))}
  </div>
</div>
        </div>

        <div id="tab-roles" style={{...styles.pageContent, display: activeTab === "tab-roles" ? "block" : "none"}}>
          <div style={styles.gridContainer}>
            
            <div style={{...styles.card, flex: 1, height: 'fit-content'}}>
              <h3 style={styles.cardHeader}><Shield size={20} /> Criar Novo Cargo</h3>
              <div style={{ marginBottom: '20px' }}>
                <label style={styles.labelInput}>Nome do Cargo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Gerente, Açougueiro..." 
                  style={styles.baseInput}
                  value={newRole.name} 
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} 
                />
              </div>

              <label style={styles.labelInput}>Permissões de Acesso</label>
              <div style={styles.checkboxGrid}>
                <label style={styles.checkLabel}>
                  <input type="checkbox" checked={newRole.canVendas} onChange={(e) => setNewRole({ ...newRole, canVendas: e.target.checked })} />
                  <ShoppingCart size={14} /> <span>Vendas</span>
                </label>
                <label style={styles.checkLabel}>
                  <input type="checkbox" checked={newRole.canCraft} onChange={(e) => setNewRole({ ...newRole, canCraft: e.target.checked })} />
                  <Hammer size={14} /> <span>Craft</span>
                </label>
                <label style={styles.checkLabel}>
                  <input type="checkbox" checked={newRole.canLogs} onChange={(e) => setNewRole({ ...newRole, canLogs: e.target.checked })} />
                  <ClipboardList size={14} /> <span>Logs</span>
                </label>
                <label style={styles.checkLabel}>
                  <input type="checkbox" checked={newRole.canAdmin} onChange={(e) => setNewRole({ ...newRole, canAdmin: e.target.checked })} />
                  <Key size={14} /> <span>Admin</span>
                </label>
              </div>

              <button style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '24px', width: '100%'}} onClick={criarRole} disabled={loadingAction}>
                {loadingAction ? "Processando..." : "Salvar Cargo"}
              </button>
            </div>

            <div style={{...styles.card, flex: 1.2}}>
              <h3 style={styles.cardHeader}><ClipboardList size={20} /> Cargos Ativos</h3>
              <div style={styles.roleListScroll}>
                {roleList.length > 0 ? (
                  roleList.map((role) => (
                    <div key={role.id} style={styles.roleCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <span style={styles.roleName}>{role.name}</span>
                          <span style={styles.memberCount}><Users size={12} style={{marginRight: '4px'}} />{role._count?.users || 0}</span>
                        </div>
                        
                        <button 
                          onClick={() => window.app.excluirRole(role.id, role.name)}
                          style={styles.btnIconDangerGhost}
                          title="Excluir Cargo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={styles.permissionBadgeContainer}>
                        {role.canVendas && <span style={styles.permBadge}><ShoppingCart size={10} /> Vendas</span>}
                        {role.canCraft && <span style={styles.permBadge}><Hammer size={10} /> Craft</span>}
                        {role.canLogs && <span style={styles.permBadge}><ClipboardList size={10} /> Logs</span>}
                        {role.canAdmin && <span style={{ ...styles.permBadge, borderColor: '#ff4c4c', color: '#ff4c4c' }}><Key size={10} /> Admin</span>}
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

        {session?.user?.name === "admin" && (
          <div id="tab-master" style={{...styles.pageContent, display: activeTab === "tab-master" ? "block" : "none"}}>
            <div style={{...styles.card, border: '1px solid #f1c40f44'}}>
              <h3 style={{color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                <Key size={20} /> Gerador de Access Keys
              </h3>
              <p style={{marginBottom: '20px', color: '#8a8f9c', fontSize: '0.9rem'}}>Defina a validade da licença para o novo cliente.</p>
              
              <div style={styles.masterForm}>
                <input 
                  type="number" 
                  placeholder="Ex: 30 dias" 
                  value={newKeyDays} 
                  onChange={(e) => setNewKeyDays(e.target.value)}
                  style={styles.masterInput}
                />
                <button 
                  style={styles.masterBtn} 
                  onClick={gerarNovaKey}
                  disabled={loadingKey}
                >
                  {loadingKey ? "Gerando..." : "Gerar Chave"}
                </button>
              </div>
            </div>

            <div style={styles.card}>
  <h3 style={styles.cardHeader}><ClipboardList size={20} /> Últimas Keys Geradas</h3>
  <div style={styles.keyList}>
    {keyList.map((k) => (
      <div key={k.id} style={{...styles.keyItem, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <code style={{color: '#f1c40f', fontSize: '1.1rem', letterSpacing: '1px'}}>{k.key}</code>
          <span style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600', color: k.used ? '#ff4c4c' : '#00ff90'}}>
            {k.used ? <XCircle size={14} /> : <CheckCircle size={14} />}
            {k.used ? "USADA" : `DISPONÍVEL (${k.days} dias)`}
          </span>
        </div>
        
        <button 
          onClick={() => excluirKey(k.id)}
          style={styles.btnIconDangerGhost}
          title="Excluir Chave"
          disabled={loadingAction}
        >
          <Trash2 size={18} />
        </button>
      </div>
    ))}
    {keyList.length === 0 && <p style={{color: '#8a8f9c'}}>Nenhuma chave encontrada no banco.</p>}
  </div>
</div>
          </div>
        )}
      </main>

      <div className="modal-overlay" id="modalSettings" style={{ display: 'none' }}>
        <div className="modal" style={styles.modalBody}>
          <h3 style={{...styles.cardHeader, marginBottom: '24px'}}><Settings size={20} /> Configurações do Painel</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={styles.labelInput}>Nome da Empresa:</label>
              <input type="text" id="nomeEmpresaInput" style={styles.baseInput} disabled={session?.user?.name !== 'admin'} />
            </div>
            
            <div>
              <label style={styles.labelInput}>Webhook Encomendas:</label>
              <input type="text" id="webhookVendasInput" placeholder="URL para pedidos" style={styles.baseInput} disabled={session?.user?.name !== 'admin'} />
            </div>

            <div>
              <label style={styles.labelInput}>Webhook Logs:</label>
              <input type="text" id="webhookLogsInput" placeholder="URL para registros internos" style={styles.baseInput} disabled={session?.user?.name !== 'admin'} />
            </div>
            
            <div style={{display: 'flex', gap: '16px'}}>
              <div style={{flex: 1}}>
                  <label style={styles.labelInput}>Cor Primária:</label>
                  <input 
  type="color" 
  id="colorPrimary" 
  defaultValue={session?.user?.colorPrimary || "#d4a91c"} // <-- Adicionar isso
  style={{...styles.baseInput, padding: '4px', height: '40px'}} 
  disabled={session?.user?.name !== 'admin'}
/> </div>
              <div style={{flex: 1}}>
                  <label style={styles.labelInput}>Cor Destaque:</label>
                  <input type="color" id="colorAccent" style={{...styles.baseInput, padding: '4px', height: '40px'}} disabled={session?.user?.name !== 'admin'}/>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button style={{...styles.baseButton, ...styles.buttonPrimary, flex: 1}} onClick={handleSalvarConfig} disabled={session?.user?.name !== 'admin'}>
                Salvar
              </button>
              <button style={{...styles.baseButton, ...styles.buttonOutline, flex: 1}} onClick={() => toggleModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layoutWrapper: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0a0b10',
    color: '#e6e6e6',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0a0b10',
    color: '#d4a91c',
    fontSize: '1.2rem',
    fontWeight: '600'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '280px',
    background: '#0f1117',
    borderRight: '1px solid #1f2430'
  },
  sidebarTopSection: {
    padding: '20px 0'
  },
  sidebarHeader: {
    padding: '0 20px 24px 20px',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#fff',
    borderBottom: '1px solid #1f2430',
    marginBottom: '16px'
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 12px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#8a8f9c',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  navItemActive: {
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
    fontWeight: '600'
  },
  navItemMaster: {
    marginTop: '16px',
    color: 'var(--cor-destaque, #f1c40f)',
    borderLeft: '3px solid transparent'
  },
  navItemMasterActive: {
    marginTop: '16px',
    background: 'var(--cor-destaque-bg, rgba(241, 196, 15, 0.1))',
    color: 'var(--cor-destaque, #f1c40f)',
    borderLeft: '3px solid var(--cor-destaque, #f1c40f)',
    fontWeight: '600'
  },
// Procure e ajuste estas chaves no seu const styles:

  navItemMaster: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '16px',
    color: '#f1c40f', // Amarelo fixo (não usa variável)
    borderLeft: '3px solid transparent'
  },

  navItemMasterActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '16px',
    background: 'rgba(241, 196, 15, 0.1)', // Fundo amarelado fixo
    color: '#f1c40f',                      // Texto amarelo fixo
    borderLeft: '3px solid #f1c40f',       // Borda amarela fixa
    fontWeight: '600'
  },
  userInfoBar: {
    padding: '16px 20px',
    background: '#0a0b10',
    borderTop: '1px solid #1f2430',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  userName: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#e6e6e6'
  },
  userRole: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.7rem',
    color: 'var(--cor-primaria, #d4a91c)',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  btnLogoutIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#141720',
    border: '1px solid #2a2f3c',
    color: '#ff5a5a',
    borderRadius: '6px',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    transition: '0.2s'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    padding: '32px 40px'
  },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  },
  pageTitle: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#fff'
  },
  btnSettings: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#12141b',
    border: '1px solid #1f2430',
    color: '#8a8f9c',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    transition: '0.2s'
  },
  pageContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    background: '#12141b',
    border: '1px solid #1f2430',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.1rem',
    marginBottom: '20px',
    color: '#fff',
    borderBottom: '1px solid #1f2430',
    paddingBottom: '12px'
  },
  gridContainer: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  baseInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '0.95rem',
    background: '#0a0b10',
    border: '1px solid #232734',
    color: '#e6e6e6',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  labelInput: {
    fontSize: '0.75rem',
    color: '#8a8f9c',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    display: 'block'
  },
  baseButton: {
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  buttonPrimary: {
    background: 'var(--cor-primaria, #d4a91c)',
    color: '#0a0b10',
  },
  buttonOutline: {
    background: 'transparent',
    border: '1px solid #232734',
    color: '#e6e6e6',
  },
  buttonDangerGhost: {
    background: 'transparent',
    border: '1px solid #ff4c4c',
    color: '#ff4c4c',
    padding: '8px 16px',
    fontSize: '0.8rem'
  },
  btnIconDanger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 76, 76, 0.1)',
    border: '1px solid #ff4c4c',
    color: '#ff4c4c',
    borderRadius: '6px',
    padding: '10px',
    cursor: 'pointer',
    transition: '0.2s'
  },
  btnIconDangerGhost: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: '#8a8f9c',
    cursor: 'pointer',
    padding: '6px',
    transition: 'color 0.2s'
  },
  producaoItem: {
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '16px', 
    border: '1px solid #1f2430',
    background: '#0a0b10',
    borderRadius: '8px',
    gap: '16px'
  },
  producaoInput: {
    width: '100px', 
    padding: '10px', 
    borderRadius: '6px', 
    border: '1px solid #232734', 
    background: '#12141b', 
    color: '#fff',
    textAlign: 'center',
    fontSize: '1rem',
    outline: 'none'
  },
  teamList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  teamItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#0a0b10',
    borderRadius: '8px',
    border: '1px solid #1f2430'
  },
  badgeRole: {
    background: 'rgba(212,169,28,0.1)',
    color: '#d4a91c',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '600',
    border: '1px solid rgba(212,169,28,0.2)'
  },
  btnIconDangerGhost: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  color: '#ff4c4c',
  padding: '8px',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: '0.2s',
  opacity: 0.7,
  '&:hover': {
    opacity: 1,
    background: 'rgba(255, 76, 76, 0.1)'
  }
},
keyItem: {
  padding: '12px',
  borderBottom: '1px solid #1f2430',
  // Se for o último item, você pode remover a borda no seu map ou deixar assim
},
  roleSelect: {
    background: '#12141b',
    border: '1px solid #232734',
    color: '#e6e6e6',
    fontSize: '0.85rem',
    padding: '8px 12px',
    borderRadius: '6px',
    width: '100%',
    maxWidth: '220px',
    cursor: 'pointer',
    outline: 'none'
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    background: '#0a0b10',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #1f2430'
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#e6e6e6',
    fontSize: '0.9rem',
    cursor: 'pointer'
  },
  roleListScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '500px',
    overflowY: 'auto'
  },
  roleCard: {
    background: '#0a0b10',
    border: '1px solid #1f2430',
    borderRadius: '8px',
    padding: '16px'
  },
  roleName: {
    fontWeight: '600',
    color: '#d4a91c',
    fontSize: '1rem',
    display: 'block',
    marginBottom: '4px'
  },
  memberCount: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: '#8a8f9c'
  },
  permissionBadgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  permBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.7rem',
    background: '#12141b',
    border: '1px solid #232734',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#8a8f9c'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#8a8f9c',
    fontSize: '0.95rem'
  },
  masterForm: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  masterInput: {
    flex: '2',
    padding: '12px 16px',
    fontSize: '1rem',
    background: '#0a0b10',
    border: '1px solid #232734',
    color: '#fff',
    borderRadius: '8px',
    outline: 'none'
  },
  masterBtn: {
    flex: '1',
    padding: '12px 16px',
    background: '#f1c40f',
    color: '#000',
    fontWeight: '700',
    fontSize: '0.95rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  keyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  keyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0a0b10',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #1f2430'
  },
  modalBody: {
    background: '#0f1117',
    border: '1px solid #1f2430',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
  }
};