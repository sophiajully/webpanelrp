"use server"

import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { User as UserIcon, Building, Briefcase, Mail, Star, CreditCard, UserPlus } from "lucide-react";
import HireButton from "@/app/components/index/HireButton"; 

// Função para gerar metadados dinâmicos
export async function generateMetadata({ params }) {
  const { id } = await params;

  // Busca apenas o necessário para o SEO
  const user = await prisma.user.findUnique({
    where: { id },
    select: { 
      username: true, 
      pombo: true,
      company: { select: { name: true } }
    },
  });

  if (!user) {
    return {
      title: "Usuário não encontrado | SafraLog",
    };
  }

  const description = `Perfil de ${user.username} na SafraLog. ${
    user.company ? `Trabalha em: ${user.company.name}.` : "Disponível para contratação."
  } Pombo: ${user.pombo || 'Não informado'}.`;

  return {
    title: `${user.username} | SafraLog`,
    description: description,
    openGraph: {
      title: `Perfil de ${user.username}`,
      description: description,
      type: "profile",
      url: `https://tysaiw.com/users/${id}`,
      images: [
        {
          url: "/isotipo.png",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.username} | SafraLog`,
      description: description,
    },
  };
}

export default async function UserProfile({ params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      pombo: true,
      expiresAt: true,
      companyId: true,
      company: { select: { name: true, colorPrimary: true } },
      role: { select: { name: true, isOwner: true, canAdmin: true } },
      ownedCompanies: {
        select: { 
          id: true, 
          name: true, 
          colorPrimary: true, 
          enableMarket: true,
          enableHireRequest: true,
          users: { where: { id: session.user.id }, select: { id: true } },
          hireRequests: {
            where: { userId: session.user.id, status: "pending" } 
     }
        }
      },
      paymentsReceived: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, action: true, amount: true, createdAt: true }
      },
      
    }
  });

  if (!user) return notFound();

  const isVip = user.expiresAt && new Date(user.expiresAt) > new Date();
  const isOwnProfile = session.user.id === user.id;

  return (
    <div style={styles.container}>
      {/* HEADER RESPONSIVO */}
      <div style={styles.headerCard}>
        <div style={styles.headerCover}></div>
        <div style={styles.headerContent}>
          <div style={styles.avatarContainer}>
            <div style={styles.avatar}>
              <UserIcon size={48} color="#fff" />
            </div>
          </div>
          <div style={styles.userInfo}>
            <h1 style={styles.userName}>
              {user.username}
              {isVip && <Star size={20} color="#FFD700" style={{ marginLeft: 8 }} />}
            </h1>
            <p style={styles.userSub}>
              ID: <span style={styles.highlight}>{user.id.split('-')[0]}</span>
            </p>
          </div>
        </div>
      </div>

      <div style={styles.grid}>

<div style={styles.column}>
          {/* CARD DE CONTATO COM EXPIRAÇÃO */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><Mail size={18}/> Contato & Acesso</h3>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Pombo:</span>
              <span style={styles.infoValue}>{user.pombo || "---"}</span>
            </div>
            
            {/* CAMPO DE EXPIRAÇÃO AQUI */}
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Expiração:</span>
              <span style={{
                ...styles.infoValue, 
                color: isVip ? '#28a745' : '#ff4c4c'
              }}>
                {user.expiresAt 
                  ? new Date(user.expiresAt).toLocaleDateString('pt-BR') 
                  : "Sem chave ativa"}
              </span>
            </div>
          </div>
          
          <div style={styles.card}>
            
            <h3 style={styles.cardTitle}><Briefcase size={18}/> Trabalho Atual</h3>
            {user.company ? (
              <div style={styles.companyBanner(user.company.colorPrimary)}>
                <h4 style={styles.companyName}>{user.company.name}</h4>
                <span style={styles.smallText}>{user.role?.name}</span>
              </div>
            ) : (
              <p style={styles.emptyText}>Disponível para contratação.</p>
            )}
          </div>
        </div>
          

        {/* COLUNA 2 - EMPRESAS E RECRUTAMENTO */}
        <div style={styles.column}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><Building size={18}/> Empresas que Gerencia</h3>
            {user.ownedCompanies.length > 0 ? (
              <div style={styles.ownedGrid}>
                {user.ownedCompanies.map(comp => {
                    const alreadyMember = comp?.users?.length > 0;
              const hasApplied = comp?.hireRequests?.length > 0;
return(
    <div key={comp.id} style={{...styles.ownedCard, borderLeft: `4px solid ${comp.colorPrimary}`}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ color: comp.colorPrimary, display: 'block' }}>{comp.name}</strong>
                        <span style={styles.smallText}>Mercado: {comp.enableMarket ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      
                      {!isOwnProfile && comp.enableHireRequest && (
                      alreadyMember ? (
                        <span style={{fontSize: '11px', color: '#888'}}>Você já trabalha aqui</span>
                      ) : (
                        <HireButton 
                          companyId={comp.id} 
                          hasApplied={hasApplied} 
                        />
                      )
                    )}
                    </div>
                  </div>
)
                  
})}
              </div>
            ) : (
              <p style={styles.emptyText}>Nenhuma empresa própria.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 'clamp(10px, 4vw, 30px)', // Responsividade fluida
    width: '100%',
    margin: '0 auto',
    color: '#e0e0e0',
    fontFamily: 'system-ui, sans-serif'
  },
  headerCard: {
    backgroundColor: '#1e1e24',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    marginBottom: '24px'
  },
  headerCover: {
    height: '100px',
    background: 'linear-gradient(90deg, #1a1a2e 0%, #8b0000 100%)',
  },
  headerContent: {
    padding: '0 20px 20px 20px',
    display: 'flex',
    flexDirection: 'row', // Default desktop
    flexWrap: 'wrap',    // Quebra para mobile
    alignItems: 'flex-end',
    gap: '15px',
    marginTop: '-35px'
  },
  avatarContainer: {
    width: '90px',
    height: '90px',
    borderRadius: '20px', // Estilo Squircle moderno
    backgroundColor: '#121214',
    padding: '5px',
    flexShrink: 0,
    boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '15px',
    backgroundColor: '#2a2a35',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userName: {
    margin: 0,
    fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', // Grid ultra responsivo
    gap: '20px'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    backgroundColor: '#1e1e24',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #2d2d3d'
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1rem',
    color: '#fff',
    marginBottom: '15px',
    opacity: 0.9
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #2a2a35'
  },
  infoLabel: { color: '#888', fontSize: '14px' },
  infoValue: { color: '#fff', fontWeight: '500' },
  companyBanner: (color) => ({
    backgroundColor: color + '15',
    borderLeft: `4px solid ${color}`,
    padding: '12px',
    borderRadius: '8px'
  }),
  companyName: { margin: 0, color: '#fff', fontSize: '1.1rem' },
  ownedGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  ownedCard: {
    backgroundColor: '#16161d',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #2a2a35'
  },
  emptyText: { color: '#555', fontSize: '14px', fontStyle: 'italic' },
  smallText: { fontSize: '12px', color: '#888' },
  highlight: { color: '#ff4c4c', fontWeight: 'bold' },
};