"use client";

import { useEffect, useState, use } from "react"; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Trash2, ShoppingCart } from "lucide-react";

export default function FornecedorPage({ params }) {
  const { data: session } = useSession();
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [empresa, setEmpresa] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [quantidadesSelecionadas, setQuantidadesSelecionadas] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function carregarDadosEmpresa() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/companies/${id}`); 
        const data = await res.json();
        if (data.error) setEmpresa(null);
        else setEmpresa(data);
      } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
      } finally {
        setLoading(false);
      }
    }
    carregarDadosEmpresa();
  }, [id]);

  const handleQtdChange = (produtoId, valor) => {
    const n = parseInt(valor);
    setQuantidadesSelecionadas(prev => ({ ...prev, [produtoId]: n > 0 ? n : 1 }));
  };

  const adicionarAoCarrinho = (produto) => {
    const qtdInformada = Math.max(1, parseInt(quantidadesSelecionadas[produto.id] || 1));
    if (carrinho.length >= 10 && !carrinho.find(i => i.id === produto.id)) {
      alert("⚠️ Carrinho cheio (limite de 10 tipos de itens).");
      return;
    }
    setCarrinho(prev => {
      const existente = prev.find(i => i.id === produto.id);
      if (existente) {
        return prev.map(i => i.id === produto.id ? { ...i, qtd: i.qtd + qtdInformada } : i);
      }
      return [...prev, { id: produto.id, nome: produto.name, preco: produto.price, qtd: qtdInformada }];
    });
    setQuantidadesSelecionadas(prev => ({ ...prev, [produto.id]: 1 }));
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(prev => prev.filter(i => i.id !== produtoId));
  };

  const enviarProposta = async () => {
    if (carrinho.length === 0) return;
    setEnviandoPedido(true);
    const total = carrinho.reduce((acc, item) => acc + (Number(item.preco) * item.qtd), 0);
    const itensTexto = carrinho.map(i => `🔸 **${i.nome}** (x${i.qtd}) - $${(Number(i.preco) * i.qtd).toFixed(2)}`).join('\n');

    try {
      if (empresa.webhookVendas) {
        await fetch('/api/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskName: "ENVIAR_WEBHOOK_DISCORD",
            payload: { 
              url: empresa.webhookVendas, 
              embed: {
                title: "📩 Nova Proposta Comercial!",
                color: 0xd4a91c,
                fields: [
                  { name: "👤 Cliente", value: session?.user?.username || "Desconhecido", inline: true },
                  { name: "📫 Pombo", value: `${session?.user?.pombo || 'Não Informado'}`, inline: true }, 
                  { name: "💰 Valor total", value: `**$ ${total.toFixed(2)}**` },
                  { name: "📝 Itens", value: itensTexto },
                ],
                footer: { text: `Mercadão | Fornecedor: ${empresa.name}` },
                timestamp: new Date().toISOString()
              } 
            }
          })
        });
      }
      alert("Proposta enviada com sucesso!");
      setCarrinho([]);
      router.push('/mercadao');
    } catch (err) {
      alert("Erro ao enviar.");
    } finally {
      setEnviandoPedido(false);
    }
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (Number(item.preco) * item.qtd), 0);

  if (loading) return <div style={styles.layoutWrapper}><h2 style={{margin: 'auto', color: '#d4a91c'}}>Carregando...</h2></div>;
  if (!empresa) return <div style={styles.layoutWrapper}><h2 style={{margin: 'auto', color: '#ff4c4c'}}>Não encontrado.</h2></div>;

  return (
    <div style={styles.layoutWrapper}>
      <main style={{...styles.mainContent, padding: isMobile ? '15px' : '40px'}}>
        <header style={{...styles.mainHeader, flexDirection: isMobile ? 'column' : 'row', gap: '15px'}}>
          <div style={{maxWidth: '100%'}}>
            <span style={styles.breadcrumb}>Dashboard / Mercadão / {empresa.name}</span>
            <h2 style={{...styles.pageTitle, fontSize: isMobile ? '1.3rem' : '1.75rem'}}>{empresa.name}</h2>
          </div>
          <button style={{...styles.btnSettings, width: isMobile ? '100%' : 'auto', justifyContent: 'center'}} onClick={() => router.push('/mercadao')}>
            <ArrowLeft size={20} /> Voltar
          </button>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', 
          gap: isMobile ? '20px' : '25px', 
          width: '100%' 
        }}>
          
          {/* CATÁLOGO */}
          <section style={{...styles.card, padding: isMobile ? '20px 15px' : '32px'}}>
            <h4 style={{fontSize: '0.9rem', color: '#00ff90', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Package size={16}/> Produtos Disponíveis
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {empresa.crafts?.map(produto => (
                <div key={produto.id} style={styles.itemCard}>
                  <span style={{ color: '#d4a91c', fontWeight: 'bold', fontSize: '0.9rem' }}>{produto.name}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#00ff90', fontWeight: 'bold' }}>${Number(produto.price).toFixed(2)}</span>
                    <small style={{ color: '#555' }}>/{produto.unit || 'un'}</small>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <input 
                      type="number" 
                      min="1"
                      value={quantidadesSelecionadas[produto.id] || 1}
                      onChange={(e) => handleQtdChange(produto.id, e.target.value)}
                      style={styles.inputQtd} 
                    />
                    <button onClick={() => adicionarAoCarrinho(produto)} style={styles.btnAdd}>ADICIONAR</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CARRINHO / ORDEM DE COMPRA */}
          <div style={isMobile ? styles.cartMobile : styles.cartSticky}>
            <h4 style={styles.cartHeader}>
              <ShoppingCart size={16} /> ORDEM DE COMPRA
            </h4>
            <div style={{...styles.cartList, maxHeight: isMobile ? 'none' : '400px'}}>
              {carrinho.length === 0 ? (
                <span style={{color: '#4b5563', fontSize: '0.85rem', textAlign: 'center', display: 'block'}}>Carrinho vazio...</span>
              ) : (
                carrinho.map(item => (
                  <div key={item.id} style={styles.cartItem}>
                    <div style={{minWidth: 0, flex: 1}}>
                      <div style={{fontSize: '0.85rem', color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.nome}</div>
                      <div style={{fontSize: '0.75rem', color: '#888'}}>x{item.qtd} — ${(Number(item.preco) * item.qtd).toFixed(2)}</div>
                    </div>
                    <button onClick={() => removerDoCarrinho(item.id)} style={styles.btnRemove}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {carrinho.length > 0 && (
              <div style={styles.cartTotal}>
                <span>TOTAL:</span>
                <span style={{color: '#00ff90'}}>$ {totalCarrinho.toFixed(2)}</span>
              </div>
            )}

            <button 
              onClick={enviarProposta}
              disabled={enviandoPedido || carrinho.length === 0}
              style={{
                ...styles.btnSubmit,
                background: (enviandoPedido || carrinho.length === 0) ? '#1f2127' : '#d4a91c',
                color: (enviandoPedido || carrinho.length === 0) ? '#444' : '#000',
                height: isMobile ? '55px' : '45px' // Botão maior no mobile
              }}
            >
              {enviandoPedido ? 'Enviando...' : 'CONFIRMAR PEDIDO'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  layoutWrapper: { 
    display: 'flex', 
    minHeight: '100dvh', 
    width: '100%', 
    backgroundColor: '#07080a', 
    color: '#d1d5db', 
    fontFamily: '"Inter", sans-serif',
    overflowX: 'hidden'
  },
  mainContent: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px', 
    width: '100%',
    boxSizing: 'border-box'
  },
  mainHeader: { display: 'flex', justifyContent: 'space-between' },
  breadcrumb: { fontSize: '0.65rem', color: '#4b5563', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' },
  pageTitle: { fontWeight: '800', color: '#fff', margin: '4px 0' },
  btnSettings: { background: '#161922', border: '1px solid #1c1f26', color: '#9ca3af', padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' },
  card: { background: '#0d0f14', border: '1px solid #1c1f26', borderRadius: '16px', boxSizing: 'border-box' },
  itemCard: { background: '#161922', padding: '15px', borderRadius: '12px', border: '1px solid #2d2d2d', display: 'flex', flexDirection: 'column', gap: '6px' },
  inputQtd: { width: '70px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '8px', padding: '10px', textAlign: 'center', fontSize: '1rem' },
  btnAdd: { flex: 1, background: '#d4a91c', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' },
  
  // Carrinho Estilos
  cartSticky: { position: 'sticky', top: '20px', background: '#161922', padding: '25px', borderRadius: '12px', border: '1px solid #3d2b1f', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', height: 'fit-content' },
  cartMobile: { background: '#161922', padding: '20px', borderRadius: '16px', border: '1px solid #3d2b1f', marginBottom: '30px' },
  
  cartHeader: { fontSize: '0.85rem', color: '#d4a91c', marginBottom: '20px', borderBottom: '1px solid #3d2b1f', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' },
  cartList: { overflowY: 'auto', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
  cartItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' },
  btnRemove: { background: 'none', border: 'none', color: '#ff4c4c', cursor: 'pointer', padding: '8px' },
  cartTotal: { marginTop: '10px', borderTop: '1px dashed #3d2b1f', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontWeight: 'bold', fontSize: '1.1rem' },
  btnSubmit: { width: '100%', borderRadius: '10px', border: 'none', fontWeight: '900', letterSpacing: '1px', transition: '0.2s', touchAction: 'manipulation' }
};