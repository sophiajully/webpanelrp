"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Store, ArrowLeft, Users, Package, ChevronLeft, ChevronRight } from "lucide-react";

export default function MercadaoGeral() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function carregarEmpresas(p) {
    setLoading(true);
    try {
      const res = await fetch(`/api/companies?page=${p}&limit=8`);
      const data = await res.json();
      
      // Filtra a própria empresa
      const filtradas = data.companies.filter(c => String(c.id) !== String(session?.user?.companyId));
      
      setEmpresas(filtradas);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user?.companyId) {
      carregarEmpresas(page);
    }
  }, [session, page]);

  return (
    <div style={styles.layoutWrapper}>
      <main style={styles.mainContent}>
        <header style={styles.mainHeader}>
          <div>
            <span style={styles.breadcrumb}>Dashboard / Mercadão</span>
            <h2 style={styles.pageTitle}>Mercadão da Fronteira</h2>
          </div>
          <button style={styles.btnSettings} onClick={() => router.push('/')}>
            <ArrowLeft size={20} /> Voltar ao Painel
          </button>
        </header>

        <section style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h4 style={{ fontSize: '1rem', color: '#d4a91c', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Store size={18}/> Fornecedores Disponíveis
            </h4>
            
            {/* PAGINAÇÃO */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                style={styles.pageBtn}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Página {page} de {totalPages}</span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                style={styles.pageBtn}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {loading ? (
            <p style={{ color: '#666' }}>Consultando registros comerciais...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {empresas.map(empresa => (
                <div 
                  key={empresa.id}
                  onClick={() => router.push(`/mercadao/${empresa.id}`)}
                  style={styles.companyCard}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = empresa.colorAccent || '#d4a91c'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#1c1f26'; }}
                >
                  {/* Faixa lateral com a cor da empresa */}
                  <div style={{ ...styles.colorStrip, background: empresa.colorPrimary }}></div>
                  
                  <div style={{ padding: '20px' }}>
                    <h3 style={styles.companyName}>{empresa.name}</h3>
                    
                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <Package size={14} color="#d4a91c" />
                        <span>{empresa._count?.crafts || 0} Produtos</span>
                      </div>
                      <div style={styles.infoItem}>
                        <Users size={14} color="#00ff90" />
                        <span>{empresa._count?.users || 0} Funcionários</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  // ... (mantenha os estilos anteriores e adicione/atualize estes abaixo)
  layoutWrapper: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#07080a', color: '#d1d5db', fontFamily: '"Inter", sans-serif' },
  mainContent: { flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' },
  mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  breadcrumb: { fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', fontWeight: '600' },
  pageTitle: { fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginTop: '4px' },
  btnSettings: { background: '#161922', border: '1px solid #1c1f26', color: '#9ca3af', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' },
  card: { background: '#0d0f14', border: '1px solid #1c1f26', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
  
  companyCard: {
    background: '#161922',
    borderRadius: '12px',
    border: '1px solid #1c1f26',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row'
  },
  colorStrip: {
    width: '6px',
    height: '100%'
  },
  companyName: {
    margin: '0 0 12px 0',
    fontSize: '1.1rem',
    color: '#fff',
    fontWeight: '700'
  },
  infoGrid: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: '#9ca3af'
  },
  pageBtn: {
    background: '#1c1f26',
    border: '1px solid #333',
    color: '#fff',
    padding: '5px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    opacity: 1,
    transition: '0.2s'
  },
   layoutWrapper: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#07080a', color: '#d1d5db', fontFamily: '"Inter", sans-serif' },
  mainContent: { flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' },
  mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  breadcrumb: { fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', fontWeight: '600' },
  pageTitle: { fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginTop: '4px' },
  btnSettings: { background: '#161922', border: '1px solid #1c1f26', color: '#9ca3af', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' },
  card: { background: '#0d0f14', border: '1px solid #1c1f26', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }

};
