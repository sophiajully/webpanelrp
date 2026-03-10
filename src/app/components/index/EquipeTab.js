import React from 'react';
import { UserPlus, Users, Key, Trash2 } from "lucide-react";

export default function EquipeTab({ 
  styles, 
  hireRequests = [], 
  teamList = [], 
  roleList = [], 
  gerenciarSolicitacao, 
  mudarRoleUsuario, 
  removerMembro 
}) {
  return (
    <div id="tab-equipe" style={styles.pageContent}>
      
      {/* HEADER DA SEÇÃO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}>Gerenciamento de Equipe</h2>
          <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '0.85rem' }}>Contrate, gerencie cargos ou desligue colaboradores.</p>
        </div>
        <button 
          onClick={() => window.app?.abrirModalContratacao()}
          style={{ 
            background: 'var(--cor-primaria, #d4a91c)', 
            color: '#000', 
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

      {/* SOLICITAÇÕES DE INGRESSO */}
      {hireRequests.length > 0 && (
        <div style={{...styles.card, borderLeft: '4px solid #d4a91c', marginBottom: '30px', background: 'rgba(212,169,28,0.03)'}}>
          <div style={styles.cardHeader}>
            <div style={{...styles.headerIcon, background: 'rgba(212,169,28,0.1)', color: '#d4a91c'}}><UserPlus size={18} /></div>
            <h3 style={{color: '#d4a91c'}}>Solicitações de Ingresso ({hireRequests.length})</h3>
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

      {/* TABELA DE COLABORADORES */}
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
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(212,169,28,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a91c', fontWeight: 'bold' }}>
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
                      style={{ ...styles.roleSelect, width: '180px', padding: '6px', background: '#0d0f14', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
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
                      <button 
                        style={{ background: 'none', border: 'none', color: '#f1c40f', cursor: 'pointer', padding: '8px' }} 
                        onClick={() => window.app?.resetarSenhaFuncionario(m.id, m.username)}
                        title="Resetar Senha"
                      >
                        <Key size={20} />
                      </button>
                      <button 
                        style={{ background: 'none', border: 'none', color: '#ff4c4c', cursor: 'pointer', padding: '8px' }} 
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

      {/* MODAL DE CONTRATAÇÃO (Via DOM) */}
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
            <div style={{ background: 'rgba(212,169,28,0.1)', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a91c', margin: '0 auto 15px' }}>
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
            <label style={{ color: '#d4a91c', fontSize: '0.7rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>SENHA GERADA AUTOMATICAMENTE</label>
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
              onClick={() => window.app?.executarContratacao()}
              style={{ flex: 2, background: '#d4a91c', color: '#000', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Confirmar e Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}