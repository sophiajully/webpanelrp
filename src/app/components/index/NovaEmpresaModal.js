import React from 'react';

export default function NovaEmpresaModal({ 
  isOpen, 
  onClose, 
  styles, 
  novaEmpresaData, 
  setNovaEmpresaData, 
  criarNovaEmpresa, 
  loadingAction 
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{ 
        background: '#161625', 
        width: '90%', 
        maxWidth: '400px', 
        borderRadius: '16px', 
        border: '1px solid #2d2d3d', 
        padding: '25px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.2rem' }}>
          Nova Propriedade
        </h3>
        
        <div style={styles.inputWrapper}>
          <label style={styles.labelInput}>Nome da Fazenda/Empresa</label>
          <input 
            type="text" 
            placeholder="Ex: Rancho Rio Doce" 
            style={{...styles.baseInput, width: '100%', marginBottom: '15px'}}
            value={novaEmpresaData.name || ""}
            onChange={(e) => setNovaEmpresaData({...novaEmpresaData, name: e.target.value})}
          />
        </div>

        <div style={styles.inputWrapper}>
          <label style={styles.labelInput}>Cor de Identidade</label>
          <input 
            type="color" 
            style={{
              ...styles.colorPicker, 
              marginBottom: '20px', 
              width: '100%', 
              height: '40px', 
              cursor: 'pointer'
            }}
            value={novaEmpresaData.colorPrimary || "#d4a91c"}
            onChange={(e) => setNovaEmpresaData({...novaEmpresaData, colorPrimary: e.target.value})}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={onClose}
            style={{...styles.baseButton, ...styles.buttonOutline, flex: 1}}
          >
            Cancelar
          </button>
          <button 
            onClick={criarNovaEmpresa}
            disabled={loadingAction || !novaEmpresaData.name}
            style={{
              ...styles.baseButton, 
              ...styles.buttonPrimary, 
              flex: 2,
              opacity: (loadingAction || !novaEmpresaData.name) ? 0.6 : 1
            }}
          >
            {loadingAction ? "Criando..." : "Fundar Empresa"}
          </button>
        </div>
      </div>
    </div>
  );
}