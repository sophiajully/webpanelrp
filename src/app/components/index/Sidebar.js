import React from 'react';
import { 
  Bell, MessageSquare, ShoppingCart, Hammer, Store, 
  Shield, Users, Scroll, Key, LogOut, ChevronRight, Trash2, CircleDollarSign,
  ChartArea, Toolbox
} from "lucide-react";

export default function Sidebar({ states, actions, styles }) {
  const { 
    session, 
    activeTab, 
    isSidebarOpen, 
    isMobile, 
    showCompanySelector, 
    minhasEmpresas 
  } = states;

  const { 
    setActiveTab, 
    setIsSidebarOpen, 
    setShowCompanySelector, 
    setShowNovaEmpresaModal, 
    trocarEmpresaAtiva, 
    excluirEmpresa, 
    setShowPerfilModal, 
    signOut 
  } = actions;

  // Função auxiliar para mudar de aba e fechar sidebar no mobile
  const handleTabClick = (tabId, title) => {
    setActiveTab(tabId);
    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.innerText = title;
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <nav style={{
      ...styles.sidebar,
      position: isMobile ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      height: '100vh',
      width: '280px',
      zIndex: 150,
      transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#0d0f14',
      borderRight: '1px solid #1c1f26',
      paddingTop: '10px',
      paddingBottom: '10px'
    }}>

      {/* PARTE SUPERIOR: MENU COM SCROLL */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        paddingTop: isMobile ? '60px' : '0'
      }}>
        
        {/* SEÇÃO DE EMPRESA (Apenas Owners) */}
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
                cursor: 'pointer'
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

            {/* Dropdown de Empresas */}
            {showCompanySelector && (
              <div style={{
                position: 'absolute', top: '100%', left: '24px', right: '24px',
                background: '#1c1f26', border: '1px solid #2d2d3d', borderRadius: '8px',
                marginTop: '5px', zIndex: 100, maxHeight: '200px', overflowY: 'auto'
              }}>
                {Array.isArray(minhasEmpresas) && minhasEmpresas.map((empresa) => (
                  <div key={empresa.id} style={{ 
                    display: 'flex', alignItems: 'center', borderBottom: '1px solid #2d2d3d',
                    background: session?.user?.companyId === empresa.id ? 'rgba(212, 169, 28, 0.05)' : 'transparent'
                  }}>
                    <button
                      onClick={() => { trocarEmpresaAtiva(empresa.id); setShowCompanySelector(false); }}
                      style={{ 
                        flex: 1, padding: '12px', background: 'none', border: 'none', 
                        color: session?.user?.companyId === empresa.id ? 'var(--cor-primaria)' : '#9ca3af', 
                        textAlign: 'left', fontSize: '0.8rem', cursor: 'pointer'
                      }}
                    >
                      {empresa.name}
                    </button>
                    {session?.user?.companyId !== empresa.id && (
                      <button
                        onClick={() => excluirEmpresa(empresa.id, empresa.name)}
                        style={{ padding: '0 12px', background: 'none', border: 'none', color: '#4b2a2a', cursor: 'pointer' }}
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

        <div style={styles.navLabel}>PRINCIPAL</div>
        <div style={styles.navMenu}>
          <NavItem active={activeTab === "tab-avisos"} icon={<Bell size={18}/>} label="Avisos" onClick={() => handleTabClick("tab-avisos", "Avisos")} styles={styles} />
          <NavItem active={activeTab === "tab-dashboard"} icon={<ChartArea size={18}/>} label="Dashboard" onClick={() => handleTabClick("tab-dashboard", "Dashboard")} styles={styles} />
          <NavItem active={activeTab === "tab-ferramentas"} icon={<Toolbox size={18}/>} label="Ferramentas" onClick={() => handleTabClick("tab-ferramentas", "Dashboard")} styles={styles} />
          
          <NavItem active={activeTab === "tab-chat"} icon={<MessageSquare size={18}/>} label="Chat Interno" onClick={() => handleTabClick("tab-chat", "Chat da Fazenda")} styles={styles} />

          {(session?.user?.isOwner || session?.user?.role?.canVendas) && (
            <NavItem active={activeTab === "tab-vendas"} icon={<ShoppingCart size={18}/>} label="Pedidos" onClick={() => handleTabClick("tab-vendas", "Nova Encomenda")} styles={styles} />
          )}

          {(session?.user?.isOwner || session?.user?.role?.canCraft) && (
            <NavItem active={activeTab === "tab-registrar"} icon={<Hammer size={18}/>} label="Craft" onClick={() => handleTabClick("tab-registrar", "Registrar Craft")} styles={styles} />
          )}

          <div style={styles.navLabel}>GESTÃO</div>
          <NavItem active={activeTab === "tab-pagamentos"} icon={<CircleDollarSign size={18}/>} label="Pagamentos" onClick={() => handleTabClick("tab-pagamentos", "Pagamentos")} styles={styles} />
          
          {(session?.user?.isOwner || session?.user?.role?.canVendas) && (
            <div style={styles.navItem} onClick={() => window.location.href='/mercadao'}>
              <Store size={18} /> Mercadão
            </div>
          )}

          {(session?.user?.isOwner || session?.user?.role?.canAdmin) && (
            <NavItem active={activeTab === "tab-roles"} icon={<Shield size={18}/>} label="Gerenciar Cargos" onClick={() => handleTabClick("tab-roles", "Gerenciar Cargos")} styles={styles} />
          )}
          
          {(session?.user?.isOwner || session?.user?.role?.canAdmin) && (
            <NavItem active={activeTab === "tab-equipe"} icon={<Users size={18}/>} label="Gerenciar Equipe" onClick={() => handleTabClick("tab-equipe", "Gerenciar Equipe")} styles={styles} />
          )}

          {(session?.user?.isOwner || session?.user?.role?.canLogs) && (
            <NavItem active={activeTab === "tab-logs"} icon={<Scroll size={18}/>} label="Logs" onClick={() => handleTabClick("tab-logs", "Logs")} styles={styles} />
          )}

          {session?.user?.name === "admin" && (
            <>
              <div style={styles.navLabel}>ADMINISTRAÇÃO</div>
              <div 
                style={{...styles.navItemMaster, ...(activeTab === "tab-master" ? styles.navItemMasterActive : {})}} 
                onClick={() => handleTabClick("tab-master", "Master Keys")}
              >
                <Key size={18} /> Master Keys
              </div>
            </>
          )}
        </div>
      </div>

      {/* RODAPÉ: PERFIL E LOGOUT */}
      <div 
        style={{ 
          ...styles.userInfoBar, 
          cursor: 'pointer', borderTop: '1px solid #1c1f26', padding: '15px 24px',
          backgroundColor: '#0d0f14', flexShrink: 0, marginBottom: '20px'
        }} 
        onClick={() => setShowPerfilModal(true)}
      >
        <div style={styles.userDetails}>
          <span style={styles.userName}>{session?.user?.name}</span>
          <span style={styles.userRole}>
            {session?.user?.role?.name || (session?.user?.isOwner ? "Dono" : "Funcionário")}
          </span>
        </div>
        <button style={styles.btnLogoutIcon} onClick={(e) => { e.stopPropagation(); signOut(); }}>
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}

// Sub-componente para os itens do menu (evita repetição de código)
function NavItem({ active, icon, label, onClick, styles }) {
  return (
    <div 
      style={{...styles.navItem, ...(active ? styles.navItemActive : {})}} 
      onClick={onClick}
    >
      {icon} {label}
    </div>
  );
}