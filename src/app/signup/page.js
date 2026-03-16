"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { User, Shield, Briefcase, Key, ArrowLeft, CheckCircle2, Building2, Loader2 } from "lucide-react";
import { submitServerAction } from "../actions/appActions";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(""); 
  const [formData, setFormData] = useState({ username: "", password: "", companyName: "", accessKey: "", selectedCompanyId: "" });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [passwordMetrics, setPasswordMetrics] = useState({
    length: false,
    number: false,
    special: false,
    strength: 0,
  });

  const router = useRouter();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (type === 'employee') {
      submitServerAction('/api/companies?all=true', 'GET')
        .then(res => res)
        .then(data => setCompanies(Array.isArray(data) ? data.filter(e => e.enableHireRequest) : data.companies.filter(e => e.enableHireRequest) || []))
        .catch(() => setCompanies([]));
    }
  }, [type]);

  const handlePasswordChange = (e) => {
    const pass = e.target.value;
    const metrics = {
      length: pass.length >= 8,
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    };

    let score = 0;
    if (metrics.length) score++;
    if (metrics.number) score++;
    if (metrics.special) score++;

    setPasswordMetrics({ ...metrics, strength: score });
    setFormData({ ...formData, password: pass });
  };

  const getStrengthLabel = () => {
    if (passwordMetrics.strength === 0) return { label: "INACEITÁVEL", color: "#666" };
    if (passwordMetrics.strength === 1) return { label: "VULNERÁVEL", color: "#ff4c4c" };
    if (passwordMetrics.strength === 2) return { label: "MODERADA", color: "#d4a91c" };
    return { label: "CRIPTOGRAFADA", color: "#00ff88" };
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (passwordMetrics.strength < 2) {
      alert("Sua senha é muito vulnerável para os padrões da fronteira.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type })
      });
      
      const data = await res.json();

      if (res.ok) {
        const result = await signIn("credentials", {
          username: formData.username,
          password: formData.password,
          redirect: false,
        });

        if (result.ok) {
          router.push('/');
        } else {
          router.push('/login');
        }
      } else {
        alert(data.error || "Erro ao cadastrar");
      }
    } catch (err) {
      alert("Erro de conexão com o cartório.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgOverlay} />
      
      <div style={{ ...styles.card, width: isMobile ? '92%' : '420px' }}>
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <Image src="/isotipo.png" alt="Logo" width={70} height={70} priority style={styles.logo} />
          </div>
          <h2 style={styles.title}>RECRUTAMENTO</h2>
          <div style={styles.divider}>
            <div style={styles.line} />
            <Shield size={16} color="#d4a91c" />
            <div style={styles.line} />
          </div>
          <p style={styles.subtitle}>
            {step === 1 ? "SISTEMA DE ALOCAÇÃO DE CIDADÃOS" : `REGISTRO DE ${type === 'owner' ? 'PROPRIETÁRIO' : 'OPERÁRIO'}`}
          </p>
        </div>
        
        {step === 1 ? (
          <div style={styles.stepGroup} className="fade-in">
            <button className="choice-button" style={styles.btnChoice} onClick={() => { setType('owner'); setStep(2); }}>
                <div style={styles.choiceHeader}>
                  <div style={styles.iconCircle}><Briefcase size={22} color="#d4a91c"/></div>
                  <div style={styles.choiceTextWrapper}>
                    <strong style={styles.choiceTitle}>SOU PROPRIETÁRIO</strong>
                    <span style={styles.choiceSub}>Fundar nova unidade comercial e gerenciar equipe.</span>
                  </div>
                </div>
            </button>

            <button className="choice-button" style={styles.btnChoice} onClick={() => { setType('employee'); setStep(2); }}>
                <div style={styles.choiceHeader}>
                  <div style={styles.iconCircle}><User size={22} color="#d4a91c"/></div>
                  <div style={styles.choiceTextWrapper}>
                    <strong style={styles.choiceTitle}>SOU TRABALHADOR</strong>
                    <span style={styles.choiceSub}>Solicitar ingresso em uma empresa existente.</span>
                  </div>
                </div>
            </button>

            <p style={styles.footerText}>
              Já registrado? <span onClick={() => router.push('/login')} style={styles.link}>ACESSAR TERMINAL</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} style={styles.stepGroup} className="fade-in">
            <div style={styles.inputWrapper}>
               <label style={styles.label}><User size={12}/> IDENTIFICAÇÃO DO CIDADÃO</label>
               <input type="text" placeholder="Nome de usuário" required style={styles.input} onChange={e => setFormData({...formData, username: e.target.value})}/>
            </div>

            <div style={styles.inputWrapper}>
               <label style={styles.label}><Key size={12}/> CHAVE PRIVADA (SENHA)</label>
               <input type="password" placeholder="••••••••" required style={styles.input} onChange={handlePasswordChange}/>
               
               <div style={styles.strengthContainer}>
                  <div style={styles.strengthBarBackground}>
                    <div style={{
                      ...styles.strengthBarFill,
                      width: `${(passwordMetrics.strength / 3) * 100}%`,
                      backgroundColor: getStrengthLabel().color,
                      boxShadow: `0 0 10px ${getStrengthLabel().color}44`
                    }} />
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '6px'}}>
                    <span style={{ ...styles.strengthText, color: getStrengthLabel().color }}>
                      {getStrengthLabel().label}
                    </span>
                    <span style={styles.strengthText}>SEGURANÇA</span>
                  </div>
               </div>
            </div>
            
            {type === 'owner' ? (
              <>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}><Building2 size={12}/> DESIGNAÇÃO DA EMPRESA</label>
                  <input type="text" placeholder="Ex: Safra Logística" required style={styles.input} onChange={e => setFormData({...formData, companyName: e.target.value})}/>
                </div>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}><CheckCircle2 size={12}/> LICENÇA COMERCIAL (KEY)</label>
                  <input type="text" placeholder="Insira o código de licença" required style={styles.input} onChange={e => setFormData({...formData, accessKey: e.target.value})}/>
                </div>
              </>
            ) : (
              <div style={styles.inputWrapper}>
                <label style={styles.label}><Building2 size={12}/> EMPRESA DESTINO</label>
                <select required style={styles.select} onChange={e => setFormData({...formData, selectedCompanyId: e.target.value})}>
                  <option value="">Selecione na lista...</option>
                  {companies.map(c => <option key={c.id} value={c.id} style={{background: '#0a0a0f', color: '#fff'}}>{c.name}</option>)}
                </select>
              </div>
            )}
            
            <button type="submit" disabled={loading} style={styles.btnPrimary}>
                {loading ? <Loader2 size={20} className="spinner" /> : "FINALIZAR REGISTRO"}
            </button>

            <button type="button" onClick={() => setStep(1)} style={styles.btnBack}>
              <ArrowLeft size={14}/> VOLTAR PARA SELEÇÃO
            </button>
          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }

        .choice-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .choice-button:hover {
          background: rgba(212, 169, 28, 0.05) !important;
          border-color: #d4a91c !important;
          transform: translateX(5px);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: '100dvh', width: '100%', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    background: '#050507',
    backgroundImage: 'radial-gradient(circle at center, #1a140c 0%, #050507 100%)',
    position: 'fixed', top: 0, left: 0, overflowY: 'auto',
    fontFamily: '"Inter", system-ui, sans-serif' 
  },
  bgOverlay: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")', 
    opacity: 0.15, pointerEvents: 'none' 
  },
  card: { 
    background: 'rgba(10, 10, 15, 0.8)', 
    backdropFilter: 'blur(20px)',
    borderRadius: '12px', textAlign: 'center', 
    boxShadow: '0 40px 100px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.05)', 
    border: '1px solid rgba(212, 169, 28, 0.2)', 
    padding: '40px',
    boxSizing: 'border-box', position: 'relative',
    zIndex: 10
  },
  header: { marginBottom: '35px' },
  logoWrapper: { marginBottom: '20px', display: 'flex', justifyContent: 'center' },
  logo: { filter: 'drop-shadow(0 0 15px rgba(212, 169, 28, 0.4))' },
  title: { color: '#fff', margin: '0', letterSpacing: '6px', fontWeight: '900', fontSize: '1.4rem' },
  divider: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '15px 0' },
  line: { height: '1px', background: 'linear-gradient(to right, transparent, rgba(212, 169, 28, 0.5), transparent)', width: '60px' },
  subtitle: { color: '#d4a91c', fontSize: '0.65rem', letterSpacing: '2px', fontWeight: '800', opacity: 0.8 },
  
  stepGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  inputWrapper: { textAlign: 'left', marginBottom: '18px' },
  label: { color: '#aaa', fontSize: '0.6rem', letterSpacing: '1.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' },
  input: { 
    width: '100%', padding: '15px', 
    background: 'rgba(0,0,0,0.5)', border: '1px solid #2d2d44', 
    color: 'white', borderRadius: '8px', outline: 'none', 
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    fontSize: '0.9rem'
  },
  select: {
    width: '100%', padding: '15px', 
    background: 'rgba(0,0,0,0.5)', border: '1px solid #2d2d44', 
    color: 'white', borderRadius: '8px', outline: 'none',
    boxSizing: 'border-box', cursor: 'pointer'
  },
  
  btnChoice: { 
    width: '100%', padding: '22px', margin: '6px 0', cursor: 'pointer', 
    background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid #1c1c28', 
    borderRadius: '10px', textAlign: 'left', display: 'flex', flexDirection: 'column', 
    position: 'relative', outline: 'none'
  },
  choiceHeader: { display: 'flex', alignItems: 'center', gap: '16px' },
  choiceTextWrapper: { display: 'flex', flexDirection: 'column' },
  choiceTitle: { fontSize: '0.9rem', letterSpacing: '0.5px' },
  iconCircle: { background: 'rgba(212, 169, 28, 0.08)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(212, 169, 28, 0.2)' },
  choiceSub: { fontSize: '0.7rem', color: '#777', marginTop: '4px', lineHeight: '1.4' },
  
  btnPrimary: { 
    width: '100%', padding: '18px', 
    background: 'linear-gradient(135deg, #d4a91c 0%, #a67c00 100%)', 
    border: 'none', color: '#000', borderRadius: '8px', cursor: 'pointer', 
    fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', marginTop: '15px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  btnBack: { 
    background: 'none', border: 'none', color: '#555', marginTop: '20px', 
    cursor: 'pointer', fontSize: '0.7rem', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontWeight: '800', letterSpacing: '1px'
  },
  link: { color: '#d4a91c', cursor: 'pointer', fontWeight: '800', borderBottom: '1px solid #d4a91c' },
  footerText: { marginTop: '30px', fontSize: '0.7rem', color: '#666', letterSpacing: '1px', fontWeight: '600' },

  strengthContainer: { marginTop: '12px' },
  strengthBarBackground: { height: '3px', width: '100%', background: '#1a1a25', borderRadius: '10px', overflow: 'hidden' },
  strengthBarFill: { height: '100%', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' },
  strengthText: { fontSize: '0.55rem', fontWeight: '900', letterSpacing: '1px', display: 'block' }
};