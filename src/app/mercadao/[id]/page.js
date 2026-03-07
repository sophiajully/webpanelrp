"use client";

import { useEffect, useState, use } from "react"; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Trash2 } from "lucide-react";

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

  useEffect(() => {
    async function carregarDadosEmpresa() {
      if (!id) return;
      setLoading(true);
      try {
        // CHAMADA PARA A NOVA API ESPECÍFICA
        const res = await fetch(`/api/companies/${id}`); 
        const data = await res.json();
        
        if (data.error) {
          console.error(data.error);
          setEmpresa(null);
        } else {
          setEmpresa(data);
        }
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
    // 1. Pega a quantidade do input (garante que é número e positivo)
    const qtdInformada = Math.max(1, parseInt(quantidadesSelecionadas[produto.id] || 1));

    // 3. Trava de segurança: Máximo de itens diferentes no carrinho (ex: 20 produtos diferentes)
    if (carrinho.length >= 10 && !carrinho.find(i => i.id === produto.id)) {
      alert("⚠️ Seu carrinho já tem muitos produtos diferentes. Remova algum para adicionar este.");
      return;
    }

    setCarrinho(prev => {
      const existente = prev.find(i => i.id === produto.id);

      if (existente) {
        const novaQtd = existente.qtd + qtdInformada;

        return prev.map(i => i.id === produto.id ? { ...i, qtd: novaQtd } : i);
      }

      // Se não existe, adiciona novo item
      return [...prev, { id: produto.id, nome: produto.name, preco: produto.price, qtd: qtdInformada }];
    });
    
    // Reseta o input para 1 após adicionar
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

    console.log("EMPRESA", session.user)

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
                  { name: "👤 Cliente", value: session?.user?.name || "Desconhecido", inline: true },
                  { name: "🏢 Empresa do Cliente", value: session?.user?.companyName || "SafraLog", inline: true },
                  { name: "📫 Pombo", value: `${session?.user?.pombo || 'Não Informado'}`, inline: true }, // <--- O LINK DO POMBO AQUI
                  { name: "💰 Valor total", value: `**$ ${total.toFixed(2)}**` },
                  { name: "📝 Itens", value: itensTexto },
                ],
                footer: { text: `Mercadão SafraLog | Fornecedor: ${empresa.name}` },
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

  if (loading) return <div style={styles.layoutWrapper}><h2 style={{margin: 'auto', color: '#d4a91c'}}>Carregando fornecedor...</h2></div>;
  if (!empresa) return <div style={styles.layoutWrapper}><h2 style={{margin: 'auto', color: '#ff4c4c'}}>Fornecedor não encontrado.</h2></div>;

  return (
    <div style={styles.layoutWrapper}>
      <main style={styles.mainContent}>
        <header style={styles.mainHeader}>
          <div>
            <span style={styles.breadcrumb}>Dashboard / Mercadão / {empresa.name}</span>
            <h2 style={styles.pageTitle}>Catálogo: {empresa.name}</h2>
          </div>
          <button style={styles.btnSettings} onClick={() => router.push('/mercadao')}>
            <ArrowLeft size={20} /> Voltar
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', alignItems: 'flex-start' }}>
          
          <section style={styles.card}>
            <h4 style={{fontSize: '0.9rem', color: '#00ff90', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Package size={16}/> Itens de {empresa.name}
            </h4>
            
            {(!empresa.crafts || empresa.crafts.length === 0) ? (
              <p style={{color: '#666'}}>Nenhum produto disponível.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                {empresa.crafts.map(produto => (
                  <div key={produto.id} style={styles.itemCard}>
                    <span style={{ color: '#d4a91c', fontWeight: 'bold', fontSize: '0.9rem' }}>{produto.name}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#00ff90', fontWeight: 'bold' }}>${Number(produto.price).toFixed(2)}</span>
                      <small style={{ color: '#555' }}>/{produto.unit || 'un'}</small>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input 
                        type="number" 
                        min="1"
                        value={quantidadesSelecionadas[produto.id] || 1}
                        onChange={(e) => handleQtdChange(produto.id, e.target.value)}
                        style={styles.inputQtd} 
                      />
                      <button onClick={() => adicionarAoCarrinho(produto)} style={styles.btnAdd}>ADD</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div style={styles.cartSticky}>
            <h4 style={styles.cartHeader}>📝 ORDEM DE COMPRA</h4>
            <div style={styles.cartList}>
              {carrinho.length === 0 ? (
                <span style={{color: '#4b5563', fontSize: '0.9rem'}}>Seu carrinho está vazio...</span>
              ) : (
                carrinho.map(item => (
                  <div key={item.id} style={styles.cartItem}>
                    <div>
                      <div style={{fontSize: '0.85rem', color: '#eee'}}>{item.nome}</div>
                      <div style={{fontSize: '0.75rem', color: '#888'}}>x{item.qtd} — ${(Number(item.preco) * item.qtd).toFixed(2)}</div>
                    </div>
                    <button onClick={() => removerDoCarrinho(item.id)} style={styles.btnRemove}>
                      <Trash2 size={14} />
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
                background: (enviandoPedido || carrinho.length === 0) ? '#333' : '#d4a91c',
                cursor: (enviandoPedido || carrinho.length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {enviandoPedido ? 'Enviando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  layoutWrapper: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#07080a', color: '#d1d5db', fontFamily: '"Inter", sans-serif' },
  mainContent: { flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' },
  mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  breadcrumb: { fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', fontWeight: '600' },
  pageTitle: { fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginTop: '4px' },
  btnSettings: { background: '#161922', border: '1px solid #1c1f26', color: '#9ca3af', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' },
  card: { background: '#0d0f14', border: '1px solid #1c1f26', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
  itemCard: { background: '#161922', padding: '15px', borderRadius: '10px', border: '1px solid #2d2d2d', display: 'flex', flexDirection: 'column', gap: '8px' },
  inputQtd: { width: '60px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '5px', textAlign: 'center' },
  btnAdd: { flex: 1, background: '#d4a91c', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  cartSticky: { position: 'sticky', top: '20px', background: '#161922', padding: '25px', borderRadius: '12px', border: '1px solid #3d2b1f', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  cartHeader: { fontSize: '0.85rem', color: '#d4a91c', marginBottom: '20px', borderBottom: '1px solid #3d2b1f', paddingBottom: '10px' },
  cartList: { maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  cartItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' },
  btnRemove: { background: 'none', border: 'none', color: '#ff4c4c', cursor: 'pointer', padding: '5px' },
  cartTotal: { marginTop: '15px', borderTop: '1px dashed #3d2b1f', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontWeight: 'bold' },
  btnSubmit: { width: '100%', height: '45px', borderRadius: '8px', border: 'none', fontWeight: 'bold', color: '#000', transition: '0.2s' }
};