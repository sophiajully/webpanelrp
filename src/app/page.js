"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
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
  Scroll,
  UserPlus,
  ChevronRight,
  Store,
  Search,
  History
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
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [keyList, setKeyList] = useState([]);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
const [meuPombo, setMeuPombo] = useState("");
const [loadingPombo, setLoadingPombo] = useState(false);
 const [cartazData, setCartazData] = useState({
  titulo: 'PROCURA-SE',
  subtitulo: 'NEGOCIOS & PROPRIEDADES',
  fazenda: '',
  dono: '',
  pombo: '',
  servicos: 'GADO • CAVALOS • COLHEITA',
  rodape: 'REGISTRADO NO DEPARTAMENTO DE AGRICULTURA',
  selo: 'ORIGINAL',
  data: 'ESTABELECIDO EM 1899'
});
  const [loadingAction, setLoadingAction] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "", canVendas: true, canCraft: true, canLogs: false, canAdmin: false
  });
  const [minhasEmpresas, setMinhasEmpresas] = useState([]);
// Adicione aos seus estados existentes
const [showNovaEmpresaModal, setShowNovaEmpresaModal] = useState(false);
const [novaEmpresaData, setNovaEmpresaData] = useState({ name: "", colorPrimary: "#8b0000" });

const criarNovaEmpresa = async () => {
  if (!novaEmpresaData.name) return alert("Dê um nome para sua nova fazenda!");
  
  setLoadingAction(true);
  try {
    const res = await fetch('/api/companies/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaEmpresaData)
    });

    if (res.ok) {
      const empresaCriada = await res.json();
      alert("✅ Empresa criada com sucesso!");
      setShowNovaEmpresaModal(false);
      
      // Opcional: Já trocar para a empresa nova automaticamente
      await trocarEmpresaAtiva(empresaCriada.id);
    }
  } catch (err) {
    alert("Erro ao criar empresa.");
  } finally {
    setLoadingAction(false);
  }
};
// Função para buscar todas as empresas onde o usuário é Owner
const carregarMinhasEmpresas = useCallback(async () => {
  try {
    const res = await fetch('/api/companies/owner'); // Você precisará criar esta rota
    const data = await res.json();
    if (Array.isArray(data)) setMinhasEmpresas(data);
  } catch (err) {
    console.error("Erro ao carregar empresas:", err);
  }
}, []);
const excluirEmpresa = async (id, nome) => {
  if (!confirm(`Tem certeza que deseja apagar a empresa "${nome}"? Todos os dados serão perdidos.`)) return;

  try {
    const res = await fetch(`/api/companies/delete?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert("Empresa removida.");
      carregarMinhasEmpresas(); // Atualiza a lista da sidebar
    } else {
      const err = await res.json();
      alert(err.error);
    }
  } catch (err) {
    alert("Erro ao excluir.");
  }
};
// Função para trocar a empresa ativa
const trocarEmpresaAtiva = async (novoCompanyId) => {
  setLoadingAction(true);
  try {
    const res = await fetch('/api/users/switch-company', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: novoCompanyId })
    });

    if (res.ok) {
      // 1. Atualiza a sessão local. 
      // O NextAuth chamará o callback 'jwt' e 'session' no seu backend.
      await update({
        ...session,
        user: {
          ...session?.user,
          companyId: novoCompanyId
        }
      });

      // 2. Opcional: Recarregar para garantir que todos os useEffects 
      // que dependem da session.user.companyId sejam disparados com dados limpos.
      window.location.reload();
    } else {
      const erro = await res.json();
      alert(erro.error || "Erro ao trocar de empresa.");
    }
  } catch (err) {
    console.error(err);
    alert("Erro de conexão.");
  } finally {
    setLoadingAction(false);
  }
};

// Disparar a busca quando for Owner
useEffect(() => {
  if (session?.user?.isOwner) {
    carregarMinhasEmpresas();
  }
}, [session?.user?.isOwner, carregarMinhasEmpresas]);

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
const carregarPombo = useCallback(async () => {
    try {
        const res = await fetch("/api/users/pombo");
        const data = await res.json();
        if (data.pombo) setMeuPombo(data.pombo);
    } catch (err) {
        console.error("Erro ao carregar pombo:", err);
    }
}, []);

// Monitora a abertura do modal para carregar os dados
useEffect(() => {
    if (showPerfilModal) carregarPombo();
}, [showPerfilModal, carregarPombo]);

const salvarConfigPombo = async () => {
    setLoadingPombo(true);
    try {
        const res = await fetch("/api/users/pombo", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pombo: meuPombo })
        });
        const data = await res.json();
        
        if (data.error) {
            alert("❌ " + data.error);
        } else {
            alert("✅ Pombo configurado com sucesso!");
            if (update) update(); // Atualiza a sessão do NextAuth
        }
    } catch (err) {
        alert("Erro ao conectar com o servidor.");
    } finally {
        setLoadingPombo(false);
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
  if (status === "authenticated" && session?.user?.companyId) {
    refreshData(); // Esta função deve buscar os dados da empresa atual
  }
}, [status, session?.user?.companyId, refreshData]);
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      if(!session.user.pombo) {
        console.log(session.user)
        setShowPerfilModal(true)
        alert("⚠️ Você precisa configurar seu Pombo para continuar!");
      }
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
      {/* Injeção de CSS para a animação */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{
        ...styles.loaderSpinner,
        width: '40px',
        height: '40px',
        border: '3px solid rgba(212, 169, 28, 0.1)',
        borderTop: '3px solid var(--cor-primaria, #d4a91c)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite', // Aqui a mágica acontece
        marginBottom: '15px'
      }}></div>
      <span style={{ color: '#9ca3af', fontSize: '0.9rem', fontWeight: '500' }}>
        Sincronizando Sistema...
      </span>
    </div>
  );
}

// No seu page.js, logo após o loading spinner...

if (status === "authenticated" && !session?.user?.companyId) {
  return (
    <div style={{...styles.loadingScreen, background: '#0a0a0f', padding: '20px', textAlign: 'center'}}>
      <div style={{ background: '#161625', padding: '40px', borderRadius: '16px', border: '1px solid #2d2d3d', maxWidth: '450px' }}>
        <Shield size={48} color="var(--cor-primaria)" style={{ marginBottom: '20px' }} />
        <h2 style={{ color: '#fff', marginBottom: '10px' }}>Acesso Restrito</h2>
        <p style={{ color: '#9ca3af', marginBottom: '25px', lineHeight: '1.5' }}>
          Você ainda não está vinculado a nenhuma empresa. Para utilizar o painel, você precisa solicitar a entrada em uma equipe.
        </p>
        <button 
          onClick={() => router.push('/empresas')}
          style={{ ...styles.baseButton, ...styles.buttonPrimary, width: '100%' }}
        >
          Procurar Empresas
        </button>
        <button 
          onClick={() => signOut()}
          style={{ background: 'none', border: 'none', color: '#6b7280', marginTop: '20px', cursor: 'pointer' }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}

  return (
    <div style={styles.layoutWrapper}>
      <nav style={styles.sidebar}>
  <div style={styles.sidebarTopSection}>
    
    {/* SELETOR DE EMPRESA (Aparece se tiver mais de uma) */}
   {/* SELETOR DE EMPRESA */}
{/* SELETOR DE EMPRESA */}
{/* SELETOR DE EMPRESA */}
{/* SELETOR DE EMPRESA COMPACTO */}
{session?.user?.isOwner && (
  <div style={{ padding: '0 24px 20px', position: 'relative' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <label style={{ fontSize: '0.6rem', color: '#4b5563', fontWeight: 'bold', textTransform: 'uppercase' }}>
        Propriedade Ativa
      </label>
      <button 
        onClick={() => setShowNovaEmpresaModal(true)}
        style={{ background: 'none', border: 'none', color: 'var(--cor-primaria)', cursor: 'pointer', fontSize: '0.65rem' }}
      >
        + Nova Empresa
      </button>
    </div>

    {/* BOTÃO DO SELETOR (O que aparece parado) */}
    <div 
      onClick={() => setShowCompanySelector(!showCompanySelector)}
      style={{
        background: '#161922',
        border: '1px solid #1c1f26',
        padding: '10px 12px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>
        {session?.user?.companyName || "Selecionar Empresa"}
      </span>
      <ChevronRight size={16} style={{ 
        transform: showCompanySelector ? 'rotate(90deg)' : 'rotate(0deg)', 
        transition: '0.2s',
        color: 'var(--cor-primaria)'
      }} />
    </div>

    {/* LISTA FLUTUANTE (Aparece ao clicar) */}
    {showCompanySelector && (
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '24px',
        right: '24px',
        background: '#1c1f26',
        border: '1px solid #2d2d3d',
        borderRadius: '8px',
        marginTop: '5px',
        zIndex: 100,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {Array.isArray(minhasEmpresas) && minhasEmpresas.map((empresa) => (
          <div 
            key={empresa.id}
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              borderBottom: '1px solid #2d2d3d',
              background: session?.user?.companyId === empresa.id ? 'rgba(212, 169, 28, 0.05)' : 'transparent'
            }}
          >
            <button
              onClick={() => {
                trocarEmpresaAtiva(empresa.id);
                setShowCompanySelector(false);
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                color: session?.user?.companyId === empresa.id ? 'var(--cor-primaria)' : '#9ca3af',
                textAlign: 'left',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: session?.user?.companyId === empresa.id ? 'bold' : 'normal'
              }}
            >
              {empresa.name}
            </button>

            {/* Lixeira discreta na direita */}
            {session?.user?.companyId !== empresa.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  excluirEmpresa(empresa.id, empresa.name);
                }}
                style={{
                  padding: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#4b2a2a',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#4b2a2a'}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

    <div style={styles.sidebarHeader} id="nomeEmpresaDisplay">
      <div style={styles.companyLogo}>
        {(session?.user?.companyName || "SafraLog").charAt(0).toUpperCase()}
      </div>
      {session?.user?.companyName || "SafraLog"}
    </div>
          <div style={styles.navLabel}>PRINCIPAL</div>
          <div style={styles.navMenu}>
            {(session?.user?.isOwner || session?.user?.role?.canVendas) && (
             <div 
              style={{...styles.navItem, ...(activeTab === "tab-vendas" ? styles.navItemActive : {})}} 
              onClick={() => showTab("tab-vendas", "Nova Encomenda")}
            >
              <ShoppingCart size={18} /> Nova Encomenda
            </div>
            )}
            
            <div 
              style={{...styles.navItem, ...(activeTab === "tab-cartaz" ? styles.navItemActive : {})}} 
              onClick={() => showTab("tab-cartaz", "CARTAZ")}
            >
              <ImageIcon size={18} /> Cartaz
            </div>
            
            {(session?.user?.isOwner || session?.user?.role?.canVendas) && (
              <div 
              style={{...styles.navItem, ...(activeTab === "tab-pedidos" ? styles.navItemActive : {})}} 
              onClick={() => showTab("tab-pedidos", "Pedidos")}
            >
              <ClipboardList size={18} /> Histórico de Pedidos
            </div>
            )}

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

            


              <>
                <div style={styles.navLabel}>GESTAO</div>
               <div 
  style={styles.navItem} 
  onClick={() => router.push('/mercadao')}
>
  <Store size={18} /> Mercadão
</div>
                
                {(session?.user?.isOwner || session?.user?.role?.canAdmin) && (
              <div 
                  style={{...styles.navItem, ...(activeTab === "tab-roles" ? styles.navItemActive : {})}} 
                  onClick={() => showTab("tab-roles", "Gerenciar Cargos")}
                >
                  <Shield size={18} /> Gerenciar Cargos
                </div>
            )}
            {(session?.user?.isOwner || session?.user?.role?.canAdmin) && (
              <div 
                  style={{...styles.navItem, ...(activeTab === "tab-equipe" ? styles.navItemActive : {})}} 
                  onClick={() => showTab("tab-equipe", "Gerenciar Equipe")}
                >
                  <Users size={18} /> Gerenciar Equipe
                </div>
            )}
                
              </>
              
            {(session?.user?.isOwner || session?.user?.role?.canLogs) && (
              <div 
              style={{...styles.navItem, ...(activeTab === "tab-logs" ? styles.navItemActive : {})}} 
              onClick={() => showTab("tab-logs", "Logs")}
            >
              <Scroll  size={18} /> Logs
            </div>
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

        <div 
  style={{ ...styles.userInfoBar, cursor: 'pointer' }} // Adicionamos o cursor pointer aqui
  onClick={() => setShowPerfilModal(true)}            // Abre o modal ao clicar
>
  <div style={styles.userDetails}>
    <span style={styles.userName}>{session?.user?.name}</span>
    <span style={styles.userRole}>
      {session?.user?.role?.name || (session?.user?.isOwner ? "Dono" : "Funcionário")}
    </span>
  </div>
  
  <button 
    style={styles.btnLogoutIcon} 
    onClick={(e) => {
      e.stopPropagation(); // IMPORTANTE: Impede que o clique no botão de sair também abra o modal
      signOut();
    }}
  >
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



{/* TAB CARTAZ CUSTOM - LIVE PREVIEW REAL */}
<div id="tab-cartaz" style={{...styles.pageContent, display: activeTab === "tab-cartaz" ? "block" : "none"}}>
  <div style={{...styles.grid2Cols, gap: '24px', alignItems: 'flex-start'}}>
    
    {/* Formulário de Configuração */}
    <div style={{...styles.card, margin: 0}}>
      <div style={styles.cardHeader}>
        <div style={styles.headerIcon}><ImageIcon size={18} /></div>
        <h3 style={{margin: 0, fontSize: '1.1rem'}}>Gerador de Cartaz Real</h3>
      </div>
      
      <div style={{display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0'}}>
        {/* INPUTS IGUAIS AOS ANTERIORES */}
        <div style={styles.inputWrapper}>
          <label style={styles.labelInput}>Título Principal</label>
          <input type="text" style={styles.baseInput} value={cartazData.titulo || ''}
            onChange={(e) => setCartazData({...cartazData, titulo: e.target.value})} />
        </div>

        <div style={styles.inputWrapper}>
          <label style={styles.labelInput}>Subtítulo (Faixa Escura)</label>
          <input type="text" style={styles.baseInput} value={cartazData.subtitulo || ''}
            onChange={(e) => setCartazData({...cartazData, subtitulo: e.target.value})} />
        </div>

        <div style={styles.grid2Cols}>
          <div style={styles.inputWrapper}>
            <label style={styles.labelInput}>Fazenda / Empresa</label>
            <input type="text" style={styles.baseInput} value={cartazData.fazenda || ''}
              onChange={(e) => setCartazData({...cartazData, fazenda: e.target.value})} />
          </div>
          <div style={styles.inputWrapper}>
            <label style={styles.labelInput}>Proprietário</label>
            <input type="text" style={styles.baseInput} value={cartazData.dono || ''}
              onChange={(e) => setCartazData({...cartazData, dono: e.target.value})} />
          </div>
        </div>

        <div style={styles.inputWrapper}>
          <label style={styles.labelInput}>Serviços (Separados por •)</label>
          <input type="text" style={styles.baseInput} value={cartazData.servicos || ''}
            onChange={(e) => setCartazData({...cartazData, servicos: e.target.value})} />
        </div>

        {/* ... (Outros inputs: contato, data, selo, rodape permanecem os mesmos) ... */}

        <button 
          style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '10px', height: '45px', fontWeight: 'bold'}}
          onClick={() => {
            const params = new URLSearchParams({
              titulo: cartazData.titulo || 'PROCURA-SE',
              subtitulo: cartazData.subtitulo || 'NEGOCIOS & PROPRIEDADES',
              fazenda: cartazData.fazenda || 'VALE DO SERENO',
              dono: cartazData.dono || 'ARTHUR MORGAN',
              pombo: cartazData.pombo || 'CORREIO CENTRAL',
              servicos: cartazData.servicos || 'GADO • CAVALOS • COLHEITA',
              rodape: cartazData.rodape || 'REGISTRADO NO DEPARTAMENTO DE AGRICULTURA',
              selo: cartazData.selo || 'ORIGINAL',
              data: cartazData.data || 'EST. 1899'
            });
            window.open(`/api/cartaz?${params.toString()}`, '_blank');
          }}
        >
          BAIXAR EM ALTA RESOLUÇÃO
        </button>
      </div>
    </div>

    {/* Live Preview REAL (Puxando da API) */}
    <div style={{
      ...styles.card, 
      margin: 0, 
      background: '#222', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '750px',
    }}>
      <p style={{color: '#fff', fontSize: '0.8rem', marginBottom: '15px', opacity: 0.6}}>PRÉVIA EM TEMPO REAL</p>
      
      <div style={{
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid #444',
        position: 'relative',
        backgroundColor: '#e6d5b8',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <img 
          src={`/api/cartaz?${new URLSearchParams({
            titulo: cartazData.titulo || 'PROCURA-SE',
            subtitulo: cartazData.subtitulo || 'NEGOCIOS & PROPRIEDADES',
            fazenda: cartazData.fazenda || 'VALE DO SERENO',
            dono: cartazData.dono || 'ARTHUR MORGAN',
            pombo: cartazData.pombo || 'CORREIO CENTRAL',
            servicos: cartazData.servicos || 'GADO • CAVALOS • COLHEITA',
            rodape: cartazData.rodape || 'REGISTRADO NO DEPARTAMENTO DE AGRICULTURA',
            selo: cartazData.selo || 'ORIGINAL',
            data: cartazData.data || 'EST. 1899',
            v: Date.now() // Força o navegador a atualizar a imagem sem cache
          }).toString()}`}
          alt="Preview do Cartaz"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
          // Opcional: Adicionar um loader enquanto a imagem carrega
          onLoad={(e) => e.target.style.opacity = 1}
          onError={(e) => { e.target.src = "https://via.placeholder.com/600x900?text=Erro+ao+Gerar+Preview"; }}
        />
      </div>
      
      <p style={{color: '#aaa', fontSize: '0.7rem', marginTop: '15px', textAlign: 'center'}}>
        A imagem acima é gerada dinamicamente pela sua API.<br/>
        Toda alteração nos campos atualizará a prévia automaticamente.
      </p>
    </div>

  </div>
</div>
{/* MODAL DE PERFIL / POMBO */}
{showPerfilModal && (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
  }}>
    <div style={{
      background: '#161625', width: '90%', maxWidth: '400px',
      borderRadius: '16px', border: '1px solid #2d2d3d', overflow: 'hidden',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
    }}>
      {/* Header do Modal */}
      <div style={{ padding: '20px', background: '#1e1e2f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2d2d3d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={20} color="var(--cor-primaria)" />
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Meu Perfil</h3>
        </div>
        <button onClick={() => setShowPerfilModal(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
          <XCircle size={24} />
        </button>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '25px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--cor-primaria-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', color: 'var(--cor-primaria)', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {session?.user?.name.substring(0, 1).toUpperCase()}
          </div>
          <h4 style={{ margin: 0, color: '#fff' }}>{session?.user?.name}</h4>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>{session?.user?.isOwner ? "Proprietário" : "Colaborador"}</span>
        </div>

        <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>ID DO POMBO</label>
        <input 
          type="text" 
          placeholder="Ex: 123"
          value={meuPombo}
          onChange={(e) => setMeuPombo(e.target.value)}
          style={{ ...styles.roleSelect, width: '100%', padding: '12px', marginBottom: '20px', fontSize: '1rem', textAlign: 'center', letterSpacing: '2px' }}
        />

        <button 
          className="primary" 
          onClick={salvarConfigPombo}
          disabled={loadingPombo}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          {loadingPombo ? "Salvando..." : <><CheckCircle size={18} /> Salvar Alterações</>}
        </button>
      </div>
    </div>
  </div>
)}
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
<div id="tab-logs" style={{...styles.pageContent, display: activeTab === "tab-logs" ? "flex" : "none", flexDirection: 'column', gap: '24px'}}>
  
  {/* CARD DE FILTROS E PESQUISA */}
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <div style={styles.headerIcon}><Search size={18} /></div>
      <h3>Filtros de Auditoria</h3>
    </div>
    <div style={styles.grid2Cols}>
      <div style={styles.inputWrapper}>
        <label style={styles.labelInput}>Pesquisar Ação ou Detalhe</label>
        <input 
          type="text" 
          id="searchLogInput" 
          placeholder="Ex: Venda, Contratação, Erro..." 
          style={styles.baseInput} 
          onInput={(e) => window.app.carregarLogs(1, e.target.value)}
        />
      </div>
      <div style={styles.inputWrapper}>
        <label style={styles.labelInput}>Categoria</label>
        <select 
          id="categoriaLogSelect" 
          style={styles.baseInput}
          onChange={(e) => window.app.carregarLogs(1, document.getElementById('searchLogInput').value)}
        >
          <option value="">Todas as Categorias</option>
          <option value="FINANCEIRO">Financeiro</option>
          <option value="RH">Recursos Humanos</option>
          <option value="LOGISTICA">Logística</option>
          <option value="SISTEMA">Sistema</option>
        </select>
      </div>
    </div>
  </div>

  {/* CARD DA TABELA DE LOGS */}
  <div style={{...styles.card, flex: 1, minHeight: '400px'}}>
    <div style={styles.cardHeader}>
      <div style={styles.headerIcon}><History size={18} /></div>
      <h3>Histórico de Atividades</h3>
    </div>

    <div style={{overflowX: 'auto', marginTop: '20px'}}>
      <table style={{width: '100%', borderCollapse: 'collapse', color: '#fff'}}>
        <thead>
          <tr style={{textAlign: 'left', borderBottom: `1px solid ${styles.divider.backgroundColor || '#1c1c26'}`, color: '#4b5563', fontSize: '0.8rem'}}>
            <th style={{padding: '12px 8px'}}>DATA/HORA</th>
            <th style={{padding: '12px 8px'}}>AÇÃO</th>
            <th style={{padding: '12px 8px'}}>DETALHES</th>
            <th style={{padding: '12px 8px'}}>OPERADOR</th>
          </tr>
        </thead>
        <tbody id="tabelaLogsCorpo">
          {/* Preenchido dinamicamente via JS */}
        </tbody>
      </table>
    </div>

    {/* PAGINAÇÃO ESTILIZADA */}
    <div style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginTop: 'auto', 
      paddingTop: '24px',
      borderTop: `1px solid ${styles.divider.backgroundColor || '#1c1c26'}`
    }}>
      <span id="paginacaoInfo" style={{fontSize: '0.85rem', color: '#4b5563', fontWeight: 'bold'}}>
        Página 1 de 1
      </span>
      
      <div style={{display: 'flex', gap: '12px'}}>
        <button 
          id="btnPrevLog" 
          onClick={() => window.app.mudarPaginaLog(-1)} 
          style={{...styles.baseButton, padding: '8px 16px', fontSize: '0.8rem', opacity: 0.8}}
        >
          Anterior
        </button>
        <button 
          id="btnNextLog" 
          onClick={() => window.app.mudarPaginaLog(1)} 
          style={{...styles.baseButton, ...styles.buttonPrimary, padding: '8px 16px', fontSize: '0.8rem'}}
        >
          Próximo
        </button>
      </div>
    </div>
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

<div id="tab-equipe" style={{...styles.pageContent, display: activeTab === "tab-equipe" ? "block" : "none"}}>
  
  {/* HEADER DA TAB COM BOTÃO DE ADICIONAR */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
    <div>
      <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}>Gerenciamento de Equipe</h2>
      <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '0.85rem' }}>Contrate, gerencie cargos ou desligue colaboradores.</p>
    </div>
    <button 
      onClick={() => window.app.abrirModalContratacao()}
      style={{ 
        background: 'var(--cor-primaria)', 
        color: '#fff', 
        border: 'none', 
        padding: '12px 20px', 
        borderRadius: '8px', 
        fontWeight: '700', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}
    >
      <UserPlus size={18} /> Contratar Funcionário
    </button>
  </div>

  {/* SEÇÃO DE SOLICITAÇÕES PENDENTES (Apenas se houver) */}
  {hireRequests.length > 0 && (
    <div style={{...styles.card, borderLeft: '4px solid var(--cor-destaque)', marginBottom: '30px', background: 'rgba(212,169,28,0.03)'}}>
      <div style={styles.cardHeader}>
        <div style={{...styles.headerIcon, background: 'var(--cor-destaque-bg)', color: 'var(--cor-destaque)'}}><UserPlus size={18} /></div>
        <h3 style={{color: 'var(--cor-destaque)'}}>Solicitações de Ingresso ({hireRequests.length})</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
        {hireRequests.map(req => (
          <div key={req.id} style={{ background: '#161922', padding: '15px', borderRadius: '12px', border: '1px solid #2d2d2d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>{req.user.username}</div>
              <div style={{ color: '#555', fontSize: '0.75rem' }}>Solicitou entrada agora</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ background: '#00ff90', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => gerenciarSolicitacao(req.id, 'approve')}>Aceitar</button>
              <button style={{ background: '#ff4c4c', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#fff' }} onClick={() => gerenciarSolicitacao(req.id, 'reject')}>Recusar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* TABELA DE COLABORADORES ATIVOS */}
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <div style={styles.headerIcon}><Users size={18} /></div>
      <h3>Colaboradores Ativos</h3>
    </div>
    
    <div style={{ overflowX: 'auto', marginTop: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2d2d2d', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <th style={{ padding: '15px' }}>Colaborador</th>
            <th style={{ padding: '15px' }}>Cargo Atual</th>
            <th style={{ padding: '15px' }}>Alterar Cargo</th>
            <th style={{ padding: '15px', textAlign: 'right' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {teamList.map(m => (
            <tr key={m.id} style={{ borderBottom: '1px solid #1c1f26', transition: '0.3s' }}>
              <td style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--cor-primaria-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cor-primaria)', fontWeight: 'bold' }}>
                    {m.username?.substring(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: '600', color: '#fff' }}>{m.username}</span>
                </div>
              </td>
              <td style={{ padding: '15px' }}>
                <span style={{ 
                  background: m.role ? 'rgba(0,255,144,0.1)' : '#2d2d2d', 
                  color: m.role ? '#00ff90' : '#888',
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold',
                  border: m.role ? '1px solid rgba(0,255,144,0.2)' : 'none'
                }}>
                  {m.role?.name || "Sem Cargo"}
                </span>
              </td>
              <td style={{ padding: '15px' }}>
                <select 
                  style={{ ...styles.roleSelect, width: '180px', padding: '6px' }}
                  value={String(m.roleId ?? "")} 
                  onChange={(e) => mudarRoleUsuario(m.id, e.target.value)}
                >
                  <option value="">🚫 Remover Cargo</option>
                  {roleList.map(role => (
                    <option key={role.id} value={String(role.id)}>{role.name}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: '15px', textAlign: 'right' }}>
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
    {/* BOTÃO DE RESETAR SENHA */}
    <button 
      style={{ background: 'none', border: 'none', color: '#f1c40f', cursor: 'pointer', padding: '8px', borderRadius: '6px' }} 
      onClick={() => window.app.resetarSenhaFuncionario(m.id, m.username)}
      title="Resetar Senha"
    >
      <Key size={20} />
    </button>

    {/* BOTÃO DE DELETAR */}
    <button 
      style={{ background: 'none', border: 'none', color: '#ff4c4c', cursor: 'pointer', padding: '8px', borderRadius: '6px' }} 
      onClick={() => removerMembro(m.id)}
      title="Demitir Funcionário"
    >
      <Trash2 size={20} />
    </button>
  </div>
</td>
            </tr>
          ))}
        </tbody>
      </table>
      {teamList.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Nenhum colaborador ativo na empresa.</p>}
    </div>
  </div>

  {/* MODAL DE CONTRATAÇÃO (Adicione isto ao final do return principal do page.js) */}
  <div id="modalContratacao" style={{ 
    display: 'none', 
    position: 'fixed', 
    top: 0, left: 0, 
    width: '100%', height: '100%', 
    background: 'rgba(0,0,0,0.85)', 
    backdropFilter: 'blur(5px)',
    zIndex: 9999, 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
    <div style={{ background: '#161922', padding: '35px', borderRadius: '20px', width: '420px', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <div style={{ background: 'var(--cor-primaria-bg)', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cor-primaria)', margin: '0 auto 15px' }}>
          <UserPlus size={30} />
        </div>
        <h3 style={{ color: '#fff', fontSize: '1.4rem', margin: 0 }}>Contratar Funcionário</h3>
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px' }}>Crie uma nova conta de acesso para sua equipe.</p>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Nome de Usuário (Login)</label>
        <input id="new_func_username" type="text" placeholder="ex: marcos_silva" style={{ width: '100%', background: '#0d0f14', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Cargo Inicial</label>
        <select id="new_func_role" style={{ width: '100%', background: '#0d0f14', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', outline: 'none' }}>
          {roleList.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
      </div>

      <div style={{ background: '#0d0f14', padding: '15px', borderRadius: '10px', border: '1px dashed #333', marginBottom: '25px' }}>
        <label style={{ color: 'var(--cor-primaria)', fontSize: '0.7rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>SENHA GERADA AUTOMATICAMENTE</label>
        <div id="new_func_pass_display" style={{ color: '#fff', fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 'bold' }}>********</div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => document.getElementById('modalContratacao').style.display='none'}
          style={{ flex: 1, background: '#2d2d2d', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Cancelar
        </button>
        <button 
          onClick={() => window.app.executarContratacao()}
          style={{ flex: 2, background: 'var(--cor-primaria)', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Confirmar e Salvar
        </button>
      </div>
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
      {showNovaEmpresaModal && (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
  }}>
    <div style={{ background: '#161625', width: '90%', maxWidth: '400px', borderRadius: '16px', border: '1px solid #2d2d3d', padding: '25px' }}>
      <h3 style={{ color: '#fff', marginBottom: '20px' }}>Nova Propriedade</h3>
      
      <div style={styles.inputWrapper}>
        <label style={styles.labelInput}>Nome da Fazenda/Empresa</label>
        <input 
          type="text" 
          placeholder="Ex: Rancho Rio Doce" 
          style={{...styles.baseInput, width: '100%', marginBottom: '15px'}}
          onChange={(e) => setNovaEmpresaData({...novaEmpresaData, name: e.target.value})}
        />
      </div>

      <div style={styles.inputWrapper}>
        <label style={styles.labelInput}>Cor de Identidade</label>
        <input 
          type="color" 
          style={{...styles.colorPicker, marginBottom: '20px'}}
          value={novaEmpresaData.colorPrimary}
          onChange={(e) => setNovaEmpresaData({...novaEmpresaData, colorPrimary: e.target.value})}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setShowNovaEmpresaModal(false)}
          style={{...styles.baseButton, ...styles.buttonOutline, flex: 1}}
        >
          Cancelar
        </button>
        <button 
          onClick={criarNovaEmpresa}
          disabled={loadingAction}
          style={{...styles.baseButton, ...styles.buttonPrimary, flex: 2}}
        >
          {loadingAction ? "Criando..." : "Fundar Empresa"}
        </button>
      </div>
    </div>
  </div>
)}
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
    color: 'var(--cor-primaria, #d4a91c)',
    gap: '20px'
  },
  loaderSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    borderTop: '3px solid var(--cor-primaria, #d4a91c)',
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
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
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
    display: 'flex',
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
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
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
    padding: '5px 15px',
    borderRadius: '5px',
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
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
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
    color: 'var(--cor-primaria, #d4a91c)',
    fontSize: '1rem',
    letterSpacing: '2px',
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
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