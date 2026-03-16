"use client";

import React, { useState } from "react";
import { 
  Send, Eye, EyeOff, Plus, Trash2, Image as ImageIcon, 
  User, MessageSquare, Layout, Type, Palette, Clock 
} from "lucide-react";

export default function WebhookTab({ display }) {
  // Configurações Base
  const [url, setUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  // Perfil do Bot
  const [botName, setBotName] = useState("");
  const [botAvatar, setBotAvatar] = useState("");

  // Conteúdo da Mensagem
  const [content, setContent] = useState("");

  // Estrutura do Embed
  const [embed, setEmbed] = useState({
    title: "",
    description: "",
    url: "",
    color: "#5865F2",
    timestamp: false,
    thumbnail: "",
    image: "",
    footer: { text: "", icon_url: "" },
    fields: []
  });

  if (!display) return null;

  // Funções de Gerenciamento
  const addField = () => {
    if (embed.fields.length >= 25) return; // Limite do Discord
    setEmbed({ ...embed, fields: [...embed.fields, { name: "", value: "", inline: true }] });
  };

  const updateField = (index, key, val) => {
    const newFields = [...embed.fields];
    newFields[index][key] = val;
    setEmbed({ ...embed, fields: newFields });
  };

  const removeField = (index) => {
    setEmbed({ ...embed, fields: embed.fields.filter((_, i) => i !== index) });
  };

const sendWebhook = async () => {
    // 1. Verificação de URL
    if (!url.startsWith("https://discord.com/api/webhooks/")) {
      return setStatus({ type: "error", msg: "URL do Webhook inválida!" });
    }

    // 2. Verificação de Conteúdo (Evitar envio vazio)
    const hasEmbed = embed.title || embed.description || embed.fields.length > 0;
    if (!content && !hasEmbed) {
      return setStatus({ type: "error", msg: "Escreva algo antes de enviar!" });
    }
    
    setStatus({ type: "loading", msg: "Despachando..." });

    const payload = {
      username: botName.trim() || undefined,
      avatar_url: botAvatar.trim() || undefined,
      content: content.trim() || undefined,
      embeds: hasEmbed ? [{
        title: embed.title || undefined,
        description: embed.description || undefined,
        url: embed.url || undefined,
        color: parseInt(embed.color.replace("#", ""), 16),
        fields: embed.fields.length > 0 ? embed.fields : undefined,
        image: embed.image ? { url: embed.image } : undefined,
        thumbnail: embed.thumbnail ? { url: embed.thumbnail } : undefined,
        footer: embed.footer.text ? { text: embed.footer.text, icon_url: embed.footer.icon_url } : undefined,
        timestamp: embed.timestamp ? new Date().toISOString() : undefined,
      }] : []
    };

    try {
      const response = await fetch(url.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus({ type: "success", msg: "Enviado com sucesso!" });
      } else {
        setStatus({ type: "error", msg: `Erro ${response.status}: Verifique os campos.` });
      }
    } catch (err) {
      console.error("Erro de Conexão:", err);
      setStatus({ type: "error", msg: "Erro de Conexão (CORS ou Rede)." });
    }

    setTimeout(() => setStatus({ type: "", msg: "" }), 5000);
  };

  return (
    <div style={containerStyle} className="fade-in">
      
      {/* HEADER E STATUS */}
      <header style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#fff", display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Send size={24} color="#5865F2"/> Discord Webhook Master
          </h2>
          <p style={{ color: "#888", margin: "5px 0 0 0" }}>Crie e dispare mensagens ricas com embeds personalizados.</p>
        </div>
        {status.msg && (
          <div style={{ 
            padding: '10px 20px', 
            borderRadius: '8px', 
            backgroundColor: status.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff', fontSize: '14px', fontWeight: 'bold'
          }}>
            {status.msg}
          </div>
        )}
      </header>

      <div style={mainGrid}>
        
        {/* COLUNA DE CONFIGURAÇÃO */}
        <section style={configSection}>
          
          {/* 1. ENDEREÇAMENTO */}
          <div style={card}>
            <h3 style={cardTitle}><Layout size={18}/> Conexão</h3>
            <div style={{ position: 'relative' }}>
              <input 
                type={showUrl ? "text" : "password"} 
                placeholder="https://discord.com/api/webhooks/..." 
                style={inputStyle} 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button onClick={() => setShowUrl(!showUrl)} style={eyeBtn}>
                {showUrl ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
            <small style={{ color: '#555', marginTop: '5px', display: 'block' }}>
              Mantenha sua URL em segredo. Nunca mostre em lives.
            </small>
          </div>

          {/* 2. IDENTIDADE DO BOT */}
          <div style={card}>
            <h3 style={cardTitle}><User size={18}/> Identidade</h3>
            <div style={row}>
              <input 
                placeholder="Nome Customizado (Opcional)" 
                style={inputStyle}
                onChange={(e) => setBotName(e.target.value)}
              />
              <input 
                placeholder="URL da Foto de Perfil" 
                style={inputStyle}
                onChange={(e) => setBotAvatar(e.target.value)}
              />
            </div>
          </div>

          {/* 3. MENSAGEM PADRÃO */}
          <div style={card}>
            <h3 style={cardTitle}><MessageSquare size={18}/> Conteúdo Principal</h3>
            <textarea 
              placeholder="Texto comum (fora do embed). Mencione @everyone ou cargos aqui..." 
              style={{ ...inputStyle, height: '80px', resize: 'none' }}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* 4. CONSTRUTOR DE EMBED */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ ...cardTitle, margin: 0 }}><Palette size={18}/> Construtor de Embed</h3>
              <input 
                type="color" 
                value={embed.color} 
                onChange={(e) => setEmbed({ ...embed, color: e.target.value })}
                style={{ border: 'none', background: 'none', cursor: 'pointer', height: '30px' }}
              />
            </div>

            <input 
              placeholder="Título do Embed" 
              style={{ ...inputStyle, marginBottom: '10px' }}
              onChange={(e) => setEmbed({ ...embed, title: e.target.value })}
            />
            <textarea 
              placeholder="Descrição principal..." 
              style={{ ...inputStyle, height: '100px', marginBottom: '10px' }}
              onChange={(e) => setEmbed({ ...embed, description: e.target.value })}
            />

            <div style={row}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>URL da Miniatura</label>
                <input style={inputStyle} onChange={(e) => setEmbed({ ...embed, thumbnail: e.target.value })}/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>URL da Imagem Grande</label>
                <input style={inputStyle} onChange={(e) => setEmbed({ ...embed, image: e.target.value })}/>
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>Campos de Dados (Fields)</label>
                <button onClick={addField} style={miniBtn}><Plus size={14}/> Add Campo</button>
              </div>
              
              {embed.fields.map((f, i) => (
                <div key={i} style={fieldRow}>
                  <input placeholder="Título" style={smallInput} value={f.name} onChange={(e) => updateField(i, 'name', e.target.value)}/>
                  <input placeholder="Valor" style={smallInput} value={f.value} onChange={(e) => updateField(i, 'value', e.target.value)}/>
                  <button onClick={() => removeField(i)} style={deleteBtn}><Trash2 size={14}/></button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" onChange={(e) => setEmbed({ ...embed, timestamp: e.target.checked })}/>
                Incluir Timestamp
              </label>
              <input 
                placeholder="Texto do Rodapé" 
                style={{ ...smallInput, flex: 1 }}
                onChange={(e) => setEmbed({ ...embed, footer: { ...embed.footer, text: e.target.value } })}
              />
            </div>
          </div>

          <button onClick={sendWebhook} style={sendBtn}>
            <Send size={18}/> Disparar Webhook Agora
          </button>
        </section>

        {/* COLUNA DE PREVIEW (VISUALIZADOR) */}
        <section style={previewSection}>
          <h3 style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Preview da Mensagem
          </h3>
          
          <div style={discordMessage}>
            <img 
              src={botAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"} 
              style={discordAvatar} 
              alt="Bot"
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={discordName}>{botName || "Sistema REDM"}</span>
                <span style={botTag}>BOT</span>
                <span style={discordTime}>Hoje às {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              {content && <div style={discordContent}>{content}</div>}

              {(embed.title || embed.description || embed.fields.length > 0) && (
                <div style={{ ...discordEmbed, borderLeft: `4px solid ${embed.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      {embed.title && <div style={embedTitle}>{embed.title}</div>}
                      {embed.description && <div style={embedDesc}>{embed.description}</div>}
                      
                      <div style={fieldsGrid}>
                        {embed.fields.map((f, i) => (
                          <div key={i} style={{ gridColumn: f.inline ? 'span 1' : 'span 3' }}>
                            <div style={fieldName}>{f.name || "Título do Campo"}</div>
                            <div style={fieldValue}>{f.value || "Valor..."}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {embed.thumbnail && <img src={embed.thumbnail} style={embedThumb} alt="thumb" />}
                  </div>

                  {embed.image && <img src={embed.image} style={embedImg} alt="main" />}
                  
                  {(embed.footer.text || embed.timestamp) && (
                    <div style={embedFooter}>
                      {embed.footer.text} {embed.timestamp && ` • ${new Date().toLocaleString()}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// --- ESTILOS REFINADOS ---
const containerStyle = { padding: "40px", backgroundColor: "#090909", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const mainGrid = { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "40px" };
const configSection = { display: "flex", flexDirection: "column", gap: "20px" };
const card = { backgroundColor: "#121212", padding: "20px", borderRadius: "12px", border: "1px solid #1f1f1f" };
const cardTitle = { color: "#fff", fontSize: "16px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" };
const inputStyle = { width: "100%", backgroundColor: "#000", border: "1px solid #222", color: "#fff", padding: "12px", borderRadius: "8px", outline: "none", fontSize: "14px" };
const row = { display: "flex", gap: "15px" };
const labelStyle = { color: "#555", fontSize: "12px", marginBottom: "5px", display: "block", fontWeight: "600" };
const eyeBtn = { position: "absolute", right: "12px", top: "12px", background: "none", border: "none", color: "#444", cursor: "pointer" };
const miniBtn = { backgroundColor: "#1a1a1a", color: "#888", border: "1px solid #333", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" };
const fieldRow = { display: "flex", gap: "10px", marginTop: "10px" };
const smallInput = { flex: 1, backgroundColor: "#0a0a0a", border: "1px solid #222", color: "#ddd", padding: "8px", borderRadius: "6px", fontSize: "13px" };
const deleteBtn = { backgroundColor: "#301010", color: "#ef4444", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer" };
const sendBtn = { backgroundColor: "#5865F2", color: "#fff", padding: "18px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", transition: "0.2s" };

// ESTILOS ESTILO DISCORD
const previewSection = { position: 'sticky', top: '40px', alignSelf: 'start' };
const discordMessage = { display: 'flex', gap: '16px', padding: '20px', backgroundColor: '#313338', borderRadius: '8px', border: '1px solid #1e1f22' };
const discordAvatar = { width: '40px', height: '40px', borderRadius: '50%' };
const discordName = { color: '#fff', fontWeight: '500', fontSize: '16px' };
const botTag = { backgroundColor: '#5865F2', color: '#fff', fontSize: '10px', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' };
const discordTime = { color: '#949ba4', fontSize: '12px' };
const discordContent = { color: '#dbdee1', marginTop: '4px', fontSize: '15px' };
const discordEmbed = { marginTop: '8px', padding: '12px 16px', backgroundColor: '#2b2d31', borderRadius: '4px', maxWidth: '430px' };
const embedTitle = { color: '#fff', fontWeight: '600', fontSize: '16px', marginBottom: '8px' };
const embedDesc = { color: '#dbdee1', fontSize: '14px', lineHeight: '1.4' };
const fieldsGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' };
const fieldName = { color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '2px' };
const fieldValue = { color: '#dbdee1', fontSize: '13px' };
const embedThumb = { width: '80px', height: '80px', borderRadius: '4px', objectFit: 'cover' };
const embedImg = { width: '100%', borderRadius: '4px', marginTop: '12px' };
const embedFooter = { color: '#949ba4', fontSize: '12px', marginTop: '12px' };