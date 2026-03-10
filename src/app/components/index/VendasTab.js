import React from 'react';
import { ShoppingCart, ClipboardList, X, FileText } from "lucide-react";
import { useEffect } from 'react';

export default function VendasTab({ styles, states, actions }) {

  const { isModalVendaOpen } = states;
  const { setIsModalVendaOpen } = actions;
useEffect(() => {
    if (isModalVendaOpen) {
      // Pequeno delay para garantir que o React terminou de colocar o modal no DOM
      const timer = setTimeout(() => {
        if (window.app && typeof window.app.carregarCrafts === 'function') {
          window.app.carregarCrafts();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isModalVendaOpen]);

  return (
    <div id="tab-vendas" style={styles.pageContent}>
      
      {/* Botão para abrir o processo de venda */}
      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button 
          style={{...styles.baseButton, ...styles.buttonPrimary}} 
          onClick={() => setIsModalVendaOpen(true)}
        >
          <ShoppingCart size={18} /> Nova Encomenda
        </button>
      </div>

      {/* Lista de Movimentações */}
      <div style={{...styles.card, maxWidth: '800px', width: '100%', margin: '0 auto'}}>
        <div style={styles.cardHeader}>
          <div style={styles.headerIcon}><ClipboardList size={18} /></div>
          <h3>Histórico de Vendas</h3>
        </div>
        <div 
          id="listaPedidosGeral" 
          style={{...styles.producaoGrid, minHeight: '100px', maxHeight: '400px', overflowY: 'auto'}}
        >
          Carregando registros...
        </div>
      </div>

      {/* MODAL UNIFICADO: NOVA ENCOMENDA E RECIBO */}
      {isModalVendaOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '900px'}}>
            
            <div style={styles.modalHeader}>
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <div style={styles.headerIcon}><ShoppingCart size={18} /></div>
                <h3 style={{margin: 0}}>Gerar Nova Encomenda</h3>
              </div>
              <button style={styles.btnCloseModal} onClick={() => setIsModalVendaOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
              
              {/* Coluna Esquerda: Cadastro e Seleção */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div style={{...styles.card, background: '#161922', padding: '20px'}}>
                  <h4 style={{fontSize: '0.8rem', color: 'var(--cor-primaria)', marginBottom: '15px', textTransform: 'uppercase'}}>Dados do Cliente</h4>
                  <div style={styles.gridResponsive}>
                    <div style={styles.inputWrapper}>
                      <label style={styles.labelInput}>Cliente</label>
                      <input type="text" id="clienteNome" placeholder="Nome Completo" style={styles.baseInput} />
                    </div>
                    <div style={styles.inputWrapper}>
                      <label style={styles.labelInput}>Contato</label>
                      <input type="text" id="clientePombo" placeholder="ID/Telefone" style={styles.baseInput} />
                    </div>
                  </div>
                </div>

                <div style={{...styles.card, background: '#161922', padding: '20px'}}>
                  <h4 style={{fontSize: '0.8rem', color: 'var(--cor-primaria)', marginBottom: '15px', textTransform: 'uppercase'}}>Produtos</h4>
                  <div style={styles.gridResponsive}>
                    <div style={styles.inputWrapper}>
                      <label style={styles.labelInput}>Produto</label>
                      <select id="produtoSelect" style={styles.baseInput}></select>
                    </div>
                    <div style={styles.inputWrapper}>
                      <label style={styles.labelInput}>Quantidade</label>
                      <input type="number" id="quantidadeItem" placeholder="0" style={styles.baseInput} />
                    </div>
                  </div>
                  <button 
                    style={{...styles.baseButton, ...styles.buttonPrimary, marginTop: '20px', width: '100%'}} 
                    onClick={() => window.app?.adicionarItem()}
                  >
                    + Adicionar Item
                  </button>
                </div>
              </div>

              {/* Coluna Direita: Resumo e Finalização */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div style={{...styles.card, background: '#161922', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <h4 style={{fontSize: '0.8rem', color: 'var(--cor-primaria)', marginBottom: '15px', textTransform: 'uppercase'}}>Resumo do Pedido</h4>
                  <div 
                    id="listaEncomenda" 
                    style={{flex: 1, overflowY: 'auto', minHeight: '150px', marginBottom: '20px'}}
                  >
                    {/* Itens via scripts.js aparecem aqui */}
                  </div>
                  
                  <button 
                    onClick={() => window.app?.calcularEncomenda()} 
                    style={{...styles.baseButton, ...styles.buttonOutline, width: '100%', borderColor: 'var(--cor-primaria)', color: 'var(--cor-primaria)'}}
                  >
                    <FileText size={18} /> Finalizar e Gerar Recibo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}