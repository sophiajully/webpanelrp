import React from 'react';

export default function ChatTab({ session }) {
  // Pegamos o username ou o name da sessão para o nickname do chat
  const nickname = session?.user?.username || session?.user?.name || '';

  return (
    <div 
      id="tab-chat" 
      style={{
        display: 'flex', 
        height: 'calc(100vh - 160px)', 
        flexDirection: 'column',
        padding: '10px',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
    >
      <div style={{
        flex: 1,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        background: '#1a1a1a',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}>
        <iframe 
          src={`https://organizations.minnit.chat/974651312171058/c/Main?embed&nickname=${encodeURIComponent(nickname)}`}
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 'none' 
          }} 
          title="Chat Interno"
          allow="geolocation; microphone; camera; fullscreen"
        />
      </div>
      
      {/* Aviso discreto sobre moderação */}
      <small style={{ color: '#666', marginTop: '8px', textAlign: 'center', fontSize: '0.75rem' }}>
        Chat Interno — Mantenha o profissionalismo e respeite as regras da empresa.
      </small>
    </div>
  );
}