"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; 
import Image from "next/image";
import { Lock, User, ShieldCheck, Fingerprint, ArrowLeft, Loader2 } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "", code: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 
  const [step, setStep] = useState(1); // 1: Credenciais, 2: V2E
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username: formData.username,
      password: formData.password,
      code: formData.code, // Enviamos o código (vazio no passo 1)
      redirect: false, 
    });

    if (result?.error) {
      // CAPTURA O ERRO QUE DEFINIMOS NA API
      if (result.error === "V2E_REQUIRED") {
        setStep(2);
        setLoading(false);
      } else {
        setError(result.error);
        setLoading(false);
      }
    } else {
      router.push("/"); 
      router.refresh(); 
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgOverlay} />
      
      <div style={{
          ...styles.card,
          width: isMobile ? '92%' : '420px',
        }}>

        <form onSubmit={handleLogin} style={{ padding: isMobile ? '30px 20px' : '50px 40px' }}>
          
          {/* HEADER */}
          <div style={styles.header}>
            <div style={styles.logoWrapper}>
              <Image 
                src="/isotipo.png" 
                alt="SafraLog Logo" 
                width={step === 1 ? 85 : 60} 
                height={step === 1 ? 85 : 60} 
                style={styles.logo}
                priority
              />
            </div>
            <h2 style={styles.title}>SAFRA<span style={{color: '#d4a91c'}}>LOG</span></h2>
            <div style={styles.divider}>
              <div style={styles.line} />
              <ShieldCheck size={14} color="#d4a91c" />
              <div style={styles.line} />
            </div>
            <p style={styles.subtitle}>
              {step === 1 ? "SISTEMA DE GESTÃO DE FRONTEIRA" : "VERIFICAÇÃO DE DUAS ETAPAS"}
            </p>
          </div>

          {error && <div style={styles.errorBadge}>{error}</div>}

          {/* PASSO 1: USUÁRIO E SENHA */}
          {step === 1 && (
            <div className="fade-in">
              <div style={styles.inputGroup}>
                <label style={styles.label}><User size={12} /> USUÁRIO</label>
                <input 
                  type="text" 
                  placeholder="Seu nome" 
                  required 
                  style={styles.input}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}><Lock size={12} /> SENHA</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  style={styles.input}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* PASSO 2: CÓDIGO V2E */}
          {step === 2 && (
            <div className="scale-up">
              <div style={styles.inputGroup}>
                <label style={styles.label}><Fingerprint size={12} /> CÓDIGO DE AUTENTICAÇÃO</label>
                <input 
                  type="text" 
                  placeholder="000 000" 
                  maxLength={6}
                  required 
                  autoFocus
                  style={{...styles.input, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px'}}
                  onChange={e => setFormData({...formData, code: e.target.value.replace(/\D/g, '')})}
                />
                <p style={styles.helperText}>Abra o app de autenticação no seu celular para ver o código.</p>
              </div>
              
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                style={styles.backBtn}
              >
                <ArrowLeft size={14} /> Voltar para senha
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.btnPrimary,
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              step === 1 ? "ACESSAR PAINEL" : "CONFIRMAR ACESSO"
            )}
          </button>

          {step === 1 && (
            <div style={styles.footer}>
              <p style={styles.footerText}>Precisa de uma licença comercial?</p>
              <span onClick={() => router.push('/signup')} style={styles.link}>
                SOLICITAR ACESSO À SAFRALOG
              </span>
            </div>
          )}
        </form>

        {/* Detalhe estético: Borda dourada no topo */}
        <div style={styles.topBar} />
      </div>

      <div style={styles.versionTag}>V. 7.2.0 - SECURE NODE</div>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: '100dvh',
    width: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#050507',
    backgroundImage: 'radial-gradient(circle at center, #1a140c 0%, #050507 100%)',
    position: 'fixed', 
    top: 0, left: 0,
    overflowY: 'auto',
  },
  bgOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
    opacity: 0.15,
    pointerEvents: 'none'
  },
  card: { 
    background: 'rgba(17, 17, 27, 0.95)', 
    backdropFilter: 'blur(20px)',
    borderRadius: '12px',
    boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 20px rgba(212, 169, 28, 0.05)', 
    border: '1px solid #2d2d3d',
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden'
  },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '3px',
    background: 'linear-gradient(to right, transparent, #d4a91c, transparent)'
  },
  header: { textAlign: 'center' },
  logoWrapper: {
    marginBottom: '15px',
    display: 'flex',
    justifyContent: 'center',
    transition: 'all 0.5s ease'
  },
  logo: { borderRadius: '50%', border: '2px solid #d4a91c33', padding: '5px' },
  title: { 
    color: '#fff', margin: '0', letterSpacing: '6px', fontWeight: '900', fontSize: '1.8rem',
    textShadow: '0 4px 10px rgba(0,0,0,0.5)'
  },
  divider: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', margin: '15px 0' },
  line: { height: '1px', background: 'linear-gradient(to right, transparent, #d4a91c, transparent)', width: '60px' },
  subtitle: { 
    color: '#9ca3af', fontSize: '0.65rem', letterSpacing: '4px', marginBottom: '30px', fontWeight: 'bold' 
  },
  inputGroup: { textAlign: 'left', marginBottom: '20px', width: '100%' },
  label: { 
    color: '#d4a91c', fontSize: '0.6rem', letterSpacing: '1.5px', marginBottom: '10px', 
    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800'
  },
  input: { 
    width: '100%', padding: '16px', background: '#0a0a0f', border: '1px solid #1c1c28', 
    color: 'white', borderRadius: '8px', outline: 'none', fontSize: '1rem', boxSizing: 'border-box',
    transition: 'all 0.3s',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
    focus: { border: '1px solid #d4a91c' }
  },
  helperText: { color: '#555', fontSize: '0.7rem', textAlign: 'center', marginTop: '10px' },
  backBtn: {
    background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.7rem',
    display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto 20px auto', transition: 'color 0.2s'
  },
  btnPrimary: { 
    width: '100%', padding: '18px', background: 'linear-gradient(135deg, #d4a91c 0%, #a67c00 100%)', 
    border: 'none', color: '#000', borderRadius: '8px', cursor: 'pointer', fontWeight: '900',
    fontSize: '0.85rem', letterSpacing: '2px', marginTop: '10px', boxShadow: '0 10px 30px rgba(212, 169, 28, 0.2)',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  errorBadge: {
    background: 'rgba(255, 76, 76, 0.1)', color: '#ff4c4c', padding: '12px', borderRadius: '8px',
    fontSize: '0.75rem', marginBottom: '20px', border: '1px solid rgba(255, 76, 76, 0.2)', textAlign: 'center'
  },
  footer: { marginTop: '35px', textAlign: 'center' },
  footerText: { fontSize: '0.7rem', color: '#555', marginBottom: '8px' },
  link: { 
    color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.65rem', letterSpacing: '1px',
    borderBottom: '1px solid #d4a91c', paddingBottom: '2px'
  },
  versionTag: { position: 'fixed', bottom: '20px', right: '20px', fontSize: '0.6rem', color: '#333', letterSpacing: '2px' }
};