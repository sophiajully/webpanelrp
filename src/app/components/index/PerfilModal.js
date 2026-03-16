"use client";
import React, { useState, useEffect } from 'react';
import { 
  User, XCircle, Check, Copy, ShieldCheck, 
  Fingerprint, Smartphone, AlertCircle, Loader2, ExternalLink
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function PerfilModal({ 
  isOpen, onClose, session, meuPombo, setMeuPombo, salvarConfigPombo, loadingPombo 
}) {
  const { update } = useSession(); // Para atualizar a sessão após ativar 2FA
  const [copied, setCopied] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [setupData, setSetupData] = useState({ qrCode: '', secret: '' });
  const [verifyCode, setVerifyCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const profileUrl = `tysaiw.com/users/${session?.user?.id}`

  // Limpa o erro ao abrir/fechar o modal
  useEffect(() => {
    if (!isOpen) {
      setError("");
      setShow2FA(false);
      setVerifyCode("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Inicia o Setup (Gera Secret e QR Code)
  const iniciarSetup2FA = async () => {
    setIsActivating(true);
    setError("");
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: session?.user?.name })
      });
      
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Falha ao gerar setup");

      // GARANTE QUE OS DADOS EXISTAM ANTES DE MUDAR A TELA
      if (data.qrCode && data.secret) {
        setSetupData({ qrCode: data.qrCode, secret: data.secret });
        setShow2FA(true);
      } else {
        throw new Error("Dados de setup incompletos recebidos do servidor");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsActivating(false);
    }
  };

  // 2. Verifica o código e salva no Banco de Dados (Prisma)
  const confirmarEAtivar = async () => {
    // Validação básica no front antes de enviar
    if (verifyCode.length !== 6) {
        setError("O código deve ter 6 dígitos");
        return;
    }
    
    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: verifyCode, 
          secret: setupData.secret 
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Código inválido");

      // Sucesso! Atualiza a sessão local
      await update();

      alert("Segurança V2E ativada com sucesso!");
      setShow2FA(false);
      setVerifyCode("");
      onClose(); // Fecha o modal após o sucesso
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>
        
        {/* HEADER */}
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={modalStyles.iconBadge}><User size={20} color="#ff4c4c" /></div>
            <h3 style={modalStyles.headerTitle}>Configurações de Perfil</h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><XCircle size={24} /></button>
        </div>

        <div style={modalStyles.scrollArea}>
          
          {/* AVATAR E INFO */}
          <div style={modalStyles.profileHeader}>
            <div style={modalStyles.avatar}>
              {session?.user?.name?.substring(0, 1).toUpperCase()}
            </div>
            <h4 style={modalStyles.userName}>{session?.user?.name}</h4>
            <div style={modalStyles.roleBadge}>
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

         

          {error && (
            <div style={modalStyles.errorBox}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* SEÇÃO V2E (DINÂMICA) */}
          <div style={modalStyles.section}>
            <label style={modalStyles.sectionLabel}>
              <ShieldCheck size={14} /> SEGURANÇA DA CONTA
            </label>
            
            {!show2FA ? (
              <div style={modalStyles.v2eStatusCard}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff' }}>Verificação em Duas Etapas</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: session?.user?.twoFactorEnabled ? '#28a745' : '#888' }}>
                    {session?.user?.twoFactorEnabled ? "● ATIVADO E PROTEGIDO" : "○ DESATIVADO"}
                  </p>
                </div>
                {!session?.user?.twoFactorEnabled && (
                  <button 
                    onClick={iniciarSetup2FA} 
                    disabled={isActivating} 
                    style={modalStyles.btnSetup}
                  >
                    {isActivating ? <Loader2 className="spinner" size={16} /> : "CONFIGURAR"}
                  </button>
                )}
              </div>
            ) : (
              <div style={modalStyles.setupContainer} className="fade-in">
                <p style={modalStyles.setupText}>Escaneie o QR Code no seu App de Autenticação (Google Authenticator / Authy):</p>
                
                <div style={modalStyles.qrWrapper}>
                  {setupData.qrCode ? (
                    <img src={setupData.qrCode} alt="QR Code" style={{ width: '100%', display: 'block' }} />
                  ) : (
                    <div style={modalStyles.qrPlaceholder}><Loader2 className="spinner" /></div>
                  )}
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label style={modalStyles.miniLabel}>OU INSIRA A CHAVE MANUALMENTE:</label>
                  <div style={modalStyles.manualBox}>
                    <code style={{ fontSize: '0.8rem' }}>{setupData.secret || "Gerando..."}</code>
                    <button onClick={() => handleCopy(setupData.secret)} style={modalStyles.copyBtn}>
                      {copied ? <Check size={14} color="#28a745" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '25px' }}>
                  <label style={modalStyles.miniLabel}>DIGITE O CÓDIGO DE 6 DÍGITOS:</label>
                  <input 
                    type="text" 
                    maxLength="6" 
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000 000"
                    style={modalStyles.codeInput}
                  />
                  <button 
                    style={modalStyles.btnPrimary} 
                    onClick={confirmarEAtivar}
                    disabled={isVerifying || verifyCode.length < 6}
                  >
                    {isVerifying ? <Loader2 className="spinner" size={18} /> : "CONFIRMAR E ATIVAR"}
                  </button>
                  <button onClick={() => setShow2FA(false)} style={modalStyles.cancelBtn}>CANCELAR SETUP</button>
                </div>
              </div>
            )}
          </div>

          {/* ID DO POMBO */}
          <div style={{ marginTop: '20px' }}>
             <label style={modalStyles.sectionLabel}>POMBO CORREIO</label>
             <div style={modalStyles.pomboGroup}>
                <Smartphone size={18} color="#555" />
                <input 
                  type="text" 
                  value={meuPombo} 
                  onChange={(e) => setMeuPombo(e.target.value)} 
                  style={modalStyles.simpleInput} 
                  placeholder="Ex: POMBO-X123"
                />
             </div>
          </div>

          <button 
            onClick={salvarConfigPombo} 
            disabled={loadingPombo} 
            style={{...modalStyles.btnPrimary, background: '#1e1e2f', marginTop: '20px', border: '1px solid #2d2d3d'}}
          >
            {loadingPombo ? <Loader2 className="spinner" size={18} /> : "SALVAR ALTERAÇÕES"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '15px' },
  card: { background: '#0a0a0f', width: '100%', maxWidth: '440px', borderRadius: '16px', border: '1px solid #1c1c28', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' },
  header: { padding: '18px 20px', background: '#11111d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1c1c28' },
  headerTitle: { margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.5px' },
  scrollArea: { padding: '20px', maxHeight: '85vh', overflowY: 'auto' },
  profileHeader: { textAlign: 'center', marginBottom: '25px' },
  avatar: { width: '70px', height: '70px', background: 'linear-gradient(135deg, #8b0000, #ff4c4c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#fff', fontSize: '1.8rem', fontWeight: 'bold', border: '3px solid #1c1c28' },
  userName: { margin: '0 0 5px 0', color: '#fff', fontSize: '1.1rem' },
  roleBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: 'rgba(212,169,28,0.1)', fontSize: '0.65rem', color: '#d4a91c', fontWeight: '900', border: '1px solid rgba(212,169,28,0.2)' },
  section: { background: '#0d0d14', padding: '15px', borderRadius: '12px', border: '1px solid #1c1c28' },
  sectionLabel: { color: '#555', fontSize: '0.65rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', letterSpacing: '1px' },
  v2eStatusCard: { display: 'flex', alignItems: 'center', background: '#050507', padding: '12px', borderRadius: '10px', border: '1px solid #1c1c28' },
  btnSetup: { background: '#d4a91c', color: '#000', border: 'none', borderRadius: '6px', padding: '8px 15px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer' },
  setupContainer: { padding: '10px 0' },
  setupText: { color: '#888', fontSize: '0.75rem', marginBottom: '15px', lineHeight: '1.4' },
  qrWrapper: { background: '#fff', padding: '10px', borderRadius: '10px', width: '150px', margin: '0 auto', border: '4px solid #fff' },
  qrPlaceholder: { height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' },
  miniLabel: { color: '#444', fontSize: '0.6rem', display: 'block', marginBottom: '6px', fontWeight: '900' },
  manualBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#000', padding: '10px 15px', borderRadius: '8px', border: '1px solid #1c1c28', color: '#d4a91c' },
  copyBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', transition: 'color 0.2s' },
  codeInput: { width: '100%', padding: '15px', background: '#000', border: '1px solid #2d2d3d', borderRadius: '10px', color: '#fff', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '6px', marginBottom: '15px', outline: 'none' },
  btnPrimary: { width: '100%', background: 'linear-gradient(to right, #8b0000, #ff4c4c)', color: '#fff', border: 'none', borderRadius: '10px', padding: '15px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { background: 'none', border: 'none', color: '#555', fontSize: '0.7rem', marginTop: '15px', width: '100%', cursor: 'pointer', fontWeight: 'bold' },
  pomboGroup: { display: 'flex', alignItems: 'center', gap: '10px', background: '#050507', padding: '4px 12px', borderRadius: '10px', border: '1px solid #1c1c28' },
  simpleInput: { flex: 1, padding: '12px 0', background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem' },
  errorBox: { background: 'rgba(255,76,76,0.1)', color: '#ff4c4c', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', marginBottom: '15px', border: '1px solid rgba(255,76,76,0.2)', display: 'flex', alignItems: 'center', gap: '8px' },
  closeBtn: { background: 'none', border: 'none', color: '#333', cursor: 'pointer', transition: 'color 0.2s' },
  iconBadge: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: 'rgba(255,76,76,0.1)', borderRadius: '8px' }
};