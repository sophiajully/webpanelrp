import React from 'react';
import { 
  Bell, MessageSquare, ShoppingCart, Hammer, Store, 
  Shield, Users, Scroll, Key, LogOut, ChevronRight, Trash2, CircleDollarSign,
  ChartArea, Toolbox, Plus
} from "lucide-react";

// Importações do shadcn/ui e utilitários
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <aside 
      className={cn(
        "flex flex-col h-screen w-[280px] bg-background border-r border-border z-[150] transition-transform duration-300 ease-in-out",
        isMobile ? "fixed top-0 left-0" : "relative top-0 left-0 shrink-0",
        isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
      )}
    >
      {/* PARTE SUPERIOR: MENU COM SCROLL */}
      <ScrollArea className="flex-1 w-full">
        <div className={cn("flex flex-col gap-1 pb-6", isMobile ? "pt-16" : "pt-4")}>
          
          {/* SEÇÃO DE EMPRESA (Apenas Owners) */}
          {session?.user?.isOwner && (
            <div className="px-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Propriedade Ativa
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 text-[10px] text-primary hover:text-primary/80 hover:bg-transparent"
                  onClick={() => setShowNovaEmpresaModal(true)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Nova Empresa
                </Button>
              </div>

              {/* Utilizando o DropdownMenu nativo do shadcn */}
              <DropdownMenu open={showCompanySelector} onOpenChange={setShowCompanySelector}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between bg-secondary/20 hover:bg-secondary/40 border-border h-12"
                  >
                    <span className="truncate">
                      {session?.user?.companyName || "Selecionar Empresa"}
                    </span>
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0 transition-transform text-primary", 
                      showCompanySelector && "rotate-90"
                    )} />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-[248px] ml-4">
                  {Array.isArray(minhasEmpresas) && minhasEmpresas.map((empresa) => (
                    <DropdownMenuItem 
                      key={empresa.id}
                      className={cn(
                        "flex justify-between items-center cursor-pointer",
                        session?.user?.companyId === empresa.id && "bg-primary/10 text-primary focus:bg-primary/15"
                      )}
                      onSelect={(e) => {
                        e.preventDefault(); // Previne fechar antes da lógica
                        trocarEmpresaAtiva(empresa.id); 
                        setShowCompanySelector(false);
                      }}
                    >
                      <span className="truncate">{empresa.name}</span>
                      {session?.user?.companyId !== empresa.id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            excluirEmpresa(empresa.id, empresa.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div className="px-3">
            <h4 className="px-2 mb-1 mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Principal
            </h4>
            <div className="space-y-1">
              <NavItem active={activeTab === "tab-avisos"} icon={<Bell size={18}/>} label="Avisos" onClick={() => handleTabClick("tab-avisos", "Avisos")} />
              <NavItem active={activeTab === "tab-dashboard"} icon={<ChartArea size={18}/>} label="Dashboard" onClick={() => handleTabClick("tab-dashboard", "Dashboard")} />
              <NavItem active={activeTab === "tab-ferramentas"} icon={<Toolbox size={18}/>} label="Ferramentas" onClick={() => handleTabClick("tab-ferramentas", "Ferramentas")} />
              <NavItem active={activeTab === "tab-chat"} icon={<MessageSquare size={18}/>} label="Chat Interno" onClick={() => handleTabClick("tab-chat", "Chat da Fazenda")} />

              {(session?.user?.isOwner || session?.user?.role?.canVendas) && (
                <NavItem active={activeTab === "tab-vendas"} icon={<ShoppingCart size={18}/>} label="Pedidos" onClick={() => handleTabClick("tab-vendas", "Nova Encomenda")} />
              )}

              {(session?.user?.isOwner || session?.user?.role?.canCraft) && (
                <NavItem active={activeTab === "tab-registrar"} icon={<Hammer size={18}/>} label="Craft" onClick={() => handleTabClick("tab-registrar", "Registrar Craft")} />
              )}
            </div>

            <Separator className="my-4" />

            <h4 className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gestão
            </h4>
            <div className="space-y-1">
              <NavItem active={activeTab === "tab-pagamentos"} icon={<CircleDollarSign size={18}/>} label="Pagamentos" onClick={() => handleTabClick("tab-pagamentos", "Pagamentos")} />
              
              {(session?.user?.isOwner || session?.user?.role?.canVendas) && (
                <NavItem active={false} icon={<Store size={18}/>} label="Mercadão" onClick={() => window.location.href='/mercadao'} />
              )}

              {(session?.user?.isOwner || session?.user?.role?.canAdmin) && (
                <NavItem active={activeTab === "tab-roles"} icon={<Shield size={18}/>} label="Gerenciar Cargos" onClick={() => handleTabClick("tab-roles", "Gerenciar Cargos")} />
              )}
              
              {(session?.user?.isOwner || session?.user?.role?.canAdmin) && (
                <NavItem active={activeTab === "tab-equipe"} icon={<Users size={18}/>} label="Gerenciar Equipe" onClick={() => handleTabClick("tab-equipe", "Gerenciar Equipe")} />
              )}

              {(session?.user?.isOwner || session?.user?.role?.canLogs) && (
                <NavItem active={activeTab === "tab-logs"} icon={<Scroll size={18}/>} label="Logs" onClick={() => handleTabClick("tab-logs", "Logs")} />
              )}
            </div>

            {session?.user?.name === "admin" && (
              <>
                <Separator className="my-4" />
                <h4 className="px-2 mb-1 text-xs font-semibold text-destructive uppercase tracking-wider">
                  Administração
                </h4>
                <div className="space-y-1">
                  <NavItem 
                    active={activeTab === "tab-master"} 
                    icon={<Key size={18} />} 
                    label="Master Keys" 
                    onClick={() => handleTabClick("tab-master", "Master Keys")} 
                    className={activeTab === "tab-master" ? "bg-destructive/10 text-destructive hover:bg-destructive/15" : "hover:text-destructive hover:bg-destructive/5"}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* RODAPÉ: PERFIL E LOGOUT */}
      <div 
        className="mt-auto flex items-center justify-between p-4 border-t border-border bg-background cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => setShowPerfilModal(true)}
      >
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium truncate">{session?.user?.name}</span>
          <span className="text-xs text-muted-foreground truncate">
            {session?.user?.role?.name || (session?.user?.isOwner ? "Dono" : "Funcionário")}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => { 
            e.stopPropagation(); 
            signOut(); 
          }}
        >
          <LogOut size={18} />
        </Button>
      </div>
    </aside>
  );
}

// Sub-componente utilizando o Button do shadcn para gerenciar estado e acessibilidade
function NavItem({ active, icon, label, onClick, className }) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 px-3 h-10 font-normal",
        active 
          ? "bg-primary/10 text-primary hover:bg-primary/15 font-medium" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
        className
      )}
      onClick={onClick}
    >
      {icon} 
      <span>{label}</span>
    </Button>
  );
}