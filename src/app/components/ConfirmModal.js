"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal() {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState({ show: false, message: "", onConfirm: null });

  useEffect(() => {
    setMounted(true);

    // Criamos a função global window.askConfirm
    window.askConfirm = (message) => {
      return new Promise((resolve) => {
        setConfig({
          show: true,
          message,
          onConfirm: (result) => {
            setConfig({ show: false, message: "", onConfirm: null });
            resolve(result); // Retorna true ou false para o seu script
          }
        });
      });
    };
  }, []);

  if (!mounted || !config.show) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999999,
      backdropFilter: 'blur(4px)',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #3f3f46',
        borderRadius: '16px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'modalFadeIn 0.2s ease-out'
      }}>
        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#450a0a', padding: '8px', borderRadius: '50%' }}>
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Confirmação</h3>
        </div>

        <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
          {config.message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => config.onConfirm(false)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #27272a',
              backgroundColor: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancelar
          </button>
          <button 
            onClick={() => config.onConfirm(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#8b0000', // Seu vermelho SafraLog
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}