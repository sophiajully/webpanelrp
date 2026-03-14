"use client";

import { useAppData } from "@/app/hooks/useAppData"
import { HomeStyles as styles } from "@/styles/page";


import Sidebar from "@/app/components/index/Sidebar";
import AvisosTab from "@/app/components/index/AvisosTab";
import LogsTab from "@/app/components/index/LogsTab";
import RegistrarTab from "@/app/components/index/RegistrarTab";
import EquipeTab from "@/app/components/index/EquipeTab";
import RolesTab from "@/app/components/index/RolesTab";
import MasterTab from "@/app/components/index/MasterTab";
import ConfigModal from "@/app/components/index/ConfigModal";
import NovaEmpresaModal from "@/app/components/index/NovaEmpresaModal";
import RestrictedAccess from "@/app/components/index/RestrictedAccess";
import PerfilModal from "@/app/components/index/PerfilModal";
import VendasTab from "@/app/components/index/VendasTab";
import ChatTab from "@/app/components/index/ChatTab";
import Toast from "@/app/components/Toast";
import ConfirmModal from "@/app/components/ConfirmModal";
import PagamentosTab from "@/app/components/index/PagamentosTab";


import { Settings, XCircle, Menu } from "lucide-react";
import DashboardTab from "./components/index/DashboardTab";
import { useRouter } from "next/navigation";
export default function Home() {
  const { states, actions } = useAppData();
  const { session, status, activeTab, isSidebarOpen, isMobile } = states;
  const router = useRouter();
  if (status !== "authenticated") return router.push("/login")
  if (status === "loading") {
    return (
      <div style={styles.loadingScreen}>
        <div className="spinner"></div>
        <span>Sincronizando Sistema...</span>
      </div>
    );
  }


  if (status === "authenticated" && !session?.user?.companyId && !session?.user?.isOwner) return <RestrictedAccess router={states.router} signOut={actions.signOut} styles={styles} />;


  return (
    <div style={styles.layoutWrapper}>

      {isMobile && (
        <button
          onClick={() => actions.setIsSidebarOpen(!isSidebarOpen)}
          style={{ ...styles.mobileMenuBtn, left: isSidebarOpen ? '230px' : '15px' }}
        >
          {isSidebarOpen ? <XCircle size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar Isolada ou Integrada */}
      <Sidebar states={states} actions={actions} styles={styles} />

      {/* Overlay Mobile */}
      {isSidebarOpen && isMobile && (
        <div onClick={() => actions.setIsSidebarOpen(false)} style={styles.overlay} />
      )}

      <main style={styles.mainContent}>
        <header style={styles.mainHeader}>
          <div>
            <span style={styles.breadcrumb}>Dashboard / {activeTab.replace("tab-", "")}</span>
            <h2 style={styles.pageTitle}>Painel de Controle</h2>
          </div>
          <button onClick={() => actions.setIsModalConfigOpen(true)} style={styles.btnSettings}>
            <Settings size={18} />
          </button>
        </header>


        <AvisosTab
          session={session} styles={styles} announcements={states.announcements}
          newNotice={states.newNotice} setNewNotice={actions.setNewNotice}
          handlePostNotice={actions.handlePostNotice} handleDeleteNotice={actions.handleDeleteNotice}
          display={activeTab === 'tab-avisos'}
        />
        <ChatTab session={session} display={activeTab === "tab-chat"} />



        <RegistrarTab
          styles={styles} craftList={states.craftList}
          producaoQtds={states.producaoQtds} handleQtdChange={actions.handleQtdChange}
          refreshData={actions.refreshData}
          display={activeTab === "tab-registrar"}
        />

        <VendasTab styles={styles} states={states} actions={actions} display={activeTab === "tab-vendas"} />



        <DashboardTab
          styles={styles}
          session={session}
          isMobile={isMobile}
          display={activeTab === 'tab-dashboard'}
        />

        <EquipeTab
          styles={styles} hireRequests={states.hireRequests} teamList={states.teamList}
          roleList={states.roleList} gerenciarSolicitacao={actions.gerenciarSolicitacao}
          mudarRoleUsuario={actions.mudarRoleUsuario} removerMembro={actions.removerMembro}
          display={activeTab === "tab-equipe"}
        />


        <RolesTab
          styles={styles} newRole={states.newRole} setNewRole={actions.setNewRole}
          criarRole={actions.criarRole} loadingAction={states.loadingAction} roleList={states.roleList}
          display={activeTab === "tab-roles"}
        />

        <PagamentosTab session={session} styles={styles} isMobile={isMobile} display={activeTab === "tab-pagamentos"} />


        <LogsTab session={session} styles={styles} isMobile={isMobile} display={activeTab === "tab-logs"} />

        <MasterTab
          session={session} styles={styles} newKeyDays={states.newKeyDays}
          setNewKeyDays={actions.setNewKeyDays} gerarNovaKey={actions.gerarNovaKey}
          loadingKey={states.loadingKey} keyList={states.keyList} excluirKey={actions.excluirKey}
          display={activeTab === "tab-master"}
        />
      </main>

      {states.showPerfilModal && (
        <PerfilModal
          isOpen={states.showPerfilModal} onClose={() => actions.setShowPerfilModal(false)}
          session={session} styles={styles} meuPombo={states.meuPombo}
          setMeuPombo={actions.setMeuPombo} salvarConfigPombo={actions.salvarConfigPombo}
          loadingPombo={states.loadingPombo}
        />
      )}

      <ConfigModal
        isOpen={states.isModalConfigOpen} onClose={() => actions.setIsModalConfigOpen(false)}
        session={session} styles={styles} handleSalvarConfig={actions.handleSalvarConfig}
      />

      <NovaEmpresaModal
        isOpen={states.showNovaNovaEmpresaModal} onClose={() => actions.setShowNovaEmpresaModal(false)}
        styles={styles} novaEmpresaData={states.novaEmpresaData} setNovaEmpresaData={actions.setNovaEmpresaData}
        criarNovaEmpresa={actions.criarNovaEmpresa} loadingAction={states.loadingAction}
      />

      <Toast />
      <ConfirmModal />
    </div>
  );
}
