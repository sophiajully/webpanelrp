"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; 
import Image from "next/image";
import { Lock, User, ShieldCheck } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 
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
      redirect: false, 
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/"); 
      router.refresh(); 
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Decorativo Estilo Velho Oeste */}
      <div style={styles.bgOverlay} />
      
      <form 
        style={{
          ...styles.card,
          width: isMobile ? '92%' : '420px',
          padding: isMobile ? '30px 20px' : '50px 40px',
        }} 
        onSubmit={handleLogin}
      >
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <Image 
              src="/isotipo.png" 
              alt="SafraLog Logo" 
              width={isMobile ? 70 : 85} 
              height={isMobile ? 70 : 85} 
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
          <p style={styles.subtitle}>SISTEMA DE GESTÃO DE FRONTEIRA</p>
        </div>

        {error && (
          <div style={styles.errorBadge}>
            {error}
          </div>
        )}

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

        <button 
          type="submit" 
          disabled={loading} 
          style={{
            ...styles.btnPrimary,
            opacity: loading ? 0.7 : 1,
            transform: loading ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {loading ? "AUTENTICANDO..." : "ACESSAR PAINEL"}
        </button>

        <div style={styles.footer}>
          <p style={styles.footerText}>Precisa de uma licença comercial?</p>
          <span onClick={() => router.push('/signup')} style={styles.link}>
            SOLICITAR ACESSO À SAFRALOG
          </span>
        </div>
      </form>

      <div style={styles.versionTag}>V. 2.4.0 - FRONTIER EDITION</div>
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
    // Gradiente que simula uma vinheta de filme antigo
    backgroundImage: 'radial-gradient(circle, rgba(26,20,12,0.4) 0%, rgba(5,5,7,1) 80%)',
    position: 'fixed', 
    top: 0,
    left: 0,
    overflowY: 'auto',
    fontFamily: '"Cinzel", serif', // Sugiro importar essa fonte ou similar no seu projeto
  },
  bgOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-paper.png")', // Textura de papel/couro
    opacity: 0.3,
    pointerEvents: 'none'
  },
  card: { 
    background: 'rgba(22, 22, 37, 0.8)', 
    backdropFilter: 'blur(12px)', // Efeito de vidro
    borderRadius: '4px', // RDR2 usa formas mais retas e clássicas
    textAlign: 'center', 
    boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(212, 169, 28, 0.15)', 
    border: '1px solid #1c1c28',
    margin: 'auto',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 1,
  },
  logoWrapper: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
    filter: 'drop-shadow(0 0 15px rgba(212, 169, 28, 0.4))'
  },
  logo: { borderRadius: '50%' },
  title: { 
    color: '#fff', 
    margin: '0', 
    letterSpacing: '4px', 
    fontWeight: '900', 
    fontSize: '2rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    margin: '10px 0'
  },
  line: { height: '1px', background: 'linear-gradient(to right, transparent, #d4a91c, transparent)', width: '60px' },
  subtitle: { 
    color: '#9ca3af', 
    fontSize: '0.7rem', 
    letterSpacing: '3px', 
    marginBottom: '30px',
    fontWeight: '500'
  },
  inputGroup: { textAlign: 'left', marginBottom: '20px', width: '100%' },
  label: { 
    color: '#d4a91c', 
    fontSize: '0.65rem', 
    letterSpacing: '1px', 
    marginBottom: '8px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px',
    fontWeight: '700'
  },
  input: { 
    width: '100%', 
    padding: '16px', 
    background: 'rgba(0,0,0,0.4)', 
    border: '1px solid #2d2d44', 
    color: 'white', 
    borderRadius: '4px',
    outline: 'none',
    fontSize: '1rem', 
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    borderLeft: '3px solid #d4a91c' // Detalhe lateral premium
  },
  btnPrimary: { 
    width: '100%', 
    padding: '18px',
    background: 'linear-gradient(135deg, #d4a91c 0%, #a67c00 100%)', 
    border: 'none', 
    color: '#000', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontWeight: '900',
    fontSize: '0.9rem',
    letterSpacing: '2px',
    marginTop: '15px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
    transition: 'all 0.3s'
  },
  errorBadge: {
    background: 'rgba(255, 76, 76, 0.1)',
    color: '#ff4c4c',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    marginBottom: '20px',
    border: '1px solid rgba(255, 76, 76, 0.3)',
    fontWeight: 'bold'
  },
  footer: { marginTop: '35px' },
  footerText: { fontSize: '0.75rem', color: '#666', marginBottom: '8px' },
  link: { 
    color: '#fff', 
    cursor: 'pointer', 
    fontWeight: '700', 
    fontSize: '0.7rem', 
    letterSpacing: '1px',
    textDecoration: 'none',
    borderBottom: '1px solid #d4a91c',
    paddingBottom: '2px'
  },
  versionTag: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    fontSize: '0.6rem',
    color: '#444',
    letterSpacing: '2px'
  }
};