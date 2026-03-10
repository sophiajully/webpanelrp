import React, { useState } from 'react';
import { Hammer, Calculator, Trash2, Package, X } from "lucide-react";

export default function RegistrarTab({ 
  styles, 
  craftList, 
  producaoQtds, 
  handleQtdChange, 
  refreshData 
}) {
  // Estado do Modal movido para dentro do componente
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div id="tab-registrar" style={{...styles.pageContent, display: 'flex', flexDirection: 'column', gap: '20px'}}>
      
      {/* Botão para abrir o modal */}
      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          style={{...styles.baseButton, ...styles.buttonPrimary}} 
          onClick={() => setIsModalOpen(true)}
        >
          <Hammer size={18} /> Adicionar Nova Receita
        </button>
      </div>

      {/* Card: Planejamento de Produção */}
      <div style={{...styles.card, maxWidth: '800px', width: '100%', margin: '0 auto'}}>
        <div style={styles.cardHeader}>
          <div style={styles.headerIcon}><Calculator size={18} /></div>
          <h3>Planejamento de Produção</h3>
        </div>
        <p style={{fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px'}}>
          Defina as quantidades para calcular os materiais necessários automaticamente.
        </p>
        
        <div style={styles.producaoGrid}>
          {craftList.map((item) => (
            <div key={item.id} style={styles.producaoItem}>
              <div style={{flex: '1 1 min-content', minWidth: '120px'}}>
                <div style={styles.producaoItemTitle}>{item.name}</div>
                <div style={styles.producaoItemMeta}>Unidade base: {item.unit || 'un'}</div>
              </div>
              
              <div style={styles.producaoItemActions}>
                <input 
                  type="number" 
                  placeholder="0"
                  value={producaoQtds[item.id] || ""} 
                  onChange={(e) => handleQtdChange(item.id, e.target.value)}
                  style={styles.producaoInput} 
                />
                <button onClick={() => window.app?.removerReceita(item.id)} style={{...styles.btnActionDelete, border: 'none', background: 'none', cursor: 'pointer'}}>
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '24px', width: '100%'}} 
          onClick={() => window.app?.calcularMateriais(craftList, producaoQtds)}
        >
          <Calculator size={18} /> Calcular Totais de Coleta
        </button>
      </div>

      {/* Card: Lista de Materiais (Resultado) */}
      <div id="materiaisResultado" style={{...styles.card, maxWidth: '800px', width: '100%', margin: '0 auto'}}>
        <div style={styles.cardHeader}>
          <div style={{...styles.headerIcon, background: 'rgba(0,255,144,0.1)', color: '#00ff90'}}><Package size={18} /></div>
          <h3 style={{color: '#00ff90'}}>Lista de Materiais</h3>
        </div>
        <div id="listaInsumosSomados" style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {/* Preenchido pelo window.app.calcularMateriais */}
        </div>
      </div>

      {/* MODAL DE CONFIGURAÇÃO */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <div style={styles.headerIcon}><Hammer size={18} /></div>
                <h3 style={{margin: 0}}>Configuração de Receita</h3>
              </div>
              <button style={{...styles.btnCloseModal, border: 'none', background: 'none', cursor: 'pointer', color: '#fff'}} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.gridResponsive}>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Nome do Produto</label>
                <input type="text" id="craftNome" placeholder="Ex: Carne de Sol" style={styles.baseInput} />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Qtd. Produzida</label>
                <input type="number" id="unidades" placeholder="1" style={styles.baseInput} />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.labelInput}>Preço Final</label>
                <input type="number" id="price" placeholder="$ 0.00" style={styles.baseInput} />
              </div>
            </div>

            <div style={{marginTop: '24px'}}>
              <h4 style={{fontSize: '0.85rem', color: '#fff', marginBottom: '12px'}}>Insumos Necessários</h4>
              <div id="listaInsumosDinamicos" style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px'}}></div>
              <button 
                style={{...styles.baseButton, ...styles.buttonOutline, fontSize: '0.8rem', width: 'fit-content'}} 
                onClick={() => window.app?.adicionarCampoInsumo()}
              >
                + Novo Insumo
              </button>
            </div>

            <button 
              style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '32px', width: '100%'}} 
              onClick={() => {
                window.app?.registrarCraft();
                if(refreshData) refreshData();
                setIsModalOpen(false);
              }}
            >
              Registrar no Catálogo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}