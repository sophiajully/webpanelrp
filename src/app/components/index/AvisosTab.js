'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Scroll, Trash2, Loader2, Megaphone } from "lucide-react";
import { submitServerAction } from "@/app/actions/appActions"; 
// 1. IMPORTAR A BIBLIOTECA
import ReactMarkdown from 'react-markdown';

export default function AvisosTab({ session, styles }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issubmitting, setIsSubmitting] = useState(false);
  
  const [newNotice, setNewNotice] = useState({ 
    title: "", 
    content: "", 
    priority: false 
  });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await submitServerAction('/announcements', 'GET');
      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Erro ao carregar avisos:", error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePostNotice = async () => {
    if (!newNotice.title || !newNotice.content) {
      return window.showToast("Preencha o título e o conteúdo do aviso.", 'error');
    }

    setIsSubmitting(true);
    try {
      const res = await submitServerAction('/announcements', 'POST', {
        ...newNotice,
        author: session?.user?.name || "Administração"
      });

      if (res.error) throw new Error(res.error);

      setNewNotice({ title: "", content: "", priority: false });
      fetchAnnouncements();
    } catch (err) {
      window.showToast("Erro ao publicar aviso: " + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!await window.askConfirm("Deseja remover este aviso do mural?")) return;
    
    try {
      const res = await submitServerAction(`/announcements?id=${id}`, 'DELETE');
      if (res.error) throw new Error(res.error);
      
      fetchAnnouncements();
    } catch (err) {
      window.showToast("Erro ao deletar aviso.", 'error');
    }
  };

  const canAdmin = session?.user?.role?.isOwner || session?.user?.role?.canAdmin;

  return (
    <div id="tab-avisos" style={styles.pageContent}>
      
      {canAdmin && (
        <div style={{...styles.card, borderLeft: '4px solid var(--cor-primaria, #d4a91c)', marginBottom: '30px'}}>
          <div style={styles.cardHeader}>
            <div style={styles.headerIcon}><Scroll size={18} /></div>
            <h3>Publicar Novo Edital</h3>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <input 
              placeholder="Título do Aviso" 
              style={styles.baseInput}
              value={newNotice.title}
              onChange={e => setNewNotice({...newNotice, title: e.target.value})}
            />
            <textarea 
              placeholder="Suporta Markdown! Use **negrito**, # Títulos ou - Listas..." 
              style={{...styles.baseInput, minHeight: '120px', resize: 'vertical', fontFamily: 'monospace'}}
              value={newNotice.content}
              onChange={e => setNewNotice({...newNotice, content: e.target.value})}
            />
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none'}}>
                <input 
                  type="checkbox"
                  checked={newNotice.priority}
                  onChange={e => setNewNotice({...newNotice, priority: e.target.checked})}
                />
                <span style={{color: newNotice.priority ? '#ff4c4c' : '#888', fontSize: '0.9rem', fontWeight: newNotice.priority ? 'bold' : 'normal'}}>
                  Marcar como Urgente
                </span>
              </label>

              <button 
                style={{...styles.baseButton, ...styles.buttonPrimary, minWidth: '150px'}} 
                onClick={handlePostNotice}
                disabled={issubmitting}
              >
                {issubmitting ? <Loader2 size={18} className="animate-spin" /> : "Fixar no Mural"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
            <Megaphone size={20} color="var(--cor-primaria)" />
            <h3 style={{margin: 0, color: '#fff'}}>Mural de Avisos</h3>
        </div>

        {loading ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
            <Loader2 size={30} className="animate-spin" style={{margin: '0 auto'}} />
            <p>Buscando editais...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div style={{...styles.card, textAlign: 'center', padding: '40px', color: '#666', border: '1px dashed #333'}}>
             Nenhum edital fixado no momento.
          </div>
        ) : (
          announcements.map((notice) => (
            <div key={notice.id} style={{
              ...styles.card, 
              border: notice.priority ? '1px solid #ff4c4c' : '1px solid #2d2d2d',
              position: 'relative',
              background: notice.priority ? 'rgba(255, 76, 76, 0.03)' : '#161922'
            }}>
              {notice.priority && (
                <div style={{position: 'absolute', top: '-10px', right: '20px', background: '#ff4c4c', color: '#fff', fontSize: '0.65rem', padding: '2px 10px', borderRadius: '4px', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(255,76,76,0.3)'}}>
                  URGENTE
                </div>
              )}
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                <div>
                  <h4 style={{color: notice.priority ? '#ff4c4c' : 'var(--cor-primaria)', margin: 0, fontSize: '1.2rem', fontWeight: 'bold'}}>{notice.title}</h4>
                  <div style={{marginTop: '4px'}}>
                    <small style={{color: '#666', fontSize: '0.75rem'}}>
                      Por <span style={{color: '#aaa'}}>{notice.author}</span> • {new Date(notice.createdAt).toLocaleDateString('pt-BR')}
                    </small>
                  </div>
                </div>
                
                {canAdmin && (
                  <button 
                    onClick={() => handleDeleteNotice(notice.id)} 
                    style={{background: 'rgba(255,255,255,0.05)', border: 'none', color: '#555', cursor: 'pointer', padding: '8px', borderRadius: '5px'}}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              {/* 2. SUBSTITUIR O <P> PELO COMPONENTE DE MARKDOWN */}
              <div className="markdown-container" style={{color: '#d1d5db', fontSize: '0.95rem', lineHeight: '1.6'}}>
                <ReactMarkdown>{notice.content}</ReactMarkdown>
              </div>

            </div>
          ))
        )}
      </div>

      {/* 3. ESTILIZAÇÃO PARA O MARKDOWN NÃO QUEBRAR O LAYOUT */}
      <style jsx global>{`
        .markdown-container h1, .markdown-container h2, .markdown-container h3 {
          color: var(--cor-primaria);
          margin-top: 15px;
          margin-bottom: 8px;
        }
        .markdown-container p {
          margin-bottom: 10px;
        }
        .markdown-container ul, .markdown-container ol {
          margin-left: 20px;
          margin-bottom: 10px;
        }
        .markdown-container strong {
          color: #fff;
        }
        .markdown-container code {
          background: rgba(255,255,255,0.1);
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}