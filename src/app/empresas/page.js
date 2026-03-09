"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Send, ChevronLeft, ChevronRight, Search, LogOut, Building2 } from "lucide-react";

export default function SelecaoEmpresas() {
  const { data: session } = useSession();
  const router = useRouter();

  
  const [empresas, setEmpresas] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  
  const [pedidosEnviados, setPedidosEnviados] = useState([]); 
  const [minhasEmpresas, setMinhasEmpresas] = useState([]);   

  
  const carregarEmpresas = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/companies?page=${page}&limit=15&search=${search}&empresas=true`);
      const data = await res.json();
      const empresas = data.companies?.filter(e => e.enableHireRequest)
      setEmpresas(empresas || []);
      setMeta(data.meta || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error("Erro ao carregar mercado:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  
  const carregarMeusPedidos = useCallback(async () => {
    try {
      const res = await fetch('/api/hire-requests/me'); 
      if (res.ok) {
        const data = await res.json();
        setPedidosEnviados(data.map(req => req.companyId));
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
    }
  }, []);

  
  const carregarMinhasEmpresas = useCallback(async () => {
    try {
      const res = await fetch('/api/companies/owner');
      if (res.ok) {
        const data = await res.json();
        setMinhasEmpresas(data.map(emp => emp.id));
      }
    } catch (err) {
      console.error("Erro ao carregar minhas empresas:", err);
    }
  }, []);

  
  useEffect(() => {
    carregarMeusPedidos();
    carregarMinhasEmpresas();
    carregarEmpresas(1, searchTerm);
  }, [carregarMeusPedidos, carregarMinhasEmpresas, carregarEmpresas]);

  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      carregarEmpresas(1, searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, carregarEmpresas]);

  
  const getContrastingColor = (hexcolor) => {
    if (!hexcolor) return "#000000";
    const hex = hexcolor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  };

  
  const solicitarEntrada = async (companyId) => {
    if (pedidosEnviados.includes(companyId) || minhasEmpresas.includes(companyId)) return;

    setEnviando(companyId);
    try {
      const res = await fetch('/api/hire-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });
      
      if (res.ok) {
        alert("✅ Solicitação enviada! Aguarde aprovação.");
        setPedidosEnviados(prev => [...prev, companyId]);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erro ao enviar solicitação.");
      }
    } finally {
      setEnviando(null);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', width: '100vw', background: '#050507', color: '#fff', 
      overflowY: 'auto', overflowX: 'hidden', position: 'absolute', top: 0, left: 0 
    }}>
      
      <header style={{ 
        background: '#0a0a0f', borderBottom: '1px solid #1c1c26', padding: '20px 40px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: '#d4a91c', padding: '8px', borderRadius: '10px' }}>
            <Building2 size={24} color="#000" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-1px', textTransform: 'uppercase', margin: 0 }}>
              Mercado de <span style={{ color: '#d4a91c' }}>Empresas</span>
            </h1>
            <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: 0 }}>Explore e solicite acesso às organizações</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', borderRight: '1px solid #1c1c26', paddingRight: '20px' }}>
            <div style={{ fontSize: '0.6rem', color: '#4b5563', fontWeight: 'bold' }}>OPERADOR</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{session?.user?.name}</div>
          </div>
          <button 
            onClick={() => signOut()} 
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}
          >
            <LogOut size={16} /> SAIR
          </button>
        </div>
      </header>

      <main style={{ padding: '40px' }}>
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input 
            type="text"
            placeholder="Digite o nome da empresa para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', background: '#0a0a0f', border: '1px solid #1c1c26', padding: '20px 20px 20px 60px',
              borderRadius: '15px', color: '#fff', fontSize: '1.1rem', outline: 'none'
            }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ height: '240px', background: '#0a0a0f', borderRadius: '24px', border: '1px solid #1c1c26', opacity: 0.5 }}></div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
            {empresas.map(emp => {
              const jaEhDono = minhasEmpresas.includes(emp.id);
              const jaSolicitou = pedidosEnviados.includes(emp.id);
              const jaVinculado = session?.user?.companyId === emp.id;
              const isDisabled = jaEhDono || jaSolicitou || jaVinculado || enviando === emp.id;

              return (
                <div key={emp.id} style={{ 
                  background: '#0a0a0f', border: '1px solid #1c1c26', padding: '30px', borderRadius: '24px',
                  display: 'flex', flexDirection: 'column', gap: '25px', transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: '50px', height: '50px', borderRadius: '14px', background: emp.colorPrimary || '#d4a91c', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '900',
                      boxShadow: `0 0 20px ${emp.colorPrimary}33`
                    }}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ background: '#11111a', padding: '6px 12px', borderRadius: '8px', border: '1px solid #1c1c26' }}>
                      <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{emp._count?.users || 0}</span>
                      <span style={{ color: '#4b5563', fontSize: '0.7rem', marginLeft: '5px', fontWeight: 'bold' }}>MEMBROS</span>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>{emp.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: jaEhDono ? '#d4a91c' : '#22c55e' }}></div>
                      <p style={{ fontSize: '0.7rem', color: '#4b5563', fontFamily: 'monospace', margin: 0 }}>
                        {jaEhDono ? "SUA EMPRESA" : `ID-${emp.id.slice(0,8).toUpperCase()}`}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => solicitarEntrada(emp.id)}
                    disabled={isDisabled}
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                      background: isDisabled ? '#16161f' : (emp.colorPrimary || '#d4a91c'),
                      color: isDisabled ? '#4b5563' : getContrastingColor(emp.colorPrimary || '#d4a91c'),
                      fontWeight: '900', cursor: isDisabled ? 'default' : 'pointer', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      fontSize: '0.9rem', textTransform: 'uppercase', transition: 'all 0.2s'
                    }}
                  >
                    {jaEhDono ? "Você é o Proprietário" : 
                     jaVinculado ? "Vínculo Ativo" : 
                     jaSolicitou ? "Solicitação Pendente" : 
                     enviando === emp.id ? "Enviando..." : 
                     <><Send size={18}/> Solicitar Contratação</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <footer style={{ marginTop: '60px', padding: '30px', borderTop: '1px solid #1c1c26', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px' }}>
          <button disabled={meta.page === 1} onClick={() => carregarEmpresas(meta.page - 1, searchTerm)} style={pagButtonStyle}>
            <ChevronLeft size={24}/>
          </button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#4b5563', display: 'block', fontWeight: 'bold' }}>PÁGINA</span>
            <span style={{ fontSize: '1.2rem', fontWeight: '900' }}>{meta.page} <span style={{ color: '#2d2d3d' }}>/</span> {meta.totalPages}</span>
          </div>
          <button disabled={meta.page === meta.totalPages} onClick={() => carregarEmpresas(meta.page + 1, searchTerm)} style={pagButtonStyle}>
            <ChevronRight size={24}/>
          </button>
        </footer>
      </main>
    </div>
  );
}

const pagButtonStyle = {
  background: '#0a0a0f', border: '1px solid #1c1c26', color: '#fff', width: '50px', height: '50px', 
  borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
};