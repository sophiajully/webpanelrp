'use client'; // ISSO resolve o erro de interatividade (onClick)

import React from 'react';
import { Map, ChevronLeft, Home, Ghost } from "lucide-react";

export default function NotFoundPage() {
  
  const voltar = () => {
    if (typeof window !== 'undefined') window.history.back();
  };

  const irHome = () => {
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  return (
    <div style={styles.container}>
      {/* Camada de "Sujeira/Grão" para parecer papel velho */}
      <div style={styles.grainOverlay} />

      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <Map size={64} color="#d4a91c" strokeWidth={1.5} />
          <div style={styles.redCross} />
        </div>

        <h1 style={styles.bigNumber}>404</h1>
        <h2 style={styles.title}>TRILHA INTERROMPIDA</h2>
        
        <p style={styles.text}>
          Parece que você cavalgou para além das fronteiras do mapa conhecido, forasteiro. 
          Não há nada aqui além de coiotes e vento.
        </p>

        <div style={styles.buttonGroup}>
          <button onClick={voltar} style={styles.btnSecondary}>
            <ChevronLeft size={18} /> VOLTAR
          </button>
          
          <button onClick={irHome} style={styles.btnPrimary}>
            <Home size={18} /> IR PARA A DASHBOARD
          </button>
        </div>

        <div style={styles.footer}>
          <Ghost size={14} style={{ marginRight: '6px' }} />
          <span>ESTA ÁREA NÃO FOI MAPEADA PELO XERIFE.</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#07080a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  grainOverlay: {
    position: 'absolute',
    inset: 0,
    opacity: 0.03,
    pointerEvents: 'none',
    backgroundImage: `url('https://www.transparenttextures.com/patterns/stardust.png')`,
    zIndex: 1,
  },
  card: {
    backgroundColor: '#111318',
    border: '1px solid #1c1f26',
    borderRadius: '20px',
    padding: '50px 30px',
    width: '90%',
    maxWidth: '450px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    zIndex: 2,
  },
  iconContainer: {
    position: 'relative',
    display: 'inline-flex',
    marginBottom: '20px',
  },
  redCross: {
    position: 'absolute',
    top: '50%',
    left: '-10%',
    width: '120%',
    height: '3px',
    backgroundColor: '#ef4444',
    transform: 'rotate(-45deg)',
    borderRadius: '2px',
    boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
  },
  bigNumber: {
    fontSize: '80px',
    fontWeight: '900',
    color: '#d4a91c',
    margin: '0',
    opacity: '0.1',
    position: 'absolute',
    top: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: -1,
  },
  title: {
    fontSize: '22px',
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: '2px',
    margin: '10px 0 20px 0',
  },
  text: {
    color: '#71717a',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '35px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  btnPrimary: {
    flex: 2,
    backgroundColor: '#d4a91c',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontWeight: '800',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.2s',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    border: '1px solid #1c1f26',
    borderRadius: '10px',
    padding: '14px',
    fontWeight: '800',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  footer: {
    marginTop: '30px',
    fontSize: '10px',
    color: '#3f3f46',
    fontWeight: 'bold',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};