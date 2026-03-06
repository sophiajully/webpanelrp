"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; // Importação essencial
import Image from "next/image";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Para exibir mensagens de erro na tela
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // O NextAuth gerencia o POST para /api/auth/callback/credentials automaticamente
    const result = await signIn("credentials", {
      username: formData.username,
      password: formData.password,
      redirect: false, // Evita o refresh da página para podermos tratar o erro
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Login bem-sucedido, NextAuth já salvou o cookie
      router.push("/"); 
      router.refresh(); // Garante que o layout pegue a nova sessão
    }
  };

  return (
    <div className="auth-container" style={styles.container}>
      <form className="auth-card" style={styles.card} onSubmit={handleLogin}>
        <div style={styles.header}>
          <div style={styles.header}>
    {/* Substituído o emoji pela imagem do public */}
    <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
        <Image 
            src="/isotipo.png" 
            alt="SafraLog Logo" 
            width={60} 
            height={60} 
            priority
        />
    </div>
    <h2 style={styles.title}>Safra Log</h2>
    <p style={styles.subtitle}>Painel de Gestão</p>
</div>
        </div>

        {error && (
            <div style={styles.errorBadge}>
                ⚠️ {error}
            </div>
        )}

        <div style={styles.inputGroup}>
            <label style={styles.label}>Usuário</label>
            <input 
              type="text" 
              placeholder="Digite seu usuário" 
              required 
              style={styles.input}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
        </div>

        <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              style={styles.input}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
        </div>

        <button type="submit" disabled={loading} style={styles.btnPrimary}>
          {loading ? "Autenticando..." : "Entrar no Sistema"}
        </button>

        <p style={styles.footerText}>
          Ainda não é parceiro? <br/>
          <span onClick={() => router.push('/signup')} style={styles.link}>Criar conta ou solicitar acesso</span>
        </p>
      </form>
    </div>
  );
}

const styles = {
container: { 
    height: '100vh', 
    width: '100vw', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#0a0a0f', 
    backgroundImage: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0f 100%)',
    position: 'fixed', 
    top: 0,
    left: 0
  },
  card: { 
    background: '#161625', 
    padding: '40px', 
    borderRadius: '16px', 
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center', 
    boxShadow: '0 20px 50px rgba(0,0,0,0.7)', 
    border: '1px solid #2a2a3a',
    margin: 'auto' 
  },
  header: { marginBottom: '30px' },
  title: { color: '#fff', margin: '10px 0 5px 0', fontSize: '1.5rem', letterSpacing: '1px' },
  subtitle: { color: '#666', fontSize: '0.9rem', marginBottom: '20px' },
  inputGroup: { textAlign: 'left', marginBottom: '15px' },
  label: { color: '#aaa', fontSize: '0.8rem', marginLeft: '5px', marginBottom: '5px', display: 'block' },
  input: { 
    width: '100%', 
    padding: '14px', 
    background: '#0f0f1a', 
    border: '1px solid #2d2d44', 
    color: 'white', 
    borderRadius: '10px',
    outline: 'none',
    transition: 'border 0.3s'
  },
  btnPrimary: { 
    width: '100%', 
    padding: '14px', 
    background: '#ff4c4c', 
    border: 'none', 
    color: 'white', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    fontSize: '1rem',
    marginTop: '10px',
    boxShadow: '0 4px 15px rgba(255, 76, 76, 0.3)',
    transition: 'transform 0.2s'
  },
  errorBadge: {
    background: '#ff4c4c22',
    color: '#ff4c4c',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '20px',
    border: '1px solid #ff4c4c44'
  },
  footerText: { marginTop: '25px', fontSize: '0.85rem', color: '#888', lineHeight: '1.5' },
  link: { color: '#ff4c4c', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }
};