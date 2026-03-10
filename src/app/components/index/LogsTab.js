import React, { useState } from 'react';
import { Search, History, Check, Copy } from "lucide-react";
import { useEffect } from 'react';
export default function LogsTab({ session, styles, isMobile }) {
  // Movendo estados específicos para cá
  const [copied, setCopied] = useState(false);
  const webhookUrl = `https://tysaiw.com/webhook/${session?.user?.companyId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
useEffect(() => {

      const timer = setTimeout(() => {
        if (window.app && typeof window.app.carregarLogs === 'function') {
          window.app.carregarLogs();
        }
      }, 50);
      return () => clearTimeout(timer);
  }, []);
  return (
    <div id="tab-logs" style={{...styles.pageContent, display: 'flex', flexDirection: 'column', gap: '24px'}}>
      
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
              id="searchLogInput" 
              placeholder="Ex: Venda, Contratação, Erro..." 
              style={styles.baseInput} 
              onInput={(e) => window.app?.carregarLogs(1, e.target.value)}
            />
          </div>
          <div style={styles.inputWrapper}>
            <label style={styles.labelInput}>Categoria</label>
            <select 
              id="categoriaLogSelect" 
              style={styles.baseInput}
              onChange={(e) => window.app?.carregarLogs(1, document.getElementById('searchLogInput').value)}
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
            {!isMobile && (
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto'}}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                   <span style={{fontSize: '0.65rem', color: '#4b5563', fontWeight: 'bold', textTransform: 'uppercase'}}>Webhook URL</span>
                   <code style={styles.webhookLink}>
                     {webhookUrl.replace(session?.user?.companyId, '••••••••••••')}
                   </code>
                </div>
                <button 
                  onClick={handleCopy} 
                  style={{...styles.btnCopy, backgroundColor: copied ? 'rgba(0, 255, 144, 0.1)' : 'transparent', border: 'none', cursor: 'pointer', color: '#fff'}}
                >
                  {copied ? <Check size={16} color="#00ff90" /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{overflowX: 'auto', marginTop: '20px'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', color: '#fff'}}>
            <thead>
              <tr style={{textAlign: 'left', borderBottom: `1px solid ${styles.divider.backgroundColor || '#1c1c26'}`, color: '#4b5563', fontSize: '0.8rem'}}>
                <th style={{padding: '12px 8px'}}>DATA/HORA</th>
                <th style={{padding: '12px 8px'}}>AÇÃO</th>
                <th style={{padding: '12px 8px'}}>DETALHES</th>
                <th style={{padding: '12px 8px'}}>OPERADOR</th>
              </tr>
            </thead>
            <tbody id="tabelaLogsCorpo">
              {/* O seu window.app.carregarLogs vai preencher aqui via DOM */}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '24px', borderTop: `1px solid ${styles.divider.backgroundColor || '#1c1c26'}`}}>
          <span id="paginacaoInfo" style={{fontSize: '0.85rem', color: '#4b5563', fontWeight: 'bold'}}>
            Página 1 de 1
          </span>
          <div style={{display: 'flex', gap: '12px'}}>
            <button onClick={() => window.app?.mudarPaginaLog(-1)} style={{...styles.baseButton, padding: '8px 16px', fontSize: '0.8rem', opacity: 0.8}}>
              Anterior
            </button>
            <button onClick={() => window.app?.mudarPaginaLog(1)} style={{...styles.baseButton, ...styles.buttonPrimary, padding: '8px 16px', fontSize: '0.8rem'}}>
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}