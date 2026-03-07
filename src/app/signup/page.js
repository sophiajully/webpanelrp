"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Shield, Briefcase, Key, ArrowLeft, CheckCircle2, Building2 } from "lucide-react";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(""); 
  const [formData, setFormData] = useState({ username: "", password: "", companyName: "", accessKey: "", selectedCompanyId: "" });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (type === 'employee') {
      fetch('/api/companies')
        .then(res => res.json())
        .then(data => setCompanies(Array.isArray(data) ? data : data.companies || []))
        .catch(() => setCompanies([]));
    }
  }, [type]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type })
      });
      const data = await res.json();
      if (res.ok) {
          alert("Cadastro realizado com sucesso!");
          router.push('/login');
      } else {
          alert(data.error || "Erro ao cadastrar");
      }
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgOverlay} />
      
      <div 
        style={{
          ...styles.card,
          width: isMobile ? '92%' : '450px',
          padding: isMobile ? '30px 20px' : '50px 40px',
        }}
      >
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <Image src="/isotipo.png" alt="Logo" width={60} height={60} priority />
          </div>
          <h2 style={styles.title}>RECUTRAMENTO</h2>
          <div style={styles.divider}>
            <div style={styles.line} />
            <Shield size={14} color="#d4a91c" />
            <div style={styles.line} />
          </div>
          <p style={styles.subtitle}>
            {step === 1 ? "SELECIONE SUA FUNÇÃO NA FRONTEIRA" : `REGISTRO DE ${type === 'owner' ? 'PROPRIETÁRIO' : 'OPERÁRIO'}`}
          </p>
        </div>
        
        {step === 1 ? (
          <div style={styles.stepGroup}>
            <button 
              style={styles.btnChoice} 
              onClick={() => { setType('owner'); setStep(2); }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d4a91c'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2d2d44'}
            >
                <div style={styles.choiceHeader}>
                  <div style={styles.iconCircle}><Briefcase size={20} color="#d4a91c"/></div>
                  <strong>SOU PROPRIETÁRIO</strong>
                </div>
                <span style={styles.choiceSub}>Desejo fundar e gerenciar minha própria empresa e equipe.</span>
            </button>

            <button 
              style={styles.btnChoice} 
              onClick={() => { setType('employee'); setStep(2); }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d4a91c'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2d2d44'}
            >
                <div style={styles.choiceHeader}>
                  <div style={styles.iconCircle}><User size={20} color="#d4a91c"/></div>
                  <strong>SOU TRABALHADOR</strong>
                </div>
                <span style={styles.choiceSub}>Desejo me integrar a uma equipe já estabelecida na região.</span>
            </button>

            <p style={styles.footerText}>
              Já possui registro? <span onClick={() => router.push('/login')} style={styles.link}>LOGAR NO SISTEMA</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} style={styles.stepGroup}>
            <div style={styles.inputWrapper}>
               <label style={styles.label}><User size={12}/> NOME DO CIDADÃO</label>
               <input type="text" placeholder="Ex: Arthur Morgan" required style={styles.input} onChange={e => setFormData({...formData, username: e.target.value})}/>
            </div>

            <div style={styles.inputWrapper}>
               <label style={styles.label}><Key size={12}/> SENHA PRIVADA</label>
               <input type="password" placeholder="••••••••" required style={styles.input} onChange={e => setFormData({...formData, password: e.target.value})}/>
            </div>
            
            {type === 'owner' ? (
              <>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}><Building2 size={12}/> NOME DA EMPRESA</label>
                  <input type="text" placeholder="Ex: Safra Logística" required style={styles.input} onChange={e => setFormData({...formData, companyName: e.target.value})}/>
                </div>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}><CheckCircle2 size={12}/> KEY DE ACESSO (LICENÇA)</label>
                  <input type="text" placeholder="Insira sua key comercial" required style={styles.input} onChange={e => setFormData({...formData, accessKey: e.target.value})}/>
                </div>
              </>
            ) : (
              <div style={styles.inputWrapper}>
                <label style={styles.label}><Building2 size={12}/> SELECIONAR EMPRESA</label>
                <select required style={styles.input} onChange={e => setFormData({...formData, selectedCompanyId: e.target.value})}>
                  <option value="">Lista de empresas...</option>
                  {companies.map(c => <option key={c.id} value={c.id} style={{background: '#161625'}}>{c.name}</option>)}
                </select>
              </div>
            )}
            
            <button type="submit" disabled={loading} style={styles.btnPrimary}>
                {loading ? "PROCESSANDO..." : "CONCLUIR REGISTRO"}
            </button>
            <button type="button" onClick={() => setStep(1)} style={styles.btnBack}><ArrowLeft size={14}/> Voltar para seleção</button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: '100dvh', width: '100%', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    background: '#050507',
    backgroundImage: 'radial-gradient(circle, rgba(26,20,12,0.4) 0%, rgba(5,5,7,1) 80%)',
    position: 'fixed', top: 0, left: 0, overflowY: 'auto',
    fontFamily: 'serif' 
  },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-paper.png")', opacity: 0.2, pointerEvents: 'none' },
  card: { 
    background: 'rgba(22, 22, 37, 0.85)', backdropFilter: 'blur(12px)',
    borderRadius: '4px', textAlign: 'center', 
    boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(212, 169, 28, 0.1)', 
    border: '1px solid #1c1c28', margin: 'auto', boxSizing: 'border-box', position: 'relative'
  },
  header: { marginBottom: '30px' },
  logoWrapper: { marginBottom: '15px', display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 0 10px rgba(212, 169, 28, 0.3))' },
  title: { color: '#fff', margin: '0', letterSpacing: '4px', fontWeight: '900', fontSize: '1.6rem' },
  divider: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', margin: '10px 0' },
  line: { height: '1px', background: 'linear-gradient(to right, transparent, #d4a91c, transparent)', width: '50px' },
  subtitle: { color: '#d4a91c', fontSize: '0.65rem', letterSpacing: '2px', fontWeight: '700' },
  
  stepGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  inputWrapper: { textAlign: 'left', marginBottom: '15px' },
  label: { color: '#888', fontSize: '0.65rem', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' },
  input: { width: '100%', padding: '14px', background: 'rgba(0,0,0,0.4)', border: '1px solid #2d2d44', color: 'white', borderRadius: '4px', outline: 'none', borderLeft: '3px solid #d4a91c', boxSizing: 'border-box' },
  
  btnChoice: { 
    width: '100%', padding: '20px', margin: '8px 0', cursor: 'pointer', 
    background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #2d2d44', 
    borderRadius: '4px', textAlign: 'left', display: 'flex', flexDirection: 'column', 
    transition: '0.3s ease', position: 'relative' 
  },
  choiceHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' },
  iconCircle: { background: 'rgba(212, 169, 28, 0.1)', padding: '8px', borderRadius: '50%' },
  choiceSub: { fontSize: '0.75rem', color: '#666', lineHeight: '1.4' },
  
  btnPrimary: { 
    width: '100%', padding: '18px', background: 'linear-gradient(135deg, #d4a91c 0%, #a67c00 100%)', 
    border: 'none', color: '#000', borderRadius: '4px', cursor: 'pointer', 
    fontWeight: '900', fontSize: '0.85rem', letterSpacing: '1px', marginTop: '10px' 
  },
  btnBack: { background: 'none', border: 'none', color: '#666', marginTop: '20px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  link: { color: '#d4a91c', cursor: 'pointer', fontWeight: '900', textDecoration: 'underline' },
  footerText: { marginTop: '25px', fontSize: '0.75rem', color: '#555', letterSpacing: '1px' }
};