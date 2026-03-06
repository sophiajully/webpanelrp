import { NextResponse } from 'next/server';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const limparTexto = (txt) => {
    if (!txt) return "";
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  };

  const titulo = limparTexto(searchParams.get('titulo') || 'PROCURA-SE');
  const subtitulo = limparTexto(searchParams.get('subtitulo') || 'NEGOCIOS & PROPRIEDADES');
  const fazenda = limparTexto(searchParams.get('fazenda') || 'VALE DO SERENO');
  const dono = limparTexto(searchParams.get('dono') || 'ARTHUR MORGAN');
  const contato = limparTexto(searchParams.get('pombo') || 'CORREIO CENTRAL');
  const servicos = limparTexto(searchParams.get('servicos') || 'GADO • CAVALOS • COLHEITA');
  const rodape = limparTexto(searchParams.get('rodape') || 'REGISTRADO NO DEPARTAMENTO DE AGRICULTURA');
  const selo = limparTexto(searchParams.get('selo') || 'ORIGINAL');
  const dataEst = limparTexto(searchParams.get('data') || 'ESTABELECIDO EM 1899');

  try {
    const fontPath = path.join(process.cwd(), 'public', 'PlayfairDisplay-Bold.ttf');
    const fontBuffer = fs.readFileSync(fontPath);
    const fontData = new Uint8Array(fontBuffer).buffer;

    const svg = await satori(
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#e6d5b8',
        padding: '40px',
        border: '20px solid #3d2b1f',
        color: '#3d2b1f',
        fontFamily: 'Playfair',
        position: 'relative',
      }}>
        {/* Borda Decorativa Interna */}
        <div style={{
          position: 'absolute',
          top: '10px', left: '10px', right: '10px', bottom: '10px',
          border: '2px solid #3d2b1f',
          display: 'flex',
        }} />
        
        {/* Cabeçalho */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px' }}>
          <span style={{ display: 'flex', fontSize: '16px', letterSpacing: '4px', marginBottom: '10px' }}>{dataEst}</span>
          <div style={{ display: 'flex', width: '180px', height: '2px', backgroundColor: '#3d2b1f', marginBottom: '20px' }} />
          
          <h1 style={{ 
            display: 'flex',
            fontSize: '70px', 
            margin: '0', 
            lineHeight: '0.8',
            textAlign: 'center',
          }}>
            {titulo}
          </h1>
          
          <div style={{ 
            display: 'flex',
            marginTop: '20px',
            background: '#3d2b1f',
            padding: '8px 25px'
          }}>
            <span style={{ color: '#e6d5b8', fontSize: '20px', letterSpacing: '3px' }}>{subtitulo}</span>
          </div>
        </div>

        {/* Corpo Principal */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: '100%', 
          marginTop: '60px',
          padding: '0 30px',
          gap: '40px'
        }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ display: 'flex', fontSize: '13px', fontWeight: 'bold' }}>NOME DA PROPRIEDADE</span>
            <span style={{ display: 'flex', fontSize: '42px', textAlign: 'center', lineHeight: '1.1', marginTop: '5px' }}>
              {fazenda}
            </span>
            {/* Linha Dupla Corrigida */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: '10px' }}>
               <div style={{ display: 'flex', width: '100%', height: '1px', backgroundColor: '#3d2b1f' }} />
               <div style={{ display: 'flex', width: '100%', height: '1px', backgroundColor: '#3d2b1f', marginTop: '3px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '45%' }}>
              <span style={{ display: 'flex', fontSize: '11px', fontWeight: 'bold' }}>RESPONSAVEL</span>
              <div style={{ display: 'flex', borderBottom: '2px solid #3d2b1f', paddingBottom: '5px' }}>
                <span style={{ fontSize: '24px' }}>{dono}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', width: '45%' }}>
              <span style={{ display: 'flex', fontSize: '11px', fontWeight: 'bold' }}>CONTATO</span>
              <div style={{ display: 'flex', borderBottom: '2px solid #3d2b1f', paddingBottom: '5px' }}>
                <span style={{ fontSize: '24px' }}>{contato}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ 
          marginTop: 'auto', 
          marginBottom: '40px',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ display: 'flex', textAlign: 'center' }}>
             <span style={{ fontSize: '20px', letterSpacing: '3px', fontWeight: 'bold' }}>* {servicos} *</span>
          </div>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '85%',
            borderTop: '1px solid #3d2b1f',
            paddingTop: '10px',
          }}>
            <span style={{ fontSize: '10px', textAlign: 'center', fontStyle: 'italic', opacity: 0.9 }}>
              {rodape}
            </span>
          </div>
        </div>

        {/* Selo Carimbo */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          width: '80px',
          height: '80px',
          border: '2px solid #3d2b1f',
          borderRadius: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(-15deg)',
          opacity: 0.6,
          padding: '10px'
        }}>
          <span style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>{selo}</span>
        </div>
      </div>,
      {
        width: 600,
        height: 900,
        fonts: [{ name: 'Playfair', data: fontData, weight: 700, style: 'normal' }],
      }
    );

    const resvg = new Resvg(svg);
    const pngBuffer = resvg.render().asPng();

    return new NextResponse(pngBuffer, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
    });

  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}