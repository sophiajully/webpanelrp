"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Loader2, X } from "lucide-react";

export default function ToastContainer() {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setMounted(true);

    // Função global que adiciona um novo toast à lista
    window.showToast = (message, type = "success") => {
      const id = Math.random().toString(36).substr(2, 9);
      
      // Adiciona o novo toast no início ou fim da lista
      setToasts((prev) => [...prev, { id, message, type }]);

      // Se não for loading, remove após 3 segundos
      if (type !== "loading") {
        setTimeout(() => {
          removeToast(id);
        }, 3000);
      }
    };

    window.removeToast = (id) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!mounted) return null;

  const config = {
    success: { icon: <CheckCircle size={18} color="#4ade80" />, border: "#166534", label: "Sucesso" },
    error: { icon: <XCircle size={18} color="#ef4444" />, border: "#991b1b", label: "Erro" },
    loading: { icon: <Loader2 size={18} color="#a1a1aa" className="animate-spin" />, border: "#3f3f46", label: "Processando" }
  };

  return createPortal(
    <div 
      id="toast-container"
      style={{ 
        position: 'fixed', 
        bottom: '24px', 
        right: '24px', 
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column-reverse', // Faz os novos aparecerem embaixo ou em cima conforme preferir
        gap: '10px',
        pointerEvents: 'none' // Permite clicar no que está atrás se não houver toast
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .toast-item { pointer-events: auto; animation: toastSlideIn 0.3s ease-out forwards; }
      `}</style>

      {toasts.map((toast) => {
        const current = config[toast.type] || config.success;
        return (
          <div 
            key={toast.id}
            className="toast-item"
            style={{ 
              backgroundColor: '#0a0a0a',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '10px',
              border: `1px solid ${current.border}`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              minWidth: '280px',
              maxWidth: '350px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: 'sans-serif'
            }}
          >
            <div>{current.icon}</div>
            <div style={{ flex: 1 }}>
               <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)} 
              style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: '4px' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}