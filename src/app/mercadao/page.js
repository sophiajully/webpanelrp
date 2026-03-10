"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Store, ArrowLeft, Users, Package, ChevronLeft, ChevronRight } from "lucide-react";
import Toast from "@/app/components/Toast";
import ConfirmModal from "@/app/components/ConfirmModal";

export default function MercadaoGeral() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function carregarEmpresas(p) {
    setLoading(true);
    try {
      const res = await fetch(`/api/companies?page=${p}&limit=8`);
      const data = await res.json();
      const filtradas = data.companies.filter(c => 
        String(c.id) !== String(session?.user?.companyId) && 
        c._count.crafts > 0
      );
      setEmpresas(filtradas);
      setTotalPages(data.meta.totalPages || 1);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user?.companyId) carregarEmpresas(page);
  }, [session, page]);

  return (
    // Removi width: 100vw e usei max-width para evitar o arrasto lateral
    <div style={styles.layoutWrapper}>
      <main style={{
        ...styles.mainContent,
        padding: isMobile ? '15px' : '40px'
      }}>
        
        {/* HEADER FIXADO */}
        <header style={{
          ...styles.mainHeader,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          gap: isMobile ? '15px' : '0'
        }}>
          <div style={{ maxWidth: '100%' }}>
            <span style={styles.breadcrumb}>Dashboard / Mercadão</span>
            <h2 style={{
              ...styles.pageTitle,
              fontSize: isMobile ? '1.3rem' : '1.75rem',
              wordBreak: 'break-word' // Evita que títulos longos empurrem a tela
            }}>Mercadão da Fronteira</h2>
          </div>
          <button 
            style={{
              ...styles.btnSettings, 
              width: isMobile ? '100%' : 'auto', 
              justifyContent: 'center'
            }} 
            onClick={() => router.push('/')}
          >
            <ArrowLeft size={20} /> Voltar ao Painel
          </button>
        </header>

        {/* SECTION COM OVERFLOW CONTROLADO */}
        <section style={{
          ...styles.card,
          padding: isMobile ? '15px' : '32px',
          width: '100%',
          boxSizing: 'border-box' // Garante que o padding não aumente a largura
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px',
            gap: '15px'
          }}>
            <h4 style={{ fontSize: '0.95rem', color: '#d4a91c', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, alignSelf: 'flex-start' }}>
              <Store size={18}/> Fornecedores
            </h4>
            
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center',
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'space-between' : 'flex-end'
            }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={styles.pageBtn}>
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={styles.pageBtn}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {loading ? (
            <p style={{ color: '#666', textAlign: 'center' }}>Carregando...</p>
          ) : (
            <div style={{ 
              display: 'grid', 
              // Garante 1 coluna no mobile sem estourar a largura
              gridTemplateColumns: isMobile ? '100%' : 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '12px',
              width: '100%'
            }}>
              {empresas.map(empresa => (
                <div 
                  key={empresa.id}
                  onClick={() => router.push(`/mercadao/${empresa.id}`)}
                  style={styles.companyCard}
                >
                  <div style={{ ...styles.colorStrip, background: empresa.colorPrimary }}></div>
                  <div style={{ padding: '12px', flex: 1, minWidth: 0 }}> {/* minWidth: 0 evita quebras de texto */}
                    <h3 style={{...styles.companyName, fontSize: '0.95rem'}}>{empresa.name}</h3>
                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <Package size={14} color="#d4a91c" />
                        <span>{empresa._count?.crafts || 0} Itens</span>
                      </div>
                      <div style={styles.infoItem}>
                        <Users size={14} color="#00ff90" />
                        <span>{empresa._count?.users || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <Toast />
        <ConfirmModal />
      </main>
    </div>
  );
}

const styles = {
  layoutWrapper: { 
    display: 'flex', 
    minHeight: '100vh', 
    width: '100%', // Mudado de 100vw para 100% (evita scroll lateral)
    backgroundColor: '#07080a', 
    color: '#d1d5db', 
    fontFamily: '"Inter", sans-serif',
    overflowX: 'hidden', // MATA O ARRASTO PRO LADO
    position: 'relative'
  },
  mainContent: { 
    flex: 1, 
    width: '100%',
    maxWidth: '100%', // Segurança extra
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px',
    boxSizing: 'border-box'
  },
  mainHeader: { display: 'flex', justifyContent: 'space-between' },
  breadcrumb: { fontSize: '0.65rem', color: '#4b5563', textTransform: 'uppercase', fontWeight: '700' },
  pageTitle: { fontWeight: '800', color: '#fff', margin: '4px 0' },
  btnSettings: { 
    background: '#161922', 
    border: '1px solid #1c1f26', 
    color: '#9ca3af', 
    padding: '12px', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    display: 'flex', 
    gap: '8px', 
    alignItems: 'center',
    fontSize: '0.85rem'
  },
  card: { 
    background: '#0d0f14', 
    border: '1px solid #1c1f26', 
    borderRadius: '16px',
    boxSizing: 'border-box'
  },
  companyCard: {
    background: '#161922',
    borderRadius: '10px',
    border: '1px solid #1c1f26',
    cursor: 'pointer',
    display: 'flex',
    overflow: 'hidden',
    width: '100%', // Card nunca maior que o container
    boxSizing: 'border-box'
  },
  colorStrip: { width: '4px', height: '100%' },
  companyName: { margin: '0 0 4px 0', color: '#fff', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  infoGrid: { display: 'flex', gap: '10px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#9ca3af' },
  pageBtn: {
    background: '#1c1f26',
    border: '1px solid #333',
    color: '#fff',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};