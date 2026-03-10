import React from 'react';
import { Shield, CheckCircle, ClipboardList, Trash2 } from "lucide-react";

export default function RolesTab({ 
  styles, 
  newRole, 
  setNewRole, 
  criarRole, 
  loadingAction, 
  roleList 
}) {
  const permissions = [
    { key: 'canVendas', label: 'VENDAS' },
    { key: 'canCraft', label: 'CRAFT' },
    { key: 'canLogs', label: 'LOGS' },
    { key: 'canAdmin', label: 'ADMIN' }
  ];

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
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.headerIcon}><ClipboardList size={18} /></div>
            <h3>Cargos e Hierarquia</h3>
          </div>
          <div style={styles.roleContainer}>
            {roleList.map((role) => (
              <div key={role.id} style={styles.roleCard}>
                <div style={styles.roleCardTop}>
                  <span style={styles.roleTitle}>
                    <span style={{ color: 'var(--cor-primaria, #d4a91c)' }}>Cargo:</span> {role.name}
                  </span>
                  <button 
                    onClick={() => window.app?.excluirRole(role.id, role.name)} 
                    style={{...styles.btnActionDelete, background: 'none', border: 'none', cursor: 'pointer', color: '#ff4c4c'}}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{...styles.permList, display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px'}}>
                  {role.canVendas && <span style={styles.tinyBadge}>Vendas</span>}
                  {role.canCraft && <span style={styles.tinyBadge}>Produção</span>}
                  {role.canLogs && <span style={styles.tinyBadge}>Logs</span>}
                  {role.canAdmin && <span style={{...styles.tinyBadge, borderColor: '#ff4c4c', color: '#ff4c4c'}}>Admin</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}