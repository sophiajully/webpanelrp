'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Users, Key, Trash2, X, Loader2, Check, Ban, UserCircle, Copy, CheckCircle2 } from "lucide-react";
import { submitServerAction } from "@/app/actions/appActions";
import { useSession } from "next-auth/react";

export default function EquipeTab({ styles }) {
  const { data: session } = useSession();
  
  // --- ESTADOS ---
  const [teamList, setTeamList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [hireRequests, setHireRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successData, setSuccessData] = useState(null); 
  
  const [novoFuncionario, setNovoFuncionario] = useState({
    username: "",
    roleId: ""
  });

  // --- BUSCA DE DADOS ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resEquipe, resRoles, resRequests] = await Promise.all([
        submitServerAction('/equipe', 'GET'),
        submitServerAction('/roles', 'GET'),
        submitServerAction('/hire-requests', 'GET')
      ]);

      setTeamList(Array.isArray(resEquipe) ? resEquipe : (resEquipe?.data || []));
      setRoleList(Array.isArray(resRoles) ? resRoles : (resRoles?.data || []));
      setHireRequests(Array.isArray(resRequests) ? resRequests : (resRequests?.data || []));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- UTILITÁRIOS ---
  
  // Função para registrar logs no endpoint /company-logs
  const registrarLog = async (action, details, category = "RH") => {
    try {
      await submitServerAction('/company-logs', 'POST', {
        action,
        category,
        details,
        companyId: session?.user?.companyId,
        userId: session?.user?.id
      });
    } catch (e) {
      console.error("Erro ao registrar log:", e);
    }
  };

  const copiarParaTransferencia = (texto) => {
    navigator.clipboard.writeText(texto);
    if (window.showToast) window.showToast("Copiado para a área de transferência!", "success");
  };

  // --- AÇÕES ---
  const handleGerenciarSolicitacao = async (requestId, action) => {
    setActionLoading(true);
    await submitServerAction('/hire-requests', 'PATCH', { requestId, action });
    await fetchData();
    setActionLoading(false);
  };

  const handleMudarRole = async (userId, roleId) => {
    const user = teamList.find(u => u.id === userId);
    const role = roleList.find(r => r.id === roleId);
    
    await submitServerAction('/equipe', 'PATCH', { userId, roleId: roleId || null });
    await registrarLog("CARGO_ALTERADO", `Cargo de ${user?.username} alterado para ${role?.name || 'Sem Cargo'}`);
    await fetchData();
  };

  const handleRemoverMembro = async (id) => {
    const user = teamList.find(u => u.id === id);
    const confirmar = window.askConfirm 
      ? await window.askConfirm(`⚠️ Deseja realmente remover ${user?.username}?`) 
      : confirm(`Deseja remover ${user?.username}?`);
      
    if (!confirmar) return;
    
    await submitServerAction(`/equipe?id=${id}`, 'DELETE');
    await registrarLog("FUNCIONARIO_REMOVIDO", `Colaborador ${user?.username} foi removido da equipe.`);
    await fetchData();
  };

  const handleResetarSenha = async (userId, username) => {
    const confirmar = window.askConfirm 
      ? await window.askConfirm(`Deseja resetar a senha de ${username}?`) 
      : confirm("Resetar senha?");
      
    if (!confirmar) return;

    const res = await submitServerAction('/users/reset-password', 'PATCH', { userId });
    if (res?.newPassword) {
      await registrarLog("SENHA_RESETADA", `A senha de ${username} foi resetada pelo administrador.`);
      setSuccessData({
        title: "Senha Resetada!",
        username: username,
        password: res.newPassword,
        message: "A senha antiga foi invalidada. Forneça a nova senha ao colaborador."
      });
    }
  };

  const executarContratacao = async () => {
    if (!novoFuncionario.username) return window.showToast ? window.showToast("Digite o login!", 'error') : alert("Login vazio");
    
    const generatedPassword = Math.random().toString(36).slice(-8);
    
    setActionLoading(true);
    const res = await submitServerAction('/users', 'POST', {
      ...novoFuncionario,
      password: generatedPassword,
      companyId: session?.user?.companyId
    });
    
    if (res?.error) {
        if (window.showToast) window.showToast(res.error, 'error');
        else alert(res.error);
    } else {
        // REGISTRO DE LOG NO NOVO ENDPOINT
        await registrarLog("FUNCIONARIO_ADMITIDO", `Novo funcionário ${novoFuncionario.username} criado no sistema.`);

        setIsModalOpen(false);
        setSuccessData({
            title: "Funcionário Admitido!",
            username: novoFuncionario.username,
            password: generatedPassword,
            message: "O acesso foi criado com sucesso. O colaborador já pode logar."
        });
        setNovoFuncionario({ username: "", roleId: "" });
        fetchData();
    }
    setActionLoading(false);
  };

  if (loading && teamList.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Loader2 className="animate-spin" color="var(--cor-primaria)" size={48} />
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in' }}>
      
      {/* HEADER */}
      <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          marginBottom: '30px', gap: '20px', flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{color: 'var(--cor-primaria)'}} /> Equipe Operacional
          </h2>
          <p style={{ color: '#aaa', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Gerencie permissões e acessos da sua fazenda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            background: 'var(--cor-primaria)', color: '#000', border: 'none', padding: '12px 24px', 
            borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px',
            cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(212, 169, 28, 0.2)'
          }}
        >
          <UserPlus size={20} /> <span className="hide-mobile">Novo Funcionário</span>
        </button>
      </div>

      {/* SOLICITAÇÕES PENDENTES */}
      {hireRequests.length > 0 && (
        <div style={{ 
            background: 'linear-gradient(90deg, rgba(212,169,28,0.1) 0%, rgba(212,169,28,0.02) 100%)', 
            borderLeft: '4px solid var(--cor-primaria)', marginBottom: '30px', borderRadius: '0 12px 12px 0'
        }}>
          <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--cor-primaria)', fontWeight: '600' }}>
            <UserCircle size={20} /> Solicitações de Ingresso ({hireRequests.length})
          </div>
          <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {hireRequests.map(req => (
              <div key={req.id} style={{ 
                  background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
              }}>
                <span style={{ color: '#fff', fontWeight: '500' }}>{req.user.username}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleGerenciarSolicitacao(req.id, 'approve')} style={{ background: '#00ff90', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><Check size={18}/></button>
                  <button onClick={() => handleGerenciarSolicitacao(req.id, 'reject')} style={{ background: '#ff4c4c', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#fff' }}><Ban size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABELA DE MEMBROS */}
      <div style={{ 
          background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ padding: '20px', textAlign: 'left', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>Membro</th>
                <th style={{ padding: '20px', textAlign: 'left', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>Cargo / Permissão</th>
                <th style={{ padding: '20px', textAlign: 'right', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>Gestão</th>
              </tr>
            </thead>
            <tbody>
              {teamList.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: 'var(--cor-primaria)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {m.username.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: '#fff', fontWeight: '500' }}>{m.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <select 
                      style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '8px 12px', borderRadius: '8px', width: '100%', maxWidth: '200px' }}
                      value={m.roleId || ""} 
                      onChange={(e) => handleMudarRole(m.id, e.target.value)}
                    >
                      <option value="">🚫 Sem Cargo</option>
                      {roleList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '5px' }}>
                        <button onClick={() => handleResetarSenha(m.id, m.username)} style={{ background: 'rgba(241,196,15,0.1)', border: 'none', color: '#f1c40f', padding: '10px', borderRadius: '8px', cursor: 'pointer' }} title="Resetar Senha"><Key size={18}/></button>
                        <button onClick={() => handleRemoverMembro(m.id)} style={{ background: 'rgba(255,76,76,0.1)', border: 'none', color: '#ff4c4c', padding: '10px', borderRadius: '8px', cursor: 'pointer' }} title="Demitir"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {isModalOpen && (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' 
        }}>
          <div style={{ background: '#161922', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}>Admitir Funcionário</h3>
                <p style={{ color: '#888', marginTop: '5px' }}>O sistema gerará uma senha segura.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ color: '#ccc', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Login do Usuário</label>
                <input type="text" style={{ width: '100%', background: '#0d0f14', border: '1px solid #333', padding: '14px', borderRadius: '12px', color: '#fff' }} placeholder="ex: marcos_fazenda" value={novoFuncionario.username} onChange={(e) => setNovoFuncionario({...novoFuncionario, username: e.target.value})} />
              </div>
              <div>
                <label style={{ color: '#ccc', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Atribuir Cargo</label>
                <select style={{ width: '100%', background: '#0d0f14', border: '1px solid #333', padding: '14px', borderRadius: '12px', color: '#fff' }} value={novoFuncionario.roleId} onChange={(e) => setNovoFuncionario({...novoFuncionario, roleId: e.target.value})} >
                  <option value="">Selecione um cargo inicial</option>
                  {roleList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <button onClick={executarContratacao} disabled={actionLoading} style={{ background: 'var(--cor-primaria)', color: '#000', padding: '16px', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>
                {actionLoading ? <Loader2 className="animate-spin" /> : "FINALIZAR ADMISSÃO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO */}
      {successData && (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' 
        }}>
          <div style={{ 
              background: '#1c1f26', padding: '40px', borderRadius: '28px', width: '100%', maxWidth: '400px', 
              border: '2px solid var(--cor-primaria)', textAlign: 'center', boxShadow: '0 0 30px rgba(212,169,28,0.2)'
          }}>
            <div style={{ color: 'var(--cor-primaria)', marginBottom: '20px' }}><CheckCircle2 size={64} style={{margin: '0 auto'}} /></div>
            <h2 style={{ color: '#fff', marginBottom: '10px' }}>{successData.title}</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '25px' }}>{successData.message}</p>
            
            <div style={{ background: '#0d0f14', padding: '20px', borderRadius: '16px', border: '1px solid #333', marginBottom: '25px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <span style={{ color: '#666', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase' }}>Usuário</span>
                    <span style={{ color: '#fff', fontWeight: '600', fontSize: '1.1rem' }}>{successData.username}</span>
                </div>
                <div>
                    <span style={{ color: '#666', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase' }}>Senha de Acesso</span>
                    <span style={{ color: 'var(--cor-primaria)', fontWeight: 'bold', fontSize: '1.4rem', letterSpacing: '1px' }}>{successData.password}</span>
                </div>
                <button 
                    onClick={() => copiarParaTransferencia(successData.password)}
                    style={{ marginTop: '15px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '15px auto 0' }}
                >
                    <Copy size={16} /> Copiar Senha
                </button>
            </div>

            <button 
                onClick={() => setSuccessData(null)}
                style={{ width: '100%', background: '#fff', color: '#000', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
                CONCLUÍDO
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) { .hide-mobile { display: none; } }
      `}</style>
    </div>
  );
}