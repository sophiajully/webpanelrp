"use client"; // Arquivos de erro DEVEM ser Client Components

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Aqui você pode logar o erro em algum serviço como Sentry ou LogRocket
    console.error("Erro detectado:", error);
  }, [error]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>SISTEMA FORA DE OPERAÇÃO</h1>
      <p style={styles.text}>Ocorreu uma falha crítica nos registros da fronteira.</p>
      
      <button style={styles.button} onClick={() => reset()}>
        TENTAR RECONEXÃO
      </button>
      
      <a href="/" style={styles.link}>VOLTAR AO INÍCIO</a>
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050507', color: '#d4a91c', fontFamily: 'serif', textAlign: 'center' },
  title: { fontSize: '2.5rem', letterSpacing: '4px', borderBottom: '2px solid #d4a91c', marginBottom: '20px' },
  button: { padding: '15px 30px', background: '#d4a91c', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' },
  link: { color: '#888', marginTop: '20px', textDecoration: 'none', fontSize: '0.8rem' }
};