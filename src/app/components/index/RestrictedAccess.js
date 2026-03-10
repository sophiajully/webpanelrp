import React from 'react';
import { Shield } from "lucide-react";

export default function RestrictedAccess({ router, signOut, styles }) {
  return (
    <div style={{...styles.loadingScreen, background: '#0a0a0f', padding: '20px', textAlign: 'center'}}>
      <div style={{ 
        background: '#161625', 
        padding: '40px', 
        borderRadius: '16px', 
        border: '1px solid #2d2d3d', 
        maxWidth: '450px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <Shield size={48} color="var(--cor-primaria, #d4a91c)" style={{ marginBottom: '20px' }} />
        
        <h2 style={{ color: '#fff', marginBottom: '10px', fontSize: '1.5rem' }}>
          Acesso Restrito
        </h2>
        
        <p style={{ color: '#9ca3af', marginBottom: '25px', lineHeight: '1.5', fontSize: '0.95rem' }}>
          Você ainda não está vinculado a nenhuma empresa. Para utilizar o painel, você precisa solicitar a entrada em uma equipe.
        </p>
        
        <button 
          onClick={() => router.push('/empresas')}
          style={{ ...styles.baseButton, ...styles.buttonPrimary, width: '100%' }}
        >
          Procurar Empresas
        </button>
        
        <button 
          onClick={() => signOut()}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#6b7280', 
            marginTop: '20px', 
            cursor: 'pointer',
            fontSize: '0.85rem',
            textDecoration: 'underline'
          }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}