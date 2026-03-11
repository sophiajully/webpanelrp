"use client";

import React, { useState, useEffect } from 'react';
import { submitServerAction } from '@/app/actions/appActions';
import { Wallet, PlusCircle, CheckCircle, Clock, User, RefreshCw } from "lucide-react";

export default function PagamentosTab({ session, styles, isMobile }) {
  const isOwner = session?.user?.isOwner || session?.user?.role?.isOwner || session?.user?.role?.canAdmin;
  const primaryColor = session?.user?.company?.colorPrimary || '#ff4c4c';

  const [pagamentos, setPagamentos] = useState([]);
  const [acao, setAcao] = useState("");
  const [valores, setValores] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPagamentos = async () => {
    if (fetching) return; // Evita cliques múltiplos enquanto já está carregando
    setFetching(true);
    try {
      const res = await submitServerAction('/api/pagamentos', 'GET');
      if (res && !res.error) {
        setPagamentos(res);
      }
    } catch (error) {
      console.error("Erro ao recarregar:", error);
    } finally {
      // Pequeno timeout opcional para a animação não ser "rápida demais" e parecer que nem rodou
      setTimeout(() => setFetching(false), 600);
    }
  };

  useEffect(() => {
    fetchPagamentos();
  }, []);

  // ... (registrarAcao e pagarAcao permanecem iguais)
  const registrarAcao = async () => {
    if (!acao) return;
    setLoading(true);
    const res = await submitServerAction('/api/pagamentos', 'POST', { action: acao });
    if (!res?.error) {
      setAcao("");
      fetchPagamentos();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const pagarAcao = async (id) => {
    const valorDefinido = valores[id];
    if (!valorDefinido || valorDefinido <= 0) return;
    setLoading(true);
    const res = await submitServerAction('/api/pagamentos', 'PUT', { paymentId: id, amount: valorDefinido });
    if (!res?.error) {
      setValores(prev => ({ ...prev, [id]: "" }));
      fetchPagamentos();
    }
    setLoading(false);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valor);
  };

  const localStyles = {
    container: { padding: '20px', width: '100%', color: '#fff', display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '20px', width: '100%' },
    input: { background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none', width: '100%' },
    buttonPrimary: { background: primaryColor, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'all 0.2s ease', whiteSpace: 'nowrap' },
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

  return (
    <div style={localStyles.container}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: `${primaryColor}22`, padding: '10px', borderRadius: '12px' }}>
            <Wallet size={24} style={{ color: primaryColor }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Gestão Financeira</h2>
        </div>
        
        {/* BOTÃO DE RELOAD CORRIGIDO */}
        <button 
          onClick={fetchPagamentos} 
          disabled={fetching}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: 'none', 
            color: fetching ? primaryColor : '#aaa', 
            cursor: fetching ? 'not-allowed' : 'pointer', 
            padding: '10px', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
        >
          <RefreshCw 
            size={20} 
            style={{ 
              animation: fetching ? 'spin 1s linear infinite' : 'none' 
            }} 
          />
        </button>
      </div>

      {/* REGISTRO (Membro) */}
      {!isOwner && (
        <div style={localStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <PlusCircle size={18} style={{ color: primaryColor }} />
            <span style={{ fontWeight: '600', fontSize: '0.95rem', opacity: 0.9 }}>Registrar novo serviço realizado</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '12px' }}>
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

      {/* LISTAGEM */}
      <div style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', width: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h4 style={{ margin: 0, color: '#666', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isOwner ? "Fluxo Completo de Pagamentos" : "Seu Histórico de Ganhos"}
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
              <div key={pagamento.id} className="payment-item" style={{ background: pagamento.status === "PAGO" ? 'transparent' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', margin: '5px 0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 {/* ... (O resto do seu mapeamento de itens aqui) ... */}
                 <div style={{ flex: '1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={14} style={{ color: primaryColor }} />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{isOwner ? pagamento.user?.username : "Minha Ação"}</span>
                        <div style={localStyles.badge(pagamento.status)}>{pagamento.status === 'PAGO' ? <CheckCircle size={12} /> : <Clock size={12} />} {pagamento.status}</div>
                    </div>
                    <p style={{ margin: '0 0 5px 42px', fontSize: '1.05rem', color: '#ddd' }}>{pagamento.action}</p>
                 </div>
                 {/* ... (Ações de pagamento aqui) ... */}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ESTILOS CSS INLINE PARA A ANIMAÇÃO */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .payment-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          transform: scale(1.002);
        }
      `}</style>
    </div>
  );
}