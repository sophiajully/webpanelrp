"use client";
import { useState } from "react";
import { UserPlus, CheckCircle, Loader2 } from "lucide-react";

export default function HireButton({ companyId, viewerId, hasApplied }) {
  const [status, setStatus] = useState(hasApplied ? "applied" : "idle");

  async function handleApply() {
    if (status !== "idle") return;
    
    setStatus("loading");

    try {
      const res = await fetch("/api/hire-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // ESSENCIAL para a API ler o companyId
        },
        body: JSON.stringify({ companyId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("applied");
      } else {
        // Se a API retornar erro (ex: já pediu emprego), mostra o porquê
        alert(data.error || "Erro ao solicitar emprego");
        setStatus("idle");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro de conexão com o servidor");
      setStatus("idle");
    }
  }

  // Se já solicitou, mostra o selo de enviado
  if (status === "applied") {
    return (
      <div style={{ 
        color: '#28a745', 
        fontSize: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        background: 'rgba(40, 167, 69, 0.1)',
        padding: '4px 8px',
        borderRadius: '6px',
        border: '1px solid rgba(40, 167, 69, 0.2)'
      }}>
        <CheckCircle size={14} /> Solicitado
      </div>
    );
  }

  return (
    <button 
      onClick={(e) => {
        e.preventDefault(); // Evita qualquer comportamento estranho de formulário
        handleApply();
      }}
      disabled={status === "loading"}
      style={{
        background: 'rgba(255,76,76,0.1)',
        border: '1px solid #ff4c4c',
        color: '#ff4c4c',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: status === "loading" ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s'
      }}
    >
      {status === "loading" ? (
        <>
          <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> 
          Enviando...
        </>
      ) : (
        <>
          <UserPlus size={14} />
          Pedir Emprego
        </>
      )}
    </button>
  );
}

// Pequeno truque caso você não use Tailwind para o Loader2 girar:
if (typeof document !== 'undefined' && !document.getElementById('spin-style')) {
  const style = document.createElement('style');
  style.id = 'spin-style';
  style.innerHTML = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`;
  document.head.appendChild(style);
}