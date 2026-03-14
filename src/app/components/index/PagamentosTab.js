"use client";

import React, { useState, useEffect } from 'react';
import { submitServerAction } from '@/app/actions/appActions';
import { Wallet, PlusCircle, CheckCircle, Clock, User, RefreshCw, Target, Award, ClipboardCheck } from "lucide-react";

export default function PagamentosTab({ session, styles, isMobile, display }) {
  const isOwner = session?.user?.isOwner || session?.user?.role?.isOwner || session?.user?.role?.canAdmin;
  const primaryColor = session?.user?.company?.colorPrimary || '#ff4c4c';

  // Estados Financeiros
  const [pagamentos, setPagamentos] = useState([]);
  const [acao, setAcao] = useState("");
  const [valores, setValores] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados de Contratos
  const [contratos, setContratos] = useState([]);
  const [novaDescricaoContrato, setNovaDescricaoContrato] = useState("");
  const [novoValorContrato, setNovoValorContrato] = useState("");

  // Estados de UI/UX
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchDados = async () => {
    if (fetching) return;
    setFetching(true);
    try {
      // Busca Pagamentos e Contratos simultaneamente
      const [resPagamentos, resContratos] = await Promise.all([
        submitServerAction('/api/pagamentos', 'GET'),
        submitServerAction('/api/contratos', 'GET') // Necessário criar esta rota no backend
      ]);

      if (resPagamentos && !resPagamentos.error) setPagamentos(resPagamentos);
      if (resContratos && !resContratos.error) setContratos(resContratos);
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
    } finally {
      setTimeout(() => setFetching(false), 600);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  // --- AÇÕES DE PAGAMENTOS ---
  const registrarAcao = async () => {
    if (!acao || acao.trim() === "") return;
    setLoading(true);
    const res = await submitServerAction('/api/pagamentos', 'POST', { action: acao.trim() });
    if (!res?.error) {
      setAcao("");
      fetchDados();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const pagarAcao = async (id) => {
    const valorDefinido = parseFloat(valores[id]);
    if (!valorDefinido || valorDefinido <= 0) return;
    setLoading(true);
    const res = await submitServerAction('/api/pagamentos', 'PUT', { paymentId: id, amount: valorDefinido });
    if (!res?.error) {
      setValores(prev => ({ ...prev, [id]: "" }));
      fetchDados();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  // --- AÇÕES DE CONTRATOS ---
  const criarContrato = async () => {
    const valorNum = parseFloat(novoValorContrato);
    if (!novaDescricaoContrato.trim() || !valorNum || valorNum <= 0) return;
    
    setLoading(true);
    const res = await submitServerAction('/api/contratos', 'POST', { 
      description: novaDescricaoContrato.trim(), 
      reward: valorNum 
    });
    
    if (!res?.error) {
      setNovaDescricaoContrato("");
      setNovoValorContrato("");
      fetchDados();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const concluirContrato = async (contrato) => {
    if (!await window.askConfirm(`Deseja concluir o contrato: "${contrato.description}"? Ele será enviado para análise de pagamento.`)) return;
    
    setLoading(true);
    // 1. Finaliza o contrato
    const resContrato = await submitServerAction('/api/contratos', 'PUT', { contractId: contrato.id });
    
    // 2. Cria o registro de pagamento pendente automaticamente para o usuário
    if (!resContrato?.error) {
      await submitServerAction('/api/pagamentos', 'POST', { 
        action: `[CONTRATO CONCLUÍDO] ${contrato.description}`,
        suggestedAmount: contrato.reward 
      });
      fetchDados();
    } else {
      alert(resContrato.error);
    }
    setLoading(false);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valor);
  };

  const localStyles = {
    container: { padding: '20px', width: '100%', color: '#fff', display: 'flex', flexDirection: 'column', gap: '24px' },
    card: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '20px', width: '100%' },
    input: { background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none', width: '100%' },
    buttonPrimary: { background: primaryColor, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', transition: 'all 0.2s ease', whiteSpace: 'nowrap' },
    buttonOutline: { background: 'transparent', color: '#fff', border: `1px solid ${primaryColor}`, padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s ease' },
    badge: (status) => ({
      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
      background: status === 'PAGO' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 193, 7, 0.15)',
      color: status === 'PAGO' ? '#4CAF50' : '#FFC107',
      border: `1px solid ${status === 'PAGO' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`
    })
  };

  const pagamentosFiltrados = pagamentos.filter(p => 
    p.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if(!display) return;

  return (
    <div style={localStyles.container}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: `${primaryColor}22`, padding: '10px', borderRadius: '12px' }}>
            <Wallet size={24} style={{ color: primaryColor }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Finanças & Contratos</h2>
        </div>
        
        <button 
          onClick={fetchDados} 
          disabled={fetching}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: fetching ? primaryColor : '#aaa', cursor: fetching ? 'not-allowed' : 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}
        >
          <RefreshCw size={20} style={{ animation: fetching ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* MURAL DE CONTRATOS */}
      <div style={{  border: '2px dashed rgba(255, 215, 0, 0.3)', borderRadius: '16px', padding: '20px', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          <Target size={24} color="#FFD700" />
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px' }}>Mural de Contratos (Quests)</h3>
        </div>

        {/* Formulário Criar Contrato (Apenas Dono/Admin) */}
        {isOwner && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Descreva a meta (ex: Trazer 50 Peles de Lobo)"
              value={novaDescricaoContrato}
              onChange={(e) => setNovaDescricaoContrato(e.target.value)}
              disabled={loading}
              style={{ ...localStyles.input, flex: 2, background: 'rgba(0,0,0,0.4)' }}
            />
            <input 
              type="number" 
              min="0"
              placeholder="Recompensa ($)"
              value={novoValorContrato}
              onChange={(e) => setNovoValorContrato(e.target.value)}
              disabled={loading}
              style={{ ...localStyles.input, flex: 1, background: 'rgba(0,0,0,0.4)' }}
            />
            <button 
              onClick={criarContrato} 
              disabled={loading || !novaDescricaoContrato || !novoValorContrato}
              style={{ ...localStyles.buttonPrimary, background: '#FFD700', color: '#000' }}
            >
              Publicar
            </button>
          </div>
        )}

        {/* Lista de Contratos Ativos */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {contratos.length === 0 ? (
            <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.9rem' }}>Não há contratos fixados no mural no momento.</p>
          ) : (
            contratos.map(contrato => (
              <div key={contrato.id} className="contract-card" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', padding: '15px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'rgba(255,215,0,0.1)', padding: '20px', borderRadius: '50%' }}>
                  <Award size={40} color="rgba(255,215,0,0.2)" />
                </div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff', position: 'relative', zIndex: 1 }}>{contrato.description}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginTop: '15px' }}>
                  <span style={{ fontWeight: '800', color: '#4CAF50', fontSize: '1.1rem' }}>{formatarMoeda(contrato.reward)}</span>
                  {!isOwner && (
                    <button 
                      onClick={() => concluirContrato(contrato)}
                      disabled={loading}
                      style={{ ...localStyles.buttonOutline, borderColor: '#4CAF50', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <ClipboardCheck size={16} /> Concluir
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* REGISTRO TRADICIONAL (Membro) */}
      {!isOwner && (
        <div style={localStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <PlusCircle size={18} style={{ color: primaryColor }} />
            <span style={{ fontWeight: '600', fontSize: '0.95rem', opacity: 0.9 }}>Registrar ação avulsa</span>
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Descreva sua ação detalhadamente..."
              value={acao}
              onChange={(e) => setAcao(e.target.value)}
              disabled={loading}
              style={{ ...localStyles.input, flex: 1 }}
            />
            <button 
              onClick={registrarAcao} 
              disabled={loading || !acao}
              style={{ ...localStyles.buttonPrimary, opacity: loading || !acao ? 0.5 : 1 }}
            >
              {loading ? '...' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {/* LISTAGEM HISTÓRICO DE PAGAMENTOS */}
      <div style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', width: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '15px' }}>
          <h4 style={{ margin: 0, color: '#666', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isOwner ? "Fluxo de Pagamentos" : "Seu Histórico de Ganhos"}
          </h4>
          {isOwner && (
            <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input 
                type="text"
                placeholder="Buscar por funcionário ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...localStyles.input, paddingLeft: '38px', fontSize: '0.85rem' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
          {pagamentosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>
              <Clock size={48} style={{ marginBottom: '15px', opacity: 0.2 }} />
              <p style={{ fontSize: '0.9rem' }}>Nenhum registro encontrado.</p>
            </div>
          ) : (
            pagamentosFiltrados.map((pagamento) => (
              <div key={pagamento.id} className="payment-item" style={{ background: pagamento.status === "PAGO" ? 'transparent' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', margin: '5px 0', padding: '16px 20px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '15px' }}>
                 <div style={{ flex: '1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={14} style={{ color: primaryColor }} />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{isOwner ? pagamento.user?.username : "Minha Ação"}</span>
                        <div style={localStyles.badge(pagamento.status)}>{pagamento.status === 'PAGO' ? <CheckCircle size={12} /> : <Clock size={12} />} {pagamento.status}</div>
                    </div>
                    <p style={{ margin: '0 0 5px 42px', fontSize: '1.05rem', color: pagamento.action.includes('[CONTRATO') ? '#FFD700' : '#ddd' }}>
                      {pagamento.action}
                    </p>
                 </div>
                 
                 {/* Ações do Dono (Pagar) */}
                 {isOwner && pagamento.status !== "PAGO" && (
                   <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto', marginLeft: isMobile ? '42px' : '0' }}>
                     <input 
                       type="number"
                       min="0"
                       placeholder="$"
                       value={valores[pagamento.id] || ''}
                       onChange={(e) => setValores({...valores, [pagamento.id]: e.target.value})}
                       style={{ ...localStyles.input, width: '90px', padding: '8px' }}
                     />
                     <button 
                       onClick={() => pagarAcao(pagamento.id)}
                       disabled={loading || !valores[pagamento.id]}
                       style={{ ...localStyles.buttonPrimary, padding: '8px 16px' }}
                     >
                       Pagar
                     </button>
                   </div>
                 )}
                 {pagamento.status === "PAGO" && (
                   <span style={{ fontWeight: '800', color: '#4CAF50', fontSize: '1.1rem', marginLeft: isMobile ? '42px' : '0' }}>
                     {formatarMoeda(pagamento.amount)}
                   </span>
                 )}
              </div>
            ))
          )}
        </div>
      </div>


      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .payment-item:hover, .contract-card:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          transform: scale(1.002);
          transition: all 0.2s ease;
        }
        .contract-card {
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .contract-card:hover {
          box-shadow: 0 6px 12px rgba(255,215,0,0.15);
        }
      `}</style>
    </div>
  );
}