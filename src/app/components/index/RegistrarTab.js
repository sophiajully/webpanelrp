'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Hammer, Calculator, Trash2, Package, X, Plus, Loader2 } from "lucide-react";
import { submitServerAction } from "@/app/actions/appActions"; 

export default function RegistrarTab({ styles }) {
  const [craftList, setCraftList] = useState([]);
  const [producaoQtds, setProducaoQtds] = useState({});
  const [insumosCalculados, setInsumosCalculados] = useState({});
  const [detalhamento, setDetalhamento] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [novoCraft, setNovoCraft] = useState({
    name: "", unit: 0, price: 0, insumos: [{ item: "", qtd: "" }]
  });

  const fetchCrafts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await submitServerAction('/crafts', 'GET');
      const list = Array.isArray(data) ? data : (data?.data || []);
      setCraftList(list);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCrafts(); }, [fetchCrafts]);

  const getMateriaisValidos = (craft) => {
    const data = craft.insumos || [];
    if (Array.isArray(data)) return data;
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  };

  const calcularTotais = () => {
    const totaisGerais = {};
    const detalheIndividual = {};
    let temCalculo = false;

    craftList.forEach(craft => {
      const id = craft.id || craft._id;
      const qtdDesejada = parseFloat(producaoQtds[id]) || 0;
      
      if (qtdDesejada > 0) {
        const materiais = getMateriaisValidos(craft);
        
        if (materiais.length > 0) {
          temCalculo = true;
          detalheIndividual[id] = [];

          materiais.forEach(m => {
            const qtdBase = parseFloat(m.qtd) || 0;
            const rendimento = parseFloat(craft.unit) || 1; 
            const totalNecessario = (qtdBase / rendimento) * qtdDesejada;
            
            // CORREÇÃO: Usa 'nome' ou 'item' para não virar 'undefined'
            const nomeInsumo = m.nome || m.item || "Insumo s/ nome";
            
            totaisGerais[nomeInsumo] = (totaisGerais[nomeInsumo] || 0) + totalNecessario;
            detalheIndividual[id].push({ item: nomeInsumo, qtd: totalNecessario });
          });
        }
      }
    });

    if (!temCalculo) return window.showToast("Digite uma quantidade em algum item!", 'error');
    
    setInsumosCalculados(totaisGerais);
    setDetalhamento(detalheIndividual);
  };

  const salvarReceita = async () => {
    if (!novoCraft.name || novoCraft.insumos.some(m => !m.item || !m.qtd)) return window.showToast("Preencha tudo!", 'error');
    setLoading(true);
    try {
        // CORREÇÃO: Mapeia para o formato que seu banco espera (nome e qtd)
        const insumosFormatados = novoCraft.insumos.map(i => ({
            nome: i.item, 
            qtd: i.qtd
        }));

        await submitServerAction('/crafts', 'POST', {
            name: novoCraft.name,
            unit: novoCraft.unit,
            insumos: insumosFormatados,
            price: novoCraft.price
        });

        window.showToast(`Craft ${novoCraft.name} foi registrado!`, 'success')
        setIsModalOpen(false);
        setNovoCraft({ name: "", unit: 1, price: 0, insumos: [{ item: "", qtd: "" }] });
        fetchCrafts();
        

    } catch (err) { window.showToast("Erro ao salvar", 'error'); }
    finally { setLoading(false); }
  };

  // ... (excluirReceita permanece igual)
  const excluirReceita = async (id) => {
    if (!await window.askConfirm("Excluir?")) return;
    await submitServerAction(`/crafts?id=${id}`, 'DELETE');
    fetchCrafts();
  };

  return (
    <div id="tab-registrar" style={{...styles.pageContent, display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '100px'}}>
      
      <div style={{ maxWidth: '850px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{color: '#fff'}}>Painel de Produção</h2>
        <button style={{...styles.baseButton, ...styles.buttonPrimary, width: 'auto'}} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nova Receita
        </button>
      </div>

      <div style={{...styles.card, maxWidth: '850px', width: '100%', margin: '0 auto', padding: '0'}}>
        <div style={{...styles.cardHeader, padding: '15px 20px'}}>
          <Calculator size={18} />
          <h3>Cálculo de Necessidades</h3>
        </div>
        
        <div style={{maxHeight: '400px', overflowY: 'auto', padding: '20px'}}>
          {craftList.map((item) => {
            const itemId = item.id || item._id;
            const matsCalculados = detalhamento[itemId];
            const matsBase = getMateriaisValidos(item);

            return (
              <div key={itemId} style={{
                background: matsCalculados ? 'rgba(212, 169, 28, 0.05)' : '#161922', 
                padding: '15px', borderRadius: '8px', marginBottom: '10px',
                border: matsCalculados ? '1px solid var(--cor-primaria)' : '1px solid #2d2d2d'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div style={{fontWeight: 'bold', color: '#fff'}}>{item.name}</div>
                    <div style={{fontSize: '0.8rem', color: '#888'}}>Rende: {item.unit} un.</div>
                  </div>

                  <div style={{display: 'flex', gap: '10px'}}>
                    <input 
                      type="number" 
                      placeholder="Qtd"
                      value={producaoQtds[itemId] || ""} 
                      onChange={(e) => setProducaoQtds({...producaoQtds, [itemId]: e.target.value})}
                      style={{...styles.producaoInput, width: '70px', textAlign: 'center'}} 
                    />
                    <button onClick={() => excluirReceita(itemId)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>

                <div style={{marginTop: '10px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px'}}>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px'}}>
                    {(matsCalculados || matsBase).map((m, i) => (
                      <div key={i} style={{fontSize: '0.85rem', color: matsCalculados ? 'var(--cor-primaria)' : '#aaa'}}>
                        {/* CORREÇÃO: m.nome || m.item */}
                        {m.nome || m.item || "Item"}: <b>{matsCalculados ? Math.ceil(m.qtd) : m.qtd}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{padding: '20px', borderTop: '1px solid #333'}}>
          <button style={{...styles.baseButton, ...styles.buttonPrimary, width: '100%'}} onClick={calcularTotais}>
            CALCULAR MATERIAIS AGORA
          </button>
        </div>
      </div>

      {/* RESULTADO FINAL */}
      {Object.keys(insumosCalculados).length > 0 && (
        <div style={{...styles.card, maxWidth: '850px', width: '100%', margin: '0 auto', borderTop: '4px solid #00ff90'}}>
          <h3 style={{color: '#00ff90', padding: '15px'}}>Lista de Coleta Consolidada</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', padding: '0 15px 15px'}}>
              {Object.entries(insumosCalculados).map(([nome, qtd]) => (
                <div key={nome} style={{padding: '10px', background: '#0d0f14', borderRadius: '8px', textAlign: 'center', border: '1px solid #1c1f26'}}>
                  <div style={{color: '#888', fontSize: '0.7rem'}}>{nome}</div>
                  <div style={{color: 'var(--cor-primaria)', fontWeight: 'bold', fontSize: '1.2rem'}}>{Math.ceil(qtd)}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO */}
   {/* MODAL DE CADASTRO */}
{isModalOpen && (
  <div style={styles.modalOverlay}>
    <div style={{...styles.modalContent, maxWidth: '450px'}}>
      <div style={styles.modalHeader}>
        <h3>Nova Receita</h3>
        <button onClick={() => setIsModalOpen(false)} style={{background: 'none', border: 'none', color: '#fff'}}><X /></button>
      </div>
      
      <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
          {/* NOME DO PRODUTO */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
            <label style={{fontSize: '0.7rem', color: '#888', marginLeft: '5px'}}>NOME DO PRODUTO</label>
            <input style={styles.baseInput} placeholder="Ex: Algema" value={novoCraft.name} onChange={e => setNovoCraft({...novoCraft, name: e.target.value})} />
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
            {/* RENDIMENTO */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
              <label style={{fontSize: '0.7rem', color: '#888', marginLeft: '5px'}}>RENDIMENTO (UN)</label>
              <input type="number" style={styles.baseInput} value={novoCraft.unit} onChange={e => setNovoCraft({...novoCraft, unit: e.target.value})} />
            </div>
            {/* PREÇO */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
              <label style={{fontSize: '0.7rem', color: '#888', marginLeft: '5px'}}>PREÇO DE VENDA</label>
              <input type="number" style={styles.baseInput} value={novoCraft.price} onChange={e => setNovoCraft({...novoCraft, price: e.target.value})} />
            </div>
          </div>

          <div style={{padding: '10px', border: '1px solid #333', borderRadius: '8px', background: 'rgba(0,0,0,0.1)'}}>
            <div style={{fontSize: '0.7rem', color: 'var(--cor-primaria)', marginBottom: '10px', fontWeight: 'bold'}}>INSUMOS DA RECEITA</div>
            
            {novoCraft.insumos.map((m, idx) => (
              <div key={idx} style={{display: 'flex', gap: '5px', marginBottom: '8px'}}>
                <input style={{...styles.baseInput, flex: 2}} placeholder="Item" value={m.item} onChange={e => {
                  const n = [...novoCraft.insumos]; n[idx].item = e.target.value; setNovoCraft({...novoCraft, insumos: n});
                }} />
                <input style={{...styles.baseInput, flex: 1}} type="number" placeholder="Qtd" value={m.qtd} onChange={e => {
                  const n = [...novoCraft.insumos]; n[idx].qtd = e.target.value; setNovoCraft({...novoCraft, insumos: n});
                }} />
                <button onClick={() => setNovoCraft({...novoCraft, insumos: novoCraft.insumos.filter((_, i) => i !== idx)})} style={{color: '#f44', padding: '0 5px'}}>✕</button>
              </div>
            ))}
            
            <button onClick={() => setNovoCraft({...novoCraft, insumos: [...novoCraft.insumos, {item: "", qtd: ""}]})} style={{fontSize: '0.7rem', color: '#00ff90', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <Plus size={12} /> Adicionar Insumo
            </button>
          </div>

          <button style={{...styles.baseButton, ...styles.buttonPrimary}} onClick={salvarReceita} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Salvar Receita"}
          </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}