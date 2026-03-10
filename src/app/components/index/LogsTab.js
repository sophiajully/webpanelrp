import React, { useState, useEffect, useCallback } from 'react';
import { Search, History, Check, Copy } from "lucide-react";
import { submitServerAction } from '@/app/actions/appActions'; 

export default function LogsTab({ session, styles, isMobile }) {
  // Estados de dados
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estados dos Filtros (Controlados pelo React)
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const webhookUrl = `https://tysaiw.com/webhook/${session?.user?.companyId}`;

  // 1. FUNÇÃO DE CARREGAMENTO (Usa a Server Action)
  const carregarDados = useCallback(async (newPage = 1) => {
    setLoading(true);
    try {
      const companyId = session?.user?.companyId;
      // Monta o endpoint com os estados atuais de busca e categoria
      const endpoint = `company-logs?companyId=${companyId}&page=${newPage}&limit=10&search=${search}&category=${category}`;
      
      const res = await submitServerAction(endpoint, 'GET');

      if (res && !res.error) {
        setLogs(res.logs || []);
        setMeta(res.meta || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    } finally {
      setLoading(false);
    }
  }, [session, search, category]); // Recria a função se os filtros mudarem

  // 2. TRIGGER DE CARREGAMENTO
  // Dispara sempre que a página monta ou search/category mudam
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      carregarDados(1);
    }, 400); // Debounce para não sobrecarregar o servidor enquanto digita
    return () => clearTimeout(delayDebounce);
  }, [carregarDados]);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Funções de paginação internas
  const mudarPagina = (delta) => {
    const nextPage = (meta.page || 1) + delta;
    if (nextPage > 0 && nextPage <= (meta.totalPages || 1)) {
      carregarDados(nextPage);
    }
  };

  return (
    <div style={{...styles.pageContent, display: 'flex', flexDirection: 'column', gap: '24px'}}>
      
      {/* FILTROS */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.headerIcon}><Search size={18} /></div>
          <h3>Filtros de Auditoria</h3>
        </div>
        <div style={styles.grid2Cols}>
          <div style={styles.inputWrapper}>
            <label style={styles.labelInput}>Pesquisar Ação ou Detalhe</label>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex: Venda, Contratação..." 
              style={styles.baseInput} 
            />
          </div>
          <div style={styles.inputWrapper}>
            <label style={styles.labelInput}>Categoria</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.baseInput}
            >
              <option value="">Todas as Categorias</option>
              <option value="FINANCEIRO">Financeiro</option>
              <option value="RH">Recursos Humanos</option>
              <option value="LOGISTICA">Logística</option>
              <option value="SISTEMA">Sistema</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div style={{...styles.card, flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column'}}>
        <div style={styles.cardHeader}>
           <div style={{display: 'flex', alignItems: 'center', gap: '12px', width: '100%'}}>
             <div style={styles.headerIcon}><History size={18} /></div>
             <h3 style={{margin: 0}}>Histórico de Atividades</h3>
           </div>
        </div>

        <div style={{overflowX: 'auto', marginTop: '20px'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', color: '#fff'}}>
            <thead>
               <tr style={{textAlign: 'left', borderBottom: '1px solid #1c1c26', color: '#4b5563', fontSize: '0.8rem'}}>
                <th style={{padding: '12px 8px'}}>DATA/HORA</th>
                <th style={{padding: '12px 8px'}}>AÇÃO</th>
                <th style={{padding: '12px 8px'}}>DETALHES</th>
                <th style={{padding: '12px 8px'}}>OPERADOR</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{textAlign:'center', padding:'40px'}}>Carregando...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color:'#4b5563'}}>Nenhum registro encontrado.</td></tr>
              ) : (
                logs.map(log => {
                  const cor = log.category === 'FINANCEIRO' ? '#22c55e' : log.category === 'RH' ? '#3b82f6' : log.action.includes('ERRO') ? '#ef4444' : '#d4a91c';
                  return (
                    <tr key={log.id} style={{borderBottom: '1px solid #11111a'}}>
                      <td style={{padding: '14px 8px', fontSize: '0.8rem', color: '#4b5563', fontFamily: 'monospace'}}>
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td style={{padding: '14px 8px'}}>
                        <span style={{background: `${cor}22`, color: cor, padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', border: `1px solid ${cor}44`}}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{padding: '14px 8px', fontSize: '0.85rem', color: '#eee', maxWidth: '400px', lineHeight: '1.4'}}>
                        {log.details}
                      </td>
                      <td style={{padding: '14px 8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#d4a91c'}}>
                        {log.user?.username || 'Sistema'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #1c1c26'}}>
          <span style={{fontSize: '0.85rem', color: '#4b5563', fontWeight: 'bold'}}>
            Página {meta.page || 1} de {meta.totalPages || 1}
          </span>
          <div style={{display: 'flex', gap: '12px'}}>
            <button 
              onClick={() => mudarPagina(-1)} 
              disabled={meta.page <= 1 || loading}
              style={{...styles.baseButton, padding: '8px 16px', opacity: (meta.page <= 1) ? 0.5 : 1}}
            >
              Anterior
            </button>
            <button 
              onClick={() => mudarPagina(1)} 
              disabled={meta.page >= meta.totalPages || loading}
              style={{...styles.baseButton, ...styles.buttonPrimary, padding: '8px 16px', opacity: (meta.page >= meta.totalPages) ? 0.5 : 1}}
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}