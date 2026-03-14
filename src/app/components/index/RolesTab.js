import React, { useState, useEffect, useCallback } from 'react';
import { Shield, CheckCircle, ClipboardList, Trash2, Tag } from "lucide-react";
import { submitServerAction } from '@/app/actions/appActions'; // Ajuste o caminho

export default function RolesTab({ session, styles, display }) {
  // Estados Locais
  const [roleList, setRoleList] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Estado para o formulário de criação
  const [newRole, setNewRole] = useState({
    name: "", canVendas: true, canCraft: true, canLogs: false, canAdmin: false
  });

  const permissions = [
    { key: 'canVendas', label: 'VENDAS' },
    { key: 'canCraft', label: 'CRAFT' },
    { key: 'canLogs', label: 'LOGS' },
    { key: 'canAdmin', label: 'ADMIN' }
  ];

  // 1. CARREGAR CARGOS
  const carregarRoles = useCallback(async () => {
    try {
      const res = await submitServerAction('roles', 'GET'); 
      if (res && Array.isArray(res)) {
        setRoleList(res);
      } else if (res && Array.isArray(res.roles)) {
        setRoleList(res.roles);
      }
    } catch (err) {
      console.error("Erro ao carregar Cargos:", err);
    }
  }, []);

  // 2. CRIAR CARGO
  const criarRole = async () => {
    if (!newRole.name) return window.showToast("Nome do cargo necessário.", 'error');
    setLoadingAction(true);
    
    try {
      const res = await submitServerAction('roles', 'POST', newRole);
      
      if (!res.error) {
        setNewRole({ name: "", canVendas: true, canCraft: true, canLogs: false, canAdmin: false });
        await carregarRoles();
        window.showToast("✅ Cargo criado com sucesso!");
      } else {
         window.showToast("Erro ao criar cargo: " + res.error, 'error');
      }
    } catch (err) {
      window.showToast("Erro ao conectar ao servidor.", 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // 3. EXCLUIR CARGO
  const excluirRole = async (id, name) => {
    if (!window.askConfirm(`Tem certeza que deseja excluir o cargo "${name}"? Usuários com este cargo perderão as permissões associadas.`)) return;
    
    try {
      const res = await submitServerAction(`roles?id=${id}`, 'DELETE');
      if (!res.error) {
        setRoleList(prev => prev.filter(r => r.id !== id));
        window.showToast("✅ Cargo removido com sucesso!");
      } else {
        window.showToast("Erro ao excluir: " + res.error, 'error');
      }
    } catch (err) {
      window.showToast("Falha na exclusão.", 'error');
    }
  };

  // 4. CARREGAR AO MONTAR
  useEffect(() => {
    carregarRoles();
  }, [carregarRoles]);

  // Estilos reutilizáveis para as Badges (Pílulas de permissão)
  const badgeStyle = {
    padding: '4px 10px',
    borderRadius: '999px', // Deixa redondinho estilo pílula
    fontSize: '0.65rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
    border: '1px solid var(--cor-primaria, #d4a91c)44' // borda com transparência
  };

  const adminBadgeStyle = {
    ...badgeStyle,
    backgroundColor: 'rgba(255, 76, 76, 0.1)',
    color: '#ff4c4c',
    border: '1px solid rgba(255, 76, 76, 0.3)'
  };

  if(!display) return;

  return (
    <div id="tab-roles" style={styles.pageContent}>
      <div style={styles.grid2Cols}>
        
        {/* CARD: CRIAR NOVO CARGO */}
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
            {permissions.map((perm) => {
              const isChecked = newRole[perm.key];
              return (
                <label 
                  key={perm.key} 
                  style={{
                    ...styles.checkLabel,
                    backgroundColor: isChecked ? 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))' : 'rgba(0, 0, 0, 0.3)',
                    borderColor: isChecked ? 'var(--cor-primaria, #d4a91c)' : '#2d2d44',
                    color: isChecked ? '#fff' : '#666',
                    padding: '10px',
                    borderRadius: '7px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <input 
                    type="checkbox" 
                    style={{ position: 'absolute', opacity: 0, cursor: 'pointer' }} 
                    checked={isChecked} 
                    onChange={(e) => setNewRole({ ...newRole, [perm.key]: e.target.checked })} 
                  />
                  
                  {/* Checkbox Customizado */}
                  <div style={{
                    backgroundColor: isChecked ? 'var(--cor-destaque, #ff4c4c)' : 'transparent',
                    borderColor: isChecked ? 'var(--cor-destaque, #ff4c4c)' : '#444',
                    width: '16px',
                    height: '16px',
                    border: '1px solid',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    {isChecked && <CheckCircle size={10} color="#fff" strokeWidth={4} />}
                  </div>
                  
                  <span style={{...styles.permText, fontSize: '0.7rem', fontWeight: 'bold'}}>
                    {perm.label}
                  </span>
                </label>
              );
            })}
          </div>

          <button 
            style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '24px', width: '100%'}} 
            onClick={criarRole} 
            disabled={loadingAction}
          >
            {loadingAction ? "Salvando..." : "Cadastrar Cargo"}
          </button>
        </div>

        {/* CARD: LISTA DE CARGOS */}
        <div style={{...styles.card, display: 'flex', flexDirection: 'column'}}>
          <div style={styles.cardHeader}>
            <div style={styles.headerIcon}><ClipboardList size={18} /></div>
            <h3>Cargos e Hierarquia</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', flex: 1 }}>
            {roleList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed #2d2d44' }}>
                <Shield size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Nenhum cargo cadastrado ainda.</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.7 }}>Crie cargos ao lado para organizar sua equipe.</p>
              </div>
            ) : (
              roleList.map((role) => (
                <div key={role.id} style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid #2d2d44',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'transform 0.2s',
                }}>
                  
                  {/* Topo do Card (Nome e Botão Excluir) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={16} color="var(--cor-primaria, #d4a91c)" />
                      {role.name}
                    </h4>
                    
                    <button 
                      onClick={() => excluirRole(role.id, role.name)} 
                      title="Excluir Cargo"
                      style={{
                        background: 'rgba(255, 76, 76, 0.1)',
                        border: '1px solid rgba(255, 76, 76, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#ff4c4c',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 76, 76, 0.2)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 76, 76, 0.1)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Lista de Permissões (Badges) */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {role.canVendas && <span style={badgeStyle}>Vendas</span>}
                    {role.canCraft && <span style={badgeStyle}>Produção</span>}
                    {role.canLogs && <span style={badgeStyle}>Logs</span>}
                    {role.canAdmin && <span style={adminBadgeStyle}>Admin</span>}
                    
                    {/* Caso o cargo não tenha nenhuma permissão marcada */}
                    {!role.canVendas && !role.canCraft && !role.canLogs && !role.canAdmin && (
                      <span style={{...badgeStyle, backgroundColor: 'transparent', color: '#6b7280', border: '1px dashed #4b5563'}}>
                        Nenhuma Permissão
                      </span>
                    )}
                  </div>
                  
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}