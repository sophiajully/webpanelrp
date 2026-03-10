import React from 'react';
import { Scroll, Trash2 } from "lucide-react";

export default function AvisosTab({ 
  session, 
  styles, 
  newNotice, 
  setNewNotice, 
  announcements, 
  handlePostNotice, 
  handleDeleteNotice 
}) {
  return (
    <div id="tab-avisos" style={styles.pageContent}>
      
      {/* FORMULÁRIO: SÓ APARECE PARA QUEM TEM CANADMIN */}
      {(session?.user?.role?.isOwner || session?.user?.role?.canAdmin) && (
        <div style={{...styles.card, borderLeft: '4px solid var(--cor-primaria, #d4a91c)'}}>
          <div style={styles.cardHeader}>
            <div style={styles.headerIcon}><Scroll size={18} /></div>
            <h3>Publicar Novo Edital</h3>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <input 
              placeholder="Título do Aviso (Ex: Reunião no Celeiro)" 
              style={styles.baseInput}
              value={newNotice.title}
              onChange={e => setNewNotice({...newNotice, title: e.target.value})}
            />
            <textarea 
              placeholder="Escreva as ordens ou informações aqui..." 
              style={{...styles.baseInput, minHeight: '100px', resize: 'vertical'}}
              value={newNotice.content}
              onChange={e => setNewNotice({...newNotice, content: e.target.value})}
            />
            <label style={{...styles.checkLabel, width: 'fit-content', padding: '10px', borderRadius: '7px'}}>
              <input 
                type="checkbox"
                checked={newNotice.priority}
                onChange={e => setNewNotice({...newNotice, priority: e.target.checked})}
              />
              <span style={{color: newNotice.priority ? '#ff4c4c' : '#888', marginLeft: '8px'}}>Urgente</span>
            </label>
            <button style={{...styles.baseButton, ...styles.buttonPrimary}} onClick={handlePostNotice}>
              Fixar no Mural
            </button>
          </div>
        </div>
      )}

      {/* LISTA DE ANÚNCIOS */}
      <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
        {announcements.length === 0 && (
          <p style={{textAlign: 'center', color: '#666'}}>Nenhum edital fixado no momento.</p>
        )}
        
        {announcements.map((notice) => (
          <div key={notice.id} style={{
            ...styles.card, 
            border: notice.priority ? '1px solid #ff4c4c' : styles.card.border,
            position: 'relative',
            background: notice.priority ? 'rgba(255, 76, 76, 0.02)' : styles.card.background
          }}>
            {notice.priority && (
              <div style={{position: 'absolute', top: '-10px', right: '20px', background: '#ff4c4c', color: '#fff', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold'}}>
                URGENTE
              </div>
            )}
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
              <div>
                <h4 style={{color: notice.priority ? '#ff4c4c' : '#d4a91c', margin: 0, fontSize: '1.1rem'}}>{notice.title}</h4>
                <small style={{color: '#555', fontSize: '0.7rem'}}>Postado por {notice.author} em {new Date(notice.createdAt).toLocaleDateString()}</small>
              </div>
              
              {session?.user?.role?.canAdmin && (
                <button onClick={() => handleDeleteNotice(notice.id)} style={{background: 'none', border: 'none', color: '#444', cursor: 'pointer'}}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            
            <p style={{color: '#9ca3af', fontSize: '0.9rem', whiteSpace: 'pre-line', lineHeight: '1.5'}}>
              {notice.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}