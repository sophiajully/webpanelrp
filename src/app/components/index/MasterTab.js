import React from 'react';
import { Key, ClipboardList, Trash2 } from "lucide-react";

export default function MasterTab({ 
  session, 
  styles, 
  newKeyDays, 
  setNewKeyDays, 
  gerarNovaKey, 
  loadingKey, 
  keyList = [], 
  excluirKey 
}) {
  // Segurança extra: se não for o admin, nem renderiza o conteúdo
  if (session?.user?.name !== "admin") return null;

  return (
    <div id="tab-master" style={{...styles.pageContent, display: 'block'}}>
      
      {/* CARD: GERADOR DE LICENÇAS */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{...styles.headerIcon, background: 'rgba(255, 76, 76, 0.1)', color: '#ff4c4c'}}>
            <Key size={18} />
          </div>
          <h3>Gerador de Licenças</h3>
        </div>
        
        <div style={styles.masterActionRow}>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <label style={styles.labelInput}>Validade (Dias)</label>
            <input 
              type="number" 
              value={newKeyDays} 
              onChange={(e) => setNewKeyDays(e.target.value)}
              style={styles.baseInput}
            />
          </div>
          <button 
            style={{...styles.baseButton, ...styles.buttonPrimary, padding: '0 25px', height: '45px', marginTop: 'auto'}} 
            onClick={gerarNovaKey} 
            disabled={loadingKey}
          >
            {loadingKey ? "Gerando..." : "Gerar Access Key"}
          </button>
        </div>
      </div>

      {/* CARD: LISTA DE KEYS NO BANCO */}
      <div style={{...styles.card, marginTop: '24px'}}>
        <div style={styles.cardHeader}>
          <div style={styles.headerIcon}><ClipboardList size={18} /></div>
          <h3>Keys no Banco</h3>
        </div>
        
        <div style={{...styles.keyList, display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px'}}>
          {keyList.length === 0 && (
            <p style={{color: '#666', textAlign: 'center', padding: '20px'}}>Nenhuma chave gerada.</p>
          )}
          
          {keyList.map((k) => (
            <div key={k.id} style={{
              ...styles.keyItem, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'rgba(0,0,0,0.2)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #2d2d2d'
            }}>
              <code style={{
                fontFamily: 'monospace',
                color: 'var(--cor-primaria, #d4a91c)',
                fontSize: '1rem',
                letterSpacing: '1px'
              }}>{k.key}</code>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: k.used ? '#ff4c4c' : '#00ff90',
                  background: k.used ? 'rgba(255,76,76,0.1)' : 'rgba(0,255,144,0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {k.used ? "USADA" : `${k.days} DIAS`}
                </span>
                <button 
                  onClick={() => excluirKey(k.id)} 
                  style={{...styles.btnActionDelete, background: 'none', border: 'none', cursor: 'pointer', color: '#ff4c4c'}}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}