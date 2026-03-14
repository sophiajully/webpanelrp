import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getAppData, submitServerAction } from "@/app/actions/appActions";

export function useAppData() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  

  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState("tab-dashboard");
  const [producaoQtds, setProducaoQtds] = useState({});
  const [newKeyDays, setNewKeyDays] = useState(30);
  const [loadingKey, setLoadingKey] = useState(false);
  const [craftList, setCraftList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loadingPombo, setLoadingPombo] = useState(false);
  const [isModalConfigOpen, setIsModalConfigOpen] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [keyList, setKeyList] = useState([]);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [meuPombo, setMeuPombo] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "", canVendas: true, canCraft: true, canLogs: false, canAdmin: false
  });
  const [minhasEmpresas, setMinhasEmpresas] = useState([]);
  const [showNovaEmpresaModal, setShowNovaEmpresaModal] = useState(false);
  const [novaEmpresaData, setNovaEmpresaData] = useState({ name: "", colorPrimary: "#8b0000" });
  const [isMobile, setIsMobile] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [newNotice, setNewNotice] = useState({ title: "", content: "", priority: false });
  const [isModalReceitaOpen, setIsModalReceitaOpen] = useState(false);
  const [isModalVendaOpen, setIsModalVendaOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hireRequests, setHireRequests] = useState([]);

  // --- FUNÇÕES DE CARREGAMENTO (FETCH) ---

  const carregarRoles = useCallback(async () => {
    const data = await getAppData('roles');
    if (Array.isArray(data)) setRoleList(data);
  }, []);

  const carregarEquipe = useCallback(async () => {
    const data = await getAppData('equipe');
    if (Array.isArray(data)) setTeamList(data);
  }, []);

  const carregarKeys = useCallback(async () => {
    const res = await fetch('/api/keys');
    const data = await res.json();
    if (Array.isArray(data)) setKeyList(data);
  }, []);

  const carregarMinhasEmpresas = useCallback(async () => {
    try {
      const res = await fetch('/api/companies/owner'); 
      const data = await res.json();
      if (Array.isArray(data)) setMinhasEmpresas(data);
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (Array.isArray(data)) setAnnouncements(data);
    } catch (error) {
      setAnnouncements([]);
    }
  }, []);

  const carregarPombo = useCallback(async () => {
    try {
      const res = await fetch("/api/users/pombo");
      const data = await res.json();
      if (data.pombo) setMeuPombo(data.pombo);
    } catch (err) {
      console.error("Erro ao carregar pombo:", err);
    }
  }, []);

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

  const carregarSolicitacoes = async () => {
    const res = await fetch('/api/hire-requests');
    const data = await res.json();
    if (Array.isArray(data)) setHireRequests(data);
  };

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

  // --- AÇÕES ---

 const criarNovaEmpresa = async () => {
    if (!novaEmpresaData.name) return alert("Dê um nome para sua nova fazenda!");
    setLoadingAction(true);
    
    // Chamada 'use server'
    const res = await submitServerAction('companies/create', 'POST', novaEmpresaData);
    
    if (res && !res.error) {
      alert("✅ Empresa criada com sucesso!");
      setShowNovaEmpresaModal(false);
      await trocarEmpresaAtiva(res.id);
    } else {
      alert(res.error || "Erro ao criar empresa.");
    }
    setLoadingAction(false);
  };
  const trocarEmpresaAtiva = async (novoCompanyId) => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/users/switch-company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: novoCompanyId })
      });
      if (res.ok) {
        await update({
          ...session,
          user: { ...session?.user, companyId: novoCompanyId }
        });
        window.location.reload();
      } else {
        const erro = await res.json();
        alert(erro.error || "Erro ao trocar de empresa.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setLoadingAction(false);
    }
  };

  const excluirEmpresa = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja apagar a empresa "${nome}"? Todos os dados serão perdidos.`)) return;
    try {
      const res = await fetch(`/api/companies/delete?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Empresa removida.");
        carregarMinhasEmpresas(); 
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      alert("Erro ao excluir.");
    }
  };

  const handleSalvarConfig = async () => {
    setIsModalConfigOpen(false);
    const novosDados = await window.app?.salvarConfig(session?.user?.companyId);
    
    if (novosDados && update) {
      await update({
        ...session,
        user: {
          ...session.user,
          colorPrimary: novosDados.colorPrimary,
          colorAccent: novosDados.colorAccent,
          companyName: novosDados.name,
          enableHireRequest: novosDados.enableHireRequest,
          enableMarket: novosDados.enableMarket
        }
      });
      if (status === "authenticated") {
        const root = document.documentElement;
        root.style.setProperty('--cor-primaria', novosDados.colorPrimary || "#d4a91c");
        root.style.setProperty('--cor-destaque', novosDados.colorAccent || "#f1c40f");
      }
    }
  };

  const salvarConfigPombo = async () => {
    setLoadingPombo(true);
    const res = await submitServerAction('users/pombo', 'PATCH', { pombo: meuPombo });
    
    if (res.error) alert("❌ " + res.error);
    else {
      alert("✅ Pombo configurado com sucesso!");
      if (update) await update(); 
    }
    setLoadingPombo(false);
  };

  const handlePostNotice = async () => {
    if (!newNotice.title || !newNotice.content) return;
    await fetch('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(newNotice)
    });
    setNewNotice({ title: "", content: "", priority: false });
    fetchAnnouncements();
  };

  const handleDeleteNotice = async (id) => {
    await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
    fetchAnnouncements();
  };

  const handleQtdChange = (id, valor) => {
    setProducaoQtds(prev => ({ ...prev, [id]: valor }));
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
      if (res.ok) setKeyList(prev => prev.filter(k => k.id !== id));
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setLoadingAction(false);
    }
  };

  const mudarRoleUsuario = async (userId, roleId) => {
    const novoRoleId = roleId === "" ? null : roleId;
    setTeamList(prev => prev.map(m => {
      if (m.id === userId) {
        const dadosCargo = roleList.find(r => String(r.id) === String(roleId));
        return { ...m, roleId: novoRoleId, role: dadosCargo ? { name: dadosCargo.name } : null };
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
      if (res.ok) setTeamList(prev => prev.filter(m => m.id !== id));
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

  // --- EFEITOS (useEffect) ---
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeTab === "tab-avisos") fetchAnnouncements();
    if (activeTab === "tab-roles") carregarRoles();
    window.carregarRoles = carregarRoles; // Legado para scripts externos
  }, [activeTab, fetchAnnouncements, carregarRoles]);

  useEffect(() => {
    if (showPerfilModal) carregarPombo();
  }, [showPerfilModal, carregarPombo]);

  useEffect(() => {
    if (session?.user?.isOwner) carregarMinhasEmpresas();
  }, [session?.user?.isOwner, carregarMinhasEmpresas]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.companyId) refreshData();
  }, [status, session?.user?.companyId, refreshData]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
    window.serverActions = {
      apiFetch: async (endpoint, method, body) => {
        return await submitServerAction(endpoint, method, body);
      }
    };

      if(!session?.user?.pombo) {
        setShowPerfilModal(true);
      }
      document.body.setAttribute("data-company-id", session?.user?.companyId || "");
      const script = document.createElement("script");
      script.src = "./scripts.js";
      script.async = true;
      script.onload = () => { if (window.app) window.app.init(); };
      document.body.appendChild(script);
    }
  }, [status, session, router]);

  // Retorna tudo encapsulado
  return {
    states: {
      session, status, router, activeTab, producaoQtds, newKeyDays, loadingKey,
      craftList, teamList, roleList, isSidebarOpen, loadingPombo,
      isModalConfigOpen, showCompanySelector, keyList, showPerfilModal,
      meuPombo, loadingAction, newRole, minhasEmpresas, showNovaEmpresaModal,
      novaEmpresaData, isMobile, announcements, newNotice, isModalReceitaOpen,
      isModalVendaOpen, copied, hireRequests
    },
    actions: {
      setActiveTab, setIsSidebarOpen, setNovaEmpresaData, setShowNovaEmpresaModal,
      setNewRole, setIsModalConfigOpen, setShowPerfilModal, setMeuPombo,
      setNewNotice, setNewKeyDays, setShowCompanySelector, handleQtdChange,
      criarNovaEmpresa, trocarEmpresaAtiva, excluirEmpresa, criarRole, salvarConfigPombo,
      gerarNovaKey, excluirKey, removerMembro, mudarRoleUsuario,
      handleSalvarConfig, handlePostNotice, handleDeleteNotice, gerenciarSolicitacao,
      setIsModalVendaOpen,
      setIsModalReceitaOpen,
      refreshData, signOut,
    }
  };
}