import React, { useState } from 'react';
import { User, XCircle, CheckCircle, Copy, Check, ExternalLink } from "lucide-react";

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
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  // URL do perfil baseada no ID da sessão
  const profileUrl = `tysaiw.com/users/${session?.user?.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#11111d', width: '100%', maxWidth: '420px',
        borderRadius: '20px', border: '1px solid #2d2d3d', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
      }}>
        
        {/* Header com gradiente sutil */}
        <div style={{ 
          padding: '20px 25px', 
          background: 'linear-gradient(to right, #1e1e2f, #161625)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid #2d2d3d' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'rgba(255,76,76,0.1)', borderRadius: '8px' }}>
              <User size={20} color="#ff4c4c" />
            </div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>Configurações de Perfil</h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = '#555'}
          >
            <XCircle size={24} />
          </button>
        </div>

        <div style={{ padding: '25px' }}>
          {/* Avatar e Infos Principais */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'linear-gradient(135deg, #8b0000 0%, #ff4c4c 100%)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 15px auto', 
              color: '#fff', 
              fontSize: '2rem', 
              fontWeight: 'bold',
              boxShadow: '0 10px 20px rgba(255,76,76,0.2)',
              border: '4px solid #11111d'
            }}>
              {session?.user?.name?.substring(0, 1).toUpperCase()}
            </div>
            <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '1.2rem' }}>{session?.user?.name}</h4>
            <div style={{ 
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              background: '#1e1e2f',
              fontSize: '0.75rem',
              color: '#ff4c4c',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              border: '1px solid rgba(255,76,76,0.2)'
            }}>
              {session?.user?.isOwner ? "👑 Proprietário" : (session?.user?.role?.name || "Colaborador")}
            </div>
          </div>

          {/* Seção de Compartilhamento */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: '#888', fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ExternalLink size={12} /> LINK PÚBLICO DO PERFIL
            </label>
            <div style={{ 
              display: 'flex', 
              background: '#0d0f14', 
              borderRadius: '10px', 
              padding: '4px',
              border: '1px solid #2d2d3d'
            }}>
              <input 
                readOnly
                value={profileUrl}
                style={{ 
                  background: 'none', border: 'none', color: '#666', 
                  padding: '8px 12px', flex: 1, fontSize: '0.85rem' 
                }}
              />
              <button 
                onClick={handleCopyLink}
                style={{ 
                  background: copied ? '#28a745' : '#1e1e2f', 
                  color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '8px 15px', cursor: 'pointer', display: 'flex', 
                  alignItems: 'center', gap: '8px', transition: 'all 0.3s'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Input do Pombo */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: '#888', fontSize: '0.75rem', marginBottom: '8px', display: 'block' }}>
              ID DO POMBO (CONTATO INTERNO)
            </label>
            <input 
              type="text" 
              placeholder="Ex: 123"
              value={meuPombo}
              onChange={(e) => setMeuPombo(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '10px',
                fontSize: '1.2rem', 
                textAlign: 'center', 
                letterSpacing: '3px',
                color: '#fff',
                background: '#0d0f14',
                border: '1px solid #2d2d3d',
                outline: 'none',
                focus: { borderColor: '#ff4c4c' }
              }}
            />
          </div>

          <button 
            onClick={salvarConfigPombo}
            disabled={loadingPombo}
            style={{ 
              width: '100%',
              background: 'linear-gradient(to right, #8b0000, #ff4c4c)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px', 
              padding: '16px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loadingPombo ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 20px rgba(139,0,0,0.3)',
              transition: 'transform 0.2s, opacity 0.2s',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loadingPombo ? (
              <div className="spinner-small"></div>
            ) : (
              <>
                <CheckCircle size={20} /> 
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}