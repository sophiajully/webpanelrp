import React from 'react';
import { User, XCircle, CheckCircle } from "lucide-react";

export default function PerfilModal({ 
  isOpen, 
  onClose, 
  session, 
  styles, 
  meuPombo, 
  setMeuPombo, 
  salvarConfigPombo, 
  loadingPombo 
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#161625', width: '90%', maxWidth: '400px',
        borderRadius: '16px', border: '1px solid #2d2d3d', overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        
        {/* Header do Modal */}
        <div style={{ 
          padding: '20px', 
          background: '#1e1e2f', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid #2d2d3d' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--cor-primaria)" />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Meu Perfil</h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '25px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: 'var(--cor-primaria-bg)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 10px auto', 
              color: 'var(--cor-primaria)', 
              fontSize: '1.5rem', 
              fontWeight: 'bold' 
            }}>
              {session?.user?.name?.substring(0, 1).toUpperCase()}
            </div>
            <h4 style={{ margin: 0, color: '#fff' }}>{session?.user?.name}</h4>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              {session?.user?.isOwner ? "Proprietário" : (session?.user?.role?.name || "Colaborador")}
            </span>
          </div>

          <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>
            ID DO POMBO (CONTACTO)
          </label>
          <input 
            type="text" 
            placeholder="Ex: 123"
            value={meuPombo}
            onChange={(e) => setMeuPombo(e.target.value)}
            style={{ 
              ...styles.baseInput, // Usando o estilo base que já tens
              width: '100%', 
              padding: '12px', 
              marginBottom: '20px', 
              fontSize: '1.2rem', 
              textAlign: 'center', 
              letterSpacing: '2px',
              color: '#fff',
              background: '#0d0f14'
            }}
          />

          <button 
            onClick={salvarConfigPombo}
            disabled={loadingPombo}
            style={{ 
              ...styles.buttonPrimary, 
              width: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px', 
              padding: '12px',
              cursor: loadingPombo ? 'not-allowed' : 'pointer',
              opacity: loadingPombo ? 0.7 : 1
            }}
          >
            {loadingPombo ? (
              "A guardar..."
            ) : (
              <>
                <CheckCircle size={18} /> 
                Guardar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}