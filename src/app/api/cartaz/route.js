import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
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
  const dataEst = limparTexto(searchParams.get('data') || 'EST. 1899');

  try {
    const fontPath = path.join(process.cwd(), 'public', 'PlayfairDisplay-Bold.ttf');
    const fontData = fs.readFileSync(fontPath);

    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#e6d5b8', 
          padding: '25px',
          color: '#2a1a10',
          fontFamily: 'Playfair',
        }}>
          
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            border: '6px solid #2a1a10',
            padding: '8px',
            position: 'relative'
          }}>
            
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              border: '2px solid #2a1a10',
              padding: '40px',
              position: 'relative'
            }}>

              
              <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, border: '2px solid #2a1a10', transform: 'rotate(45deg)', display: 'flex' }} />
              <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, border: '2px solid #2a1a10', transform: 'rotate(45deg)', display: 'flex' }} />
              <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, border: '2px solid #2a1a10', transform: 'rotate(45deg)', display: 'flex' }} />
              <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, border: '2px solid #2a1a10', transform: 'rotate(45deg)', display: 'flex' }} />

              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                <div style={{ width: '40px', height: '2px', backgroundColor: '#2a1a10', display: 'flex' }} />
                <span style={{ fontSize: '18px', letterSpacing: '4px', fontWeight: 'bold' }}>{dataEst}</span>
                <div style={{ width: '40px', height: '2px', backgroundColor: '#2a1a10', display: 'flex' }} />
              </div>

              <span style={{ fontSize: '35px', letterSpacing: '15px', marginBottom: '5px' }}>{titulo}</span>
              
              <h1 style={{ 
                fontSize: '80px', 
                margin: '10px 0', 
                textAlign: 'center',
                lineHeight: '0.8',
                display: 'flex'
              }}>
                {fazenda}
              </h1>

              
              <div style={{
                display: 'flex',
                backgroundColor: '#2a1a10',
                padding: '5px 30px',
                marginTop: '10px'
              }}>
                <span style={{ fontSize: '20px', color: '#e6d5b8', letterSpacing: '5px' }}>{subtitulo}</span>
              </div>

              
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '45px 0' }}>
                <div style={{ flex: 1, height: '2px', backgroundColor: '#2a1a10', display: 'flex' }} />
                <div style={{ width: '12px', height: '12px', backgroundColor: '#2a1a10', transform: 'rotate(45deg)', margin: '0 15px', display: 'flex' }} />
                <div style={{ flex: 1, height: '2px', backgroundColor: '#2a1a10', display: 'flex' }} />
              </div>

              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '35px', width: '100%' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <span style={{ fontSize: '12px', letterSpacing: '3px', marginBottom: '5px' }}>PROPRIETÁRIO RESPONSÁVEL</span>
                   <span style={{ fontSize: '40px', fontWeight: 'bold' }}>{dono}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                   <span style={{ fontSize: '12px', letterSpacing: '3px', marginBottom: '10px' }}>PRODUÇÃO & CATALOGO</span>
                   <div style={{ display: 'flex', width: '80%', height: '1px', backgroundColor: '#2a1a10', marginBottom: '10px', opacity: 0.3 }} />
                   <span style={{ fontSize: '26px', textAlign: 'center', maxWidth: '90%', lineHeight: '1.3', display: 'flex' }}>
                     {servicos}
                   </span>
                   <div style={{ display: 'flex', width: '80%', height: '1px', backgroundColor: '#2a1a10', marginTop: '15px', opacity: 0.3 }} />
                </div>
              </div>

              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                marginTop: '40px',
                padding: '10px 40px',
                border: '3px solid #2a1a10'
              }}>
                 <span style={{ fontSize: '11px', letterSpacing: '2px' }}>CONTATO VIA POMBO</span>
                 <span style={{ fontSize: '34px', fontWeight: 'bold' }}># {contato}</span>
              </div>

              
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textAlign: 'center', opacity: 0.7, maxWidth: '70%', letterSpacing: '1px' }}>
                  {rodape}
                </span>
              </div>

              
              <div style={{
                position: 'absolute',
                bottom: '30px',
                right: '30px',
                width: '110px',
                height: '110px',
                border: '4px solid #7a1c1c',
                borderRadius: '60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-15deg)',
                color: '#7a1c1c',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>QUALIDADE</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{selo}</span>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>GARANTIDA</span>
              </div>

            </div>
          </div>
        </div>
      ),
      {
        width: 600,
        height: 900,
        fonts: [
          {
            name: 'Playfair',
            data: fontData,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}