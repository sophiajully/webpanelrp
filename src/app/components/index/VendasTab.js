'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, ClipboardList, X, FileText, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { submitServerAction } from "@/app/actions/appActions"; 

export default function VendasTab({ styles, states, actions, display }) {
    // Estados do Modal e UI vindos do componente pai
    const { isModalVendaOpen } = states;
    const { setIsModalVendaOpen } = actions;

    // Estados Locais para a lógica de Vendas
    const [pedidos, setPedidos] = useState([]);
    const [crafts, setCrafts] = useState([]);
    const [encomendaAtual, setEncomendaAtual] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Estados dos Inputs do Formulário
    const [cliente, setCliente] = useState({ nome: "", contato: "" });
    const [itemInput, setItemInput] = useState({ nome: "", qtd: "" });

    // --- CARREGAMENTO DE DADOS ---

    const carregarDados = useCallback(async () => {
        setLoading(true);
        try {
            const [dataCrafts, dataPedidos] = await Promise.all([
                submitServerAction('/crafts', 'GET'),
                submitServerAction('/pedidos', 'GET')
            ]);

            if (Array.isArray(dataCrafts)) setCrafts(dataCrafts);
            if (Array.isArray(dataPedidos)) setPedidos(dataPedidos);
        } catch (err) {
            console.error("Erro ao carregar dados de vendas:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // --- LÓGICA DA ENCOMENDA (CARRINHO) ---

    const adicionarItem = () => {
        if (!itemInput.nome || !itemInput.qtd || itemInput.qtd <= 0) {
            return window.showToast("Selecione um produto e uma quantidade válida.", 'error');
        }

        const produtoRef = crafts.find(c => c.name === itemInput.nome);
        const novoItem = {
            nome: itemInput.nome,
            qtd: parseInt(itemInput.qtd),
            precoUn: produtoRef?.price || 0
        };

        setEncomendaAtual(prev => [...prev, novoItem]);
        setItemInput({ ...itemInput, qtd: "" }); // Limpa apenas a quantidade
    };

    const removerItemCarrinho = (index) => {
        setEncomendaAtual(prev => prev.filter((_, i) => i !== index));
    };

    // --- AÇÕES DE SERVIDOR (SERVER ACTIONS) ---

    const finalizarEncomenda = async () => {
        if (!cliente.nome || encomendaAtual.length === 0) {
            return window.showToast("Preencha o nome do cliente e adicione itens.", 'error');
        }

        setLoading(true);
        try {
            const res = await submitServerAction('/pedidos', 'POST', {
                name: cliente.nome,
                pombo: cliente.contato || "Não informado",
                produtos: encomendaAtual
            });

            if (res.error) throw new Error(res.error);

            window.showToast("Encomenda registrada com sucesso!", 'success');
            setEncomendaAtual([]);
            setCliente({ nome: "", contato: "" });
            setIsModalVendaOpen(false);
            carregarDados()
        } catch (err) {
            window.showToast("Erro ao finalizar: " + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const alterarStatus = async (id, status) => {
        try {
            await submitServerAction('/pedidos', 'PATCH', { id, status });
            carregarDados();
        } catch (err) {
            window.showToast("Erro ao atualizar status.", 'error');
        }
    };

    const excluirPedido = async (id) => {
        if (!confirm("Deseja excluir este pedido permanentemente?")) return;
        try {
            await submitServerAction(`/pedidos?id=${id}`, 'DELETE');
            carregarDados();
        } catch (err) {
            window.showToast("Erro ao excluir pedido.", 'error');
        }
    };

    if(!display) return;

    return (
        <div id="tab-vendas" style={styles.pageContent}>
            
            <div style={{ width: '100%', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button 
                    style={{...styles.baseButton, ...styles.buttonPrimary}} 
                    onClick={() => setIsModalVendaOpen(true)}
                >
                    <ShoppingCart size={18} /> Nova Encomenda
                </button>
            </div>

            {/* Lista de Pedidos */}
            <div style={{...styles.card, width: '100%', width: '100%', margin: '0 auto'}}>
                <div style={styles.cardHeader}>
                    <div style={styles.headerIcon}><ClipboardList size={18} /></div>
                    <h3>Histórico de Vendas</h3>
                </div>
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loading && pedidos.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666' }}><Loader2 className="animate-spin" /> Carregando...</div>
                    ) : pedidos.map(p => (
                        <div key={p.id} style={{ background: '#161625', padding: '15px', borderRadius: '10px', borderLeft: `4px solid ${p.status === 'finalizado' ? '#00ff90' : '#f1c40f'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong style={{ color: '#fff' }}>👤 {p.name}</strong>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {p.status !== 'finalizado' && (
                                        <button onClick={() => alterarStatus(p.id, 'finalizado')} style={{ color: '#00ff90', background: 'none', border: 'none', cursor: 'pointer' }}><CheckCircle size={18}/></button>
                                    )}
                                    <button onClick={() => excluirPedido(p.id)} style={{ color: '#ff4c4c', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18}/></button>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                                {p.produtos?.map((item, idx) => (
                                    <div key={idx}>• {item.nome} <b style={{color: 'var(--cor-primaria)'}}>(x{item.qtd})</b></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de Encomenda */}
            {isModalVendaOpen && (
                <div style={styles.modalOverlay}>
                    <div style={{...styles.modalContent, maxWidth: '900px'}}>
                        <div style={styles.modalHeader}>
                            <h3 style={{margin: 0}}>Gerar Nova Encomenda</h3>
                            <button style={styles.btnCloseModal} onClick={() => setIsModalVendaOpen(false)}><X size={20} /></button>
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
                            {/* Inputs */}
                            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                <div style={{...styles.card, background: '#161922', padding: '15px'}}>
                                    <label style={styles.labelInput}>Cliente</label>
                                    <input value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value})} style={styles.baseInput} placeholder="Nome" />
                                    <label style={styles.labelInput}>Contato</label>
                                    <input value={cliente.contato} onChange={e => setCliente({...cliente, contato: e.target.value})} style={styles.baseInput} placeholder="ID/Pombo" />
                                </div>

                                <div style={{...styles.card, background: '#161922', padding: '15px'}}>
                                    <label style={styles.labelInput}>Produto</label>
                                    <select value={itemInput.nome} onChange={e => setItemInput({...itemInput, nome: e.target.value})} style={styles.baseInput}>
                                        <option value="">Selecione...</option>
                                        {crafts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <label style={styles.labelInput}>Qtd</label>
                                    <input type="number" value={itemInput.qtd} onChange={e => setItemInput({...itemInput, qtd: e.target.value})} style={styles.baseInput} />
                                    <button onClick={adicionarItem} style={{...styles.baseButton, ...styles.buttonPrimary, width: '100%', marginTop: '10px'}}>Adicionar</button>
                                </div>
                            </div>

                            {/* Resumo */}
                            <div style={{...styles.card, background: '#161922', padding: '15px', display: 'flex', flexDirection: 'column'}}>
                                <h4 style={{color: 'var(--cor-primaria)', fontSize: '0.8rem'}}>ITENS ADICIONADOS</h4>
                                <div style={{flex: 1, overflowY: 'auto', minHeight: '150px'}}>
                                    {encomendaAtual.map((item, idx) => (
                                        <div key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333', fontSize: '0.85rem'}}>
                                            <span>{item.nome} x{item.qtd}</span>
                                            <button onClick={() => removerItemCarrinho(idx)} style={{color: '#ff4c4c', background: 'none', border: 'none'}}>✕</button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={finalizarEncomenda} disabled={loading} style={{...styles.baseButton, ...styles.buttonOutline, width: '100%', marginTop: '15px'}}>
                                    {loading ? 'Processando...' : <><FileText size={16} /> Finalizar Pedido</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}