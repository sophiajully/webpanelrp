"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(""); // 'owner' ou 'employee'
  const [formData, setFormData] = useState({ username: "", password: "", companyName: "", accessKey: "", selectedCompanyId: "" });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (type === 'employee') {
      fetch('/api/companies').then(res => res.json()).then(data => setCompanies(data));
    }
  }, [type]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, type })
    });
    const data = await res.json();
    if (res.ok) {
        alert("Cadastro realizado! Donos podem logar, funcionários aguardam aprovação.");
        router.push('/login');
    } else {
        alert(data.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container" style={styles.container}>
      <div className="auth-card" style={styles.card}>
        <div style={styles.header}>
            {/* Substituído o emoji pelo seu isotipo.png */}
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                <Image 
                    src="/isotipo.png" 
                    alt="SafraLog Logo" 
                    width={50} 
                    height={50} 
                    priority
                />
            </div>
            <h2 style={styles.title}>Crie sua Conta</h2>
            <p style={styles.subtitle}>{step === 1 ? "Escolha seu perfil" : "Preencha seus dados"}</p>
        </div>
        
        {step === 1 ? (
          <div style={styles.stepGroup}>
            <button style={styles.btnChoice} onClick={() => { setType('owner'); setStep(2); }}>
                <strong>👑 Sou Dono</strong>
                <span style={styles.choiceSub}>Quero gerenciar minha própria empresa</span>
            </button>
            <button style={styles.btnChoice} onClick={() => { setType('employee'); setStep(2); }}>
                <strong>🚜 Sou Funcionário</strong>
                <span style={styles.choiceSub}>Quero entrar em uma equipe existente</span>
            </button>
            <p style={styles.footerText}>Já tem conta? <span onClick={() => router.push('/login')} style={styles.link}>Entrar</span></p>
          </div>
        ) : (
          <form onSubmit={handleSignup} style={styles.stepGroup}>
            <input type="text" placeholder="Nome de Usuário" required style={styles.input} onChange={e => setFormData({...formData, username: e.target.value})}/>
            <input type="password" placeholder="Sua Senha" required style={styles.input} onChange={e => setFormData({...formData, password: e.target.value})}/>
            
            {type === 'owner' ? (
              <>
                {/* Texto de exemplo atualizado para algo mais logístico */}
                <input type="text" placeholder="Nome da Empresa (Ex: Logística Safra Sul)" required style={styles.input} onChange={e => setFormData({...formData, companyName: e.target.value})}/>
                <input type="text" placeholder="Key de Acesso (30 dias)" required style={styles.input} onChange={e => setFormData({...formData, accessKey: e.target.value})}/>
              </>
            ) : (
              <select required style={styles.input} onChange={e => setFormData({...formData, selectedCompanyId: e.target.value})}>
                <option value="">Selecione a Empresa...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            
            <button type="submit" disabled={loading} style={styles.btnPrimary}>
                {loading ? "Processando..." : "Finalizar Cadastro"}
            </button>
            <button type="button" onClick={() => setStep(1)} style={styles.btnBack}>← Voltar</button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { 
    height: '100vh', 
    width: '100vw', // Garante largura total
    display: 'flex', 
    flexDirection: 'column', // Empilha elementos se houver mais de um
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#0a0a0f', 
    backgroundImage: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0f 100%)',
    position: 'fixed', // Opcional: Garante que fique fixo na tela toda
    top: 0,
    left: 0
  },
  card: { 
    background: '#161625', 
    padding: '40px', 
    borderRadius: '16px', 
    width: '100%',
    maxWidth: '400px', // Responsivo: não estoura em telas pequenas
    textAlign: 'center', 
    boxShadow: '0 20px 50px rgba(0,0,0,0.7)', 
    border: '1px solid #2a2a3a',
    margin: 'auto' // Reforço de centralização
  },
  header: { marginBottom: '25px' },
  title: { color: '#fff', margin: '10px 0 5px 0', fontSize: '1.5rem' },
  subtitle: { color: '#666', fontSize: '0.9rem' },
  input: { width: '100%', padding: '14px', margin: '10px 0', background: '#0f0f1a', border: '1px solid #2d2d44', color: 'white', borderRadius: '10px', outline: 'none' },
  btnChoice: { width: '100%', padding: '15px', margin: '10px 0', cursor: 'pointer', background: '#1c1c2e', color: 'white', border: '1px solid #3d3d5c', borderRadius: '12px', textAlign: 'left', display: 'flex', flexDirection: 'column', transition: '0.2s' },
  choiceSub: { fontSize: '0.75rem', color: '#888', marginTop: '4px' },
  btnPrimary: { width: '100%', padding: '14px', background: '#ff4c4c', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' },
  btnBack: { background: 'none', border: 'none', color: '#666', marginTop: '15px', cursor: 'pointer', fontSize: '0.9rem' },
  link: { color: '#ff4c4c', cursor: 'pointer', fontWeight: 'bold' },
  footerText: { marginTop: '20px', fontSize: '0.85rem', color: '#888' }
};