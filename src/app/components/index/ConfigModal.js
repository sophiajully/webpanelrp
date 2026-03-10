import React from 'react';
import { Settings } from "lucide-react";

export default function ConfigModal({ 
  isOpen, 
  onClose, 
  session, 
  styles, 
  handleSalvarConfig 
}) {
  if (!isOpen) return null;

  const isOwner = session?.user?.isOwner === true;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalBody}>
        <div style={styles.cardHeader}>
          <div style={styles.headerIcon}><Settings size={18} /></div>
          <h3>Preferências do Sistema</h3>
        </div>
        
        <div style={styles.modalForm}>
          {/* NOME DA EMPRESA */}
          <div style={styles.inputWrapper}>
            <label style={styles.labelInput}>Nome da Empresa</label>
            <input 
              type="text" 
              id="nomeEmpresaInput" 
              style={styles.baseInput} 
              defaultValue={session?.user?.companyName || ""} 
              disabled={!isOwner} 
            />
          </div>
          
          {/* WEBHOOK VENDAS */}
          <div style={styles.inputWrapper}>
            <label style={styles.labelInput}>Webhook Encomendas</label>
            <input 
              type="text" 
              id="webhookVendasInput" 
              style={styles.baseInput} 
              defaultValue={session?.user?.company?.webhookVendas || ""} 
              disabled={!isOwner} 
            />
          </div>

          {/* WEBHOOK LOGS */}
          <div style={styles.inputWrapper}>
            <label style={styles.labelInput}>Webhook Logs:</label>
            <input 
              type="text" 
              id="webhookLogsInput" 
              placeholder="URL para registros internos" 
              style={styles.baseInput} 
              defaultValue={session?.user?.company?.webhookLogs || ""} 
              disabled={!isOwner} 
            />
          </div>

          {/* CORES */}
          <div style={styles.grid2Cols}>
            <div style={styles.inputWrapper}>
              <label style={styles.labelInput}>Cor Principal</label>
              <input 
                type="color" 
                id="colorPrimary" 
                defaultValue={session?.user?.colorPrimary || "#d4a91c"} 
                style={styles.colorPicker} 
                disabled={!isOwner} 
              />
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.labelInput}>Cor Accent</label>
              <input 
                type="color" 
                id="colorAccent" 
                defaultValue={session?.user?.colorAccent || "#ff4c4c"} 
                style={styles.colorPicker} 
                disabled={!isOwner} 
              />
            </div>
          </div>

          {/* CONFIGURAÇÕES DE STATUS */}
          <div style={{...styles.grid2Cols, gap: '20px', marginTop: '10px'}}>
            <div style={styles.switchWrapper}>
              <label style={styles.labelInput}>Recrutamento</label>
              <div style={styles.switchContainer}>
                <input 
                  type="checkbox" 
                  id="enableHireRequestInput" 
                  defaultChecked={session?.user?.enableHireRequest} 
                  style={styles.checkboxHidden}
                />
                <label htmlFor="enableHireRequestInput" style={styles.switchLabel}>
                  Permitir pedidos de entrada
                </label>
              </div>
            </div>

            <div style={styles.switchWrapper}>
              <label style={styles.labelInput}>Mercadão</label>
              <div style={styles.switchContainer}>
                <input 
                  type="checkbox" 
                  id="enableMarketInput" 
                  defaultChecked={session?.user?.enableMarket} 
                  style={styles.checkboxHidden}
                />
                <label htmlFor="enableMarketInput" style={styles.switchLabel}>
                  Aparecer no Mercadão
                </label>
              </div>
            </div>
          </div>

          {/* BOTÕES */}
          <div style={{display: 'flex', flexDirection: 'row', gap: '15px', marginTop: '15px'}}>
            <button 
              style={{...styles.baseButton, ...styles.buttonPrimary, flex: 1}} 
              onClick={handleSalvarConfig} 
              disabled={!isOwner}
            >
              Salvar Alterações
            </button>
            <button 
              style={{...styles.baseButton, ...styles.buttonOutline, flex: 1}} 
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}