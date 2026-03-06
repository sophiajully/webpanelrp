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
  UserPlus,
  ChevronRight
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
    const novosDados = await window.app.salvarConfig(session?.user?.companyId);

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
        const corPrimaria = session?.user?.colorPrimary || "#d4a91c";
        const corDestaque = session?.user?.colorAccent || "#f1c40f";

        const root = document.documentElement;
        root.style.setProperty('--cor-primaria', corPrimaria);
        root.style.setProperty('--cor-destaque', corDestaque);
        root.style.setProperty('--cor-primaria-bg', `${corPrimaria}1A`); 
        root.style.setProperty('--cor-destaque-bg', `${corDestaque}1A`);
      }
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

      const root = document.documentElement;
      root.style.setProperty('--cor-primaria', corPrimaria);
      root.style.setProperty('--cor-destaque', corDestaque);
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
        <div style={styles.loaderSpinner}></div>
        <span>Sincronizando Sistema...</span>
      </div>
    );
  }

  return (
    <div style={styles.layoutWrapper}>
      <nav style={styles.sidebar}>
        <div style={styles.sidebarTopSection}>
          <div style={styles.sidebarHeader} id="nomeEmpresaDisplay">
  <div style={styles.companyLogo}>
    {(session?.user?.companyName || "SafraLog").charAt(0).toUpperCase()}
  </div>
  {session?.user?.companyName || "SafraLog"}
</div>
          <div style={styles.navLabel}>PRINCIPAL</div>
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
              <ClipboardList size={18} /> Histórico de Pedidos
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
                <div style={styles.navLabel}>GESTAO</div>
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
                <div style={styles.navLabel}>ADMINISTRAÇÃO</div>
                <div 
                  style={{...styles.navItemMaster, ...(activeTab === "tab-master" ? styles.navItemMasterActive : {})}} 
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
            <span style={styles.userName}>{session?.user?.name}</span>
            <span style={styles.userRole}>
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
          <div>
            <span style={styles.breadcrumb}>Dashboard / {activeTab.replace("tab-", "")}</span>
            <h2 id="page-title" style={styles.pageTitle}>Nova Encomenda</h2>
          </div>
          <button style={styles.btnSettings} onClick={() => window.toggleModal(true)}>
            <Settings size={20} />
          </button>
        </header>

        {/* Tab Vendas */}
        <div id="tab-vendas" style={{...styles.pageContent, display: activeTab === "tab-vendas" ? "flex" : "none"}}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.headerIcon}><ShoppingCart size={18} /></div>
              <h3>Dados da Encomenda</h3>
            </div>
            <div style={styles.grid2Cols}>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Cliente</label>
                <input type="text" id="clienteNome" placeholder="Nome Completo" style={styles.baseInput} />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Contato</label>
                <input type="text" id="clientePombo" placeholder="ID/Telefone/Pombo" style={styles.baseInput} />
              </div>
            </div>
            
            <div style={{...styles.divider, margin: '32px 0'}} />

            <div style={styles.cardHeader}>
              <div style={styles.headerIcon}><Beef size={18} /></div>
              <h3>Seleção de Produtos</h3>
            </div>
            <div style={styles.grid2Cols}>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Produto</label>
                <select id="produtoSelect" style={styles.baseInput}></select>
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Quantidade</label>
                <input type="number" id="quantidadeItem" placeholder="0" style={styles.baseInput} />
              </div>
            </div>
            <button style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '24px'}} onClick={() => window.app.adicionarItem()}>
              Adicionar à Lista
            </button>
          </div>

          <div style={{...styles.card, borderTop: '4px solid var(--cor-primaria)'}}>
            <div style={styles.cardHeader}>
              <div style={styles.headerIcon}><ClipboardList size={18} /></div>
              <h3>Resumo do Pedido</h3>
            </div>
            <div id="listaEncomenda" style={styles.orderListContainer}></div>
            <button onClick={() => window.app.calcularEncomenda()} style={{...styles.baseButton, ...styles.buttonOutline, width: '100%'}}>
              Finalizar e Gerar Recibo
            </button>
          </div>
        </div>

        {/* Tab Pedidos */}
        <div id="tab-pedidos" style={{...styles.pageContent, display: activeTab === "tab-pedidos" ? "block" : "none"}}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.headerIcon}><ClipboardList size={18} /></div>
              <h3>Últimas Movimentações</h3>
            </div>
            <div id="listaPedidosGeral" style={styles.emptyState}>Carregando registros...</div>
          </div>
        </div>

        {/* Tab Registrar Craft */}
        <div id="tab-registrar" style={{...styles.pageContent, display: activeTab === "tab-registrar" ? "block" : "none"}}>
          <div style={{...styles.card, maxWidth: '800px'}}>
            <div style={styles.cardHeader}>
              <div style={styles.headerIcon}><Hammer size={18} /></div>
              <h3>Configuração de Receita</h3>
            </div>
            <div style={styles.grid3Cols}>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Nome do Produto</label>
                <input type="text" id="craftNome" placeholder="Ex: Carne de Sol" style={styles.baseInput} />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Qtd. Produzida</label>
                <input type="number" id="unidades" placeholder="1" style={styles.baseInput} />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Preço Final</label>
                <input type="number" id="price" placeholder="$ 0.00" style={styles.baseInput} />
              </div>
            </div>

            <div style={styles.insumosSection}>
              <h4 style={styles.sectionTitle}>Insumos Necessários</h4>
              <div id="listaInsumosDinamicos" style={styles.dynamicList}></div>
              <button style={{...styles.baseButton, ...styles.buttonOutline, fontSize: '0.8rem'}} onClick={() => window.app.adicionarCampoInsumo()}>
                + Novo Insumo
              </button>
            </div>

            <button style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '32px', width: '100%'}} onClick={() => {
              window.app.registrarCraft();
              refreshData();
            }}>
              Registrar no Catálogo
            </button>
          </div>
        </div>

        {/* Tab Painel de Produção */}
        <div id="tab-producao" style={{...styles.pageContent, display: activeTab === "tab-producao" ? "block" : "none"}}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.headerIcon}><Calculator size={18} /></div>
              <h3>Planejamento de Produção</h3>
            </div>
            <p style={styles.cardSubtitle}>Defina as quantidades para calcular os materiais necessários automaticamente.</p>
            
            <div style={styles.producaoGrid}>
              {craftList.map((item) => (
                <div key={item.id} style={styles.producaoItem}>
                  <div style={{flex: 1}}>
                    <div style={styles.producaoItemTitle}>{item.name}</div>
                    <div style={styles.producaoItemMeta}>Unidade base: {item.unit || 'un'}</div>
                  </div>
                  
                  <input 
                    type="number" 
                    placeholder="0"
                    value={producaoQtds[item.id] || ""} 
                    onChange={(e) => handleQtdChange(item.id, e.target.value)}
                    style={styles.producaoInput} 
                  />

                  <button onClick={() => window.app.removerReceita(item.id)} style={styles.btnActionDelete}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button 
              style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '24px', width: '100%'}} 
              onClick={() => window.app.calcularMateriais(craftList, producaoQtds)}
            >
              <Calculator size={18} /> Calcular Totais de Coleta
            </button>
          </div>

          <div id="materiaisResultado" style={styles.resultCard}>
            <div style={styles.cardHeader}>
              <div style={{...styles.headerIcon, background: 'rgba(0,255,144,0.1)', color: '#00ff90'}}><Package size={18} /></div>
              <h3 style={{color: '#00ff90'}}>Lista de Materiais</h3>
            </div>
            <div id="listaInsumosSomados" style={styles.resultList}></div>
          </div>
        </div>

        {/* Tab Equipe */}
        <div id="tab-equipe" style={{...styles.pageContent, display: activeTab === "tab-equipe" ? "block" : "none"}}>
          {hireRequests.length > 0 && (
            <div style={{...styles.card, border: '1px solid var(--cor-destaque-bg)'}}>
              <div style={styles.cardHeader}>
                <div style={{...styles.headerIcon, background: 'var(--cor-destaque-bg)', color: 'var(--cor-destaque)'}}><UserPlus size={18} /></div>
                <h3 style={{color: 'var(--cor-destaque)'}}>Solicitações Pendentes</h3>
              </div>
              <div style={styles.teamList}>
                {hireRequests.map(req => (
                  <div key={req.id} style={styles.teamItem}>
                    <div style={{flex: 1}}>
                      <div style={styles.memberName}>{req.user.username}</div>
                      <div style={styles.memberMeta}>Deseja ingressar na empresa</div>
                    </div>
                    <div style={styles.actionGroup}>
                      <button style={styles.btnApprove} onClick={() => gerenciarSolicitacao(req.id, 'approve')}>Aprovar</button>
                      <button style={styles.btnReject} onClick={() => gerenciarSolicitacao(req.id, 'reject')}>Rejeitar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.headerIcon}><Users size={18} /></div>
              <h3>Colaboradores Ativos</h3>
            </div>
            <div style={styles.teamList}>
              {teamList.map(m => (
                <div key={m.id} style={styles.teamItem}>
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <span style={styles.memberName}>{m.name}</span>
                      <span style={styles.badgeRole}>{m.role?.name || "Sem Cargo"}</span>
                    </div>
                    <div style={{marginTop: '12px'}}>
                      <select 
                        style={styles.roleSelect}
                        value={String(m.roleId ?? "")} 
                        onChange={(e) => mudarRoleUsuario(m.id, e.target.value)}
                      >
                        <option value="">🚫 Remover Cargo</option>
                        {roleList.map(role => (
                          <option key={role.id} value={String(role.id)}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button style={styles.btnActionDelete} onClick={() => removerMembro(m.id)} disabled={loadingAction}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Roles */}
        <div id="tab-roles" style={{...styles.pageContent, display: activeTab === "tab-roles" ? "flex" : "none"}}>
          <div style={styles.grid2Cols}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.headerIcon}><Shield size={18} /></div>
                <h3>Criar Novo Cargo</h3>
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Identificação do Cargo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Supervisor" 
                  style={styles.baseInput}
                  value={newRole.name} 
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} 
                />
              </div>

              <label style={{...styles.labelInput, marginTop: '24px'}}>Permissões de Módulo</label>
              <div style={styles.checkboxGrid}>
                {['canVendas', 'canCraft', 'canLogs', 'canAdmin'].map((perm) => (
                   <label key={perm} style={styles.checkLabel}>
                    <input 
                      type="checkbox" 
                      checked={newRole[perm]} 
                      onChange={(e) => setNewRole({ ...newRole, [perm]: e.target.checked })} 
                    />
                    <span>{perm.replace('can', '')}</span>
                  </label>
                ))}
              </div>

              <button style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '24px', width: '100%'}} onClick={criarRole} disabled={loadingAction}>
                {loadingAction ? "Salvando..." : "Cadastrar Cargo"}
              </button>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.headerIcon}><ClipboardList size={18} /></div>
                <h3>Cargos e Hierarquia</h3>
              </div>
              <div style={styles.roleContainer}>
                {roleList.map((role) => (
                  <div key={role.id} style={styles.roleCard}>
                    <div style={styles.roleCardTop}>
                      <span style={styles.roleTitle}><span style={{
                        color: 'var(--cor-primaria, #d4a91c)'
                      }}>Role Name:</span> {role.name}</span>
                      <button onClick={() => window.app.excluirRole(role.id, role.name)} style={styles.btnActionDelete}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={styles.permList}>
                      {role.canVendas && <span style={styles.tinyBadge}>Vendas</span>}
                      {role.canCraft && <span style={styles.tinyBadge}>Produção</span>}
                      {role.canAdmin && <span style={{...styles.tinyBadge, borderColor: '#ff4c4c', border: 'solid 1px #ff4c4c', color: '#ff4c4c'}}>Admin</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Admin Master */}
        {session?.user?.name === "admin" && (
          <div id="tab-master" style={{...styles.pageContent, display: activeTab === "tab-master" ? "block" : "none"}}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{...styles.headerIcon, background: 'var(--cor-destaque-bg)', color: 'var(--cor-destaque)'}}><Key size={18} /></div>
                <h3>Gerador de Licenças</h3>
              </div>
              <div style={styles.masterActionRow}>
                <div style={{flex: 1}}>
                  <label style={styles.labelInput}>Validade (Dias)</label>
                  <input 
                    type="number" 
                    value={newKeyDays} 
                    onChange={(e) => setNewKeyDays(e.target.value)}
                    style={styles.baseInput}
                  />
                </div>
                <button style={{...styles.btnMaster, ...styles.baseButton}} onClick={gerarNovaKey} disabled={loadingKey}>
                  Gerar Access Key
                </button>
              </div>
            </div>

            <div style={{...styles.card, marginTop: '24px'}}>
               <div style={styles.cardHeader}>
                <div style={styles.headerIcon}><ClipboardList size={18} /></div>
                <h3>Keys no Banco</h3>
              </div>
              <div style={styles.keyList}>
                {keyList.map((k) => (
                  <div key={k.id} style={styles.keyItem}>
                    <code style={styles.keyCode}>{k.key}</code>
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <span style={{...styles.statusBadge, color: k.used ? '#ff4c4c' : '#00ff90'}}>
                        {k.used ? "USADA" : `${k.days} DIAS`}
                      </span>
                      <button onClick={() => excluirKey(k.id)} style={styles.btnActionDelete}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Settings */}
      <div className="modal-overlay" id="modalSettings" style={{ display: 'none' }}>
        <div style={styles.modalBody}>
          <div style={styles.cardHeader}>
            <div style={styles.headerIcon}><Settings size={18} /></div>
            <h3>Preferências do Sistema</h3>
          </div>
          
          <div style={styles.modalForm}>
            <div style={styles.inputWrapper}>
              <label style={styles.labelInput}>Nome da Empresa</label>
              <input type="text" id="nomeEmpresaInput" style={styles.baseInput} disabled={session?.user.isOwner !== true} />
            </div>
            
            <div style={styles.inputWrapper}>
              <label style={styles.labelInput}>Webhook Encomendas</label>
              <input type="text" id="webhookVendasInput" style={styles.baseInput} disabled={session?.user.isOwner !== true} />
            </div>
            <div>
              <label style={styles.labelInput}>Webhook Logs:</label>
              <input type="text" id="webhookLogsInput" placeholder="URL para registros internos" style={styles.baseInput} disabled={session?.user.isOwner !== true} />
            </div>

            <div style={styles.grid2Cols}>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Cor Principal</label>
                <input type="color" id="colorPrimary" defaultValue={session?.user?.colorPrimary || "#d4a91c"} style={styles.colorPicker} disabled={session?.user.isOwner !== true} />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Cor Accent</label>
                <input type="color" id="colorAccent" style={styles.colorPicker} disabled={session?.user.isOwner !== true} />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={{...styles.baseButton, ...styles.buttonPrimary, flex: 1}} onClick={handleSalvarConfig} disabled={session?.user.isOwner !== true}>
                Salvar Alterações
              </button>
              <button style={{...styles.baseButton, ...styles.buttonOutline, flex: 1}} onClick={() => toggleModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // CONFIGURAÇÃO BASE
  layoutWrapper: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#07080a',
    color: '#d1d5db',
    fontFamily: '"Inter", sans-serif',
    overflow: 'hidden'
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#07080a',
    color: '#d4a91c',
    gap: '20px'
  },
  loaderSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(212,169,28,0.1)',
    borderTop: '3px solid #d4a91c',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // SIDEBAR
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '280px',
    background: '#0d0f14',
    borderRight: '1px solid #1c1f26',
    padding: '24px 0'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 24px 32px',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.02em'
  },
  companyLogo: {
    width: '32px',
    height: '32px',
    background: 'var(--cor-primaria, #d4a91c)',
    color: '#000',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900'
  },
  navLabel: {
    padding: '0 24px 12px',
    fontSize: '0.65rem',
    color: '#4b5563',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
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
    padding: '10px 16px',
    borderRadius: '10px',
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  navItemActive: {
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
    fontWeight: '600',
    boxShadow: 'inset 0 0 0 1px var(--cor-primaria-bg)'
  },
  navItemMaster: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: '10px',
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  navItemMasterActive: {
    background: 'rgba(241, 196, 15, 0.1)',
    color: '#f1c40f',
    fontWeight: '600'
  },

  // USER BAR
  userInfoBar: {
    margin: '0 12px',
    padding: '16px',
    background: '#161922',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #1c1f26'
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column'
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#fff'
  },
  userRole: {
    fontSize: '0.7rem',
    color: 'var(--cor-primaria, #d4a91c)',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  btnLogoutIcon: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: 'none',
    color: '#ef4444',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: '0.2s'
  },

  // MAIN CONTENT
  mainContent: {
    flex: 1,
    padding: '40px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  breadcrumb: {
    fontSize: '0.75rem',
    color: '#4b5563',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#fff',
    marginTop: '4px'
  },
  btnSettings: {
    background: '#161922',
    border: '1px solid #1c1f26',
    color: '#9ca3af',
    padding: '10px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  // CARDS & COMPONENTS
  pageContent: {
    flexDirection: 'column',
    gap: '24px'
  },
  card: {
    background: '#0d0f14',
    border: '1px solid #1c1f26',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px'
  },
  headerIcon: {
    width: '36px',
    height: '36px',
    background: 'var(--cor-primaria-bg)',
    color: 'var(--cor-primaria)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  grid2Cols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  grid3Cols: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '20px'
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  baseInput: {
    background: '#161922',
    border: '1px solid #1c1f26',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    '&:focus': {
        borderColor: 'var(--cor-primaria)'
    }
  },
  labelInput: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  baseButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  },
  buttonPrimary: {
    background: 'var(--cor-primaria, #d4a91c)',
    color: '#000'
  },
  permList: {
    gap: '10px',
    display: 'flex',

  },
  tinyBadge: {
    background: '#252525',
    padding: '5px',
    borderRadius: '5px',
    paddingLeft: '15px',
    paddingRight: '15px',

  },

  btnMaster: {
    background: 'var(--cor-primaria, #d4a91c)',
    color: '#000'
  },
  buttonOutline: {
    background: 'transparent',
    border: '1px solid #1c1f26',
    color: '#9ca3af'
  },
  divider: {
    height: '1px',
    background: '#1c1f26',
    width: '100%'
  },

  // ESPECIFICOS PRODUCAO
  producaoGrid: {
    display: 'grid',
    gap: '12px'
  },
  producaoItem: {
    background: '#161922',
    padding: '16px 20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    border: '1px solid #1c1f26'
  },
  producaoItemTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '0.95rem'
  },
  producaoItemMeta: {
    color: '#6b7280',
    fontSize: '0.75rem',
    marginTop: '2px'
  },
  producaoInput: {
    width: '80px',
    background: '#0d0f14',
    border: '1px solid #1c1f26',
    borderRadius: '8px',
    padding: '8px',
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700'
  },
  btnActionDelete: {
    background: 'transparent',
    color: '#4b5563',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: '0.2s',
    '&:hover': {
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.1)'
    }
  },

  // EQUIPE E CARGOS
  teamList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  teamItem: {
    background: '#161922',
    padding: '20px',
    borderRadius: '14px',
    border: '1px solid #1c1f26',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  memberName: { color: '#fff', fontWeight: '600' },
  badgeRole: {
    background: 'var(--cor-primaria-bg)',
    color: 'var(--cor-primaria)',
    fontSize: '0.65rem',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '20px',
    textTransform: 'uppercase'
  },
  roleSelect: {
    background: '#0d0f14',
    border: '1px solid #1c1f26',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  checkboxGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, max-content)',
  gap: '10px 40px',
  marginTop: '12px'
},
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    color: '#9ca3af',
    cursor: 'pointer'
  },
  
  // ADMIN
  keyCode: {
    fontFamily: 'monospace',
    color: '#f1c40f',
    fontSize: '1rem',
    letterSpacing: '2px',
    background: 'rgba(241, 196, 15, 0.05)',
    padding: '8px 16px',
    borderRadius: '8px'
  },
  keyItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #1c1f26'
  },

  // MODAL
  modalBody: {
    background: '#0d0f14',
    width: '90%',
    maxWidth: '500px',
    borderRadius: '24px',
    padding: '40px',
    border: '1px solid #1c1f26',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  },
  colorPicker: {
    width: '100%',
    height: '44px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  }
};