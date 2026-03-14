"use client";

import React, { useState, useEffect } from 'react';
import { submitServerAction } from '@/app/actions/appActions';
import { TrendingUp, Users, DollarSign, Trophy, Target, Star, Briefcase } from "lucide-react";

export default function DashboardTab({ session, styles, isMobile, display }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const primaryColor = session?.user?.company?.colorPrimary || '#ff4c4c';

  useEffect(() => {
    async function loadStats() {
      const res = await submitServerAction('/api/dashboard', 'GET');
      if (!res.error) setData(res);
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Carregando estatísticas...</div>;

  const metricCards = [
    { title: "Vendas (Hoje)", val: data?.metrics?.vendasHojeCount || 0, icon: <Target size={20}/>, sub: `Total: $${data?.metrics?.vendasHojeValor || 0}` },
    { title: "Lucro (7d)", val: `$${data?.metrics?.saldoTotal || 0}`, icon: <TrendingUp size={20}/>, sub: "Últimos 7 dias" },
    { title: "Equipe", val: data?.metrics?.funcionariosTotal || 0, icon: <Users size={20}/>, sub: "Membros registrados" },
  ];

  if(!display) return;

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* GRID DE MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '15px' }}>
        {metricCards.map((card, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: '600' }}>{card.title}</span>
              <div style={{ color: primaryColor }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '5px' }}>{card.val}</div>
            <div style={{ color: '#666', fontSize: '0.75rem' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '20px' }}>
        
        {/* RANKING DE FUNCIONÁRIOS */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Trophy size={20} color="#FFD700" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Elite da Fazenda (Top 5 Semanal)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.ranking?.map((user, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: index === 0 ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '10px', border: index === 0 ? '1px solid rgba(255,215,0,0.2)' : '1px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontWeight: '800', color: index === 0 ? '#FFD700' : '#444', width: '20px' }}>#{index + 1}</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{user.username}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{user.acoes} serviços concluídos</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#4CAF50', fontWeight: '700' }}>+ ${user.ganhos}</div>
                  {index === 0 && <span style={{ fontSize: '0.6rem', background: '#FFD700', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>MVP</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD DE INCENTIVO RP */}
        <div style={{ background: `linear-gradient(135deg, ${primaryColor}11 0%, rgba(0,0,0,0) 100%)`, border: `1px dashed ${primaryColor}33`, borderRadius: '16px', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <Star size={40} color={primaryColor} style={{ marginBottom: '15px', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 10px 0' }}>Meta da Empresa</h4>
          <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.4' }}>
            "O trabalho duro molda o caráter e enche o bolso. Mantenha a produção alta e garanta seu bônus no final da semana!"
          </p>
          <div style={{ marginTop: '20px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', color: primaryColor }}>
            Foco: {hojeMes()}
          </div>
        </div>

      </div>
    </div>
  );
}

function hojeMes() {
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return meses[new Date().getMonth()];
}