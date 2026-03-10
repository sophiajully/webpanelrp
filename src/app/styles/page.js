export const HomeStyles = {
  
  layoutWrapper: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#07080a',
    color: '#d1d5db',
    fontFamily: '"Inter", sans-serif',
    overflow: 'hidden'
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#07080a',
    color: 'var(--cor-primaria, #d4a91c)',
    gap: '20px'
  },
  loaderSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    borderTop: '3px solid var(--cor-primaria, #d4a91c)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '280px',
    background: '#0d0f14',
    borderRight: '1px solid #1c1f26',
    padding: '24px 0'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 24px 32px',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.02em'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Garante que fique por cima de tudo
  },
  modalContent: {
    background: '#0d0f14',
    border: '1px solid #1c1f26',
    borderRadius: '16px',
    padding: '32px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  btnCloseModal: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.2s'
  },
  companyLogo: {
    width: '32px',
    height: '32px',
    background: 'var(--cor-primaria, #d4a91c)',
    color: '#000',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900'
  },
  navLabel: {
    padding: '0 24px 12px',
    fontSize: '0.65rem',
    color: '#4b5563',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 12px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: '10px',
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  navItemActive: {
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
    fontWeight: '600',
    boxShadow: 'inset 0 0 0 1px var(--cor-primaria-bg)'
  },
  navItemMaster: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: '10px',
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  navItemMasterActive: {
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
    fontWeight: '600'
  },

  
  userInfoBar: {
    margin: '0 12px',
    padding: '16px',
    background: '#161922',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #1c1f26'
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column'
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#fff'
  },
  userRole: {
    fontSize: '0.7rem',
    color: 'var(--cor-primaria, #d4a91c)',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  btnLogoutIcon: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: 'none',
    color: '#ef4444',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: '0.2s'
  },


  responsiveTableContainer: {
    width: '100%',
    overflowX: 'auto', // Scroll horizontal apenas na tabela
    marginTop: '20px',
    WebkitOverflowScrolling: 'touch', // Scroll suave no iOS
  },
  webhookContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%', 
    maxWidth: '450px',
    flexWrap: 'wrap', // Permite que o botão desça se não houver espaço,
    background: '#07080a', // Mais escuro que o card
    border: '1px solid #1c1f26',
    borderRadius: '10px',
    padding: '8px 12px',
    gap: '12px',
    marginTop: '10px',
    width: 'fit-content'
  },
  webhookLink: {
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '220px', // Ajuste conforme necessário
    fontSize: '0.85rem',
    color: '#9ca3af',
    userSelect: 'all',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  // ... seus estilos atuais
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    marginTop: '5px'
  },
  switchLabel: {
    fontSize: '0.85rem',
    color: '#ccc',
    cursor: 'pointer',
    marginLeft: '8px'
  },
  checkboxHidden: {
    cursor: 'pointer',
    width: '18px',
    height: '18px',
    accentColor: 'var(--cor-primaria)' // Usa a cor que o usuário escolheu
  },
  switchWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  btnCopy: {
    background: 'transparent',
    border: 'none',
    color: 'var(--cor-primaria, #d4a91c)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '4px',
    transition: '0.2s',
  },
  mainContent: {
    flex: 1,
    padding: '40px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  transition: 'margin-left 0.3s ease',
  width: '100%',
  padding: '20px'
  },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  breadcrumb: {
    fontSize: '0.75rem',
    color: '#4b5563',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#fff',
    marginTop: '4px'
  },
  btnSettings: {
    background: '#161922',
    border: '1px solid #1c1f26',
    color: '#9ca3af',
    padding: '10px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  
  pageContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  card: {
    background: '#0d0f14',
    border: '1px solid #1c1f26',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px'
  },
  headerIcon: {
    width: '36px',
    height: '36px',
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  grid2Cols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  grid3Cols: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '20px'
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderRadius: '5px'
  },
  baseInput: {
    background: '#161922',
    border: '1px solid #1c1f26',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  labelInput: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  baseButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  },
 buttonPrimary: {
  background: 'var(--cor-primaria, #d4a91c)',
  color: '#000',
  padding: '5px',
  borderRadius: '5px',
  border: 'none',   
  boxShadow: 'none', 
  cursor: 'pointer',  
  outline: 'none'  
},
  permList: {
    gap: '10px',
    display: 'flex',
  },
  tinyBadge: {
    background: '#252525',
    padding: '5px 15px',
    borderRadius: '5px',
  },
  btnMaster: {
    background: 'var(--cor-primaria, #d4a91c)',
    color: '#000'
  },
  buttonOutline: {
    background: 'transparent',
    border: '1px solid #1c1f26',
    color: '#9ca3af'
  },
  divider: {
    height: '1px',
    background: '#1c1f26',
    width: '100%'
  },

  
 producaoGrid: {
    display: 'grid',
    gap: '12px',
    maxHeight: '400px',   // Define a altura limite (pode ajustar esse valor)
    overflowY: 'auto',    // Cria a barra de rolagem vertical quando passar do limite
    paddingRight: '8px',  // Dá um pequeno espaço para a barra não encostar nos itens
  },
  gridResponsive: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
    gap: '20px'
  },

  producaoItem: {
    background: '#161922',
    padding: '16px 20px',
    borderRadius: '12px',
    display: 'flex',
    flexWrap: 'wrap', 
    alignItems: 'center',
    gap: '15px',
    border: '1px solid #1c1f26'
  },
  

  producaoItemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginLeft: 'auto' 
  },
  producaoItemTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '0.95rem'
  },
  producaoItemMeta: {
    color: '#6b7280',
    fontSize: '0.75rem',
    marginTop: '2px'
  },
  producaoInput: {
    width: '80px',
    background: '#0d0f14',
    border: '1px solid #1c1f26',
    borderRadius: '8px',
    padding: '8px',
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700'
  },
  btnActionDelete: {
    background: 'transparent',
    color: '#4b5563',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: '0.2s',
  },

  
  teamList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  teamItem: {
    background: '#161922',
    padding: '20px',
    borderRadius: '14px',
    border: '1px solid #1c1f26',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  memberName: { color: '#fff', fontWeight: '600' },
  badgeRole: {
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    color: 'var(--cor-primaria, #d4a91c)',
    fontSize: '0.65rem',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '20px',
    textTransform: 'uppercase'
  },
  roleSelect: {
    background: '#0d0f14',
    border: '1px solid #1c1f26',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, max-content)',
    gap: '10px 40px',
    marginTop: '12px'
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    color: '#9ca3af',
    cursor: 'pointer'
  },
  hiddenInput: {
    // Estas 4 linhas garantem que o checkbox suma em qualquer navegador
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    position: 'absolute', // Tira do fluxo para não empurrar o texto
    
    // Opcional: mantém o elemento funcional para acessibilidade mas invisível
    opacity: 0,
    width: 0,
    height: 0,
    margin: 0,
  },

  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '10px',
    marginTop: '15px',
  },

  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    position: 'relative', // Importante por causa do input absolute
    border: '1px solid #2d2d44',
    transition: 'all 0.2s ease',
  },

  customCheck: {
    width: '16px',
    height: '16px',
    border: '1px solid #444',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Impede que o quadradinho amasse em telas pequenas
  },

  permText: {
    fontSize: '0.65rem',
    fontWeight: '800',
    letterSpacing: '1px',
    fontFamily: 'serif',
  },
  masterActionRow: {
    display: 'flex',
    gap: '5px',
    flexDirection: 'column'
  },
  keyCode: {
    fontFamily: 'monospace',
    color: 'var(--cor-primaria, #d4a91c)',
    fontSize: '1rem',
    letterSpacing: '2px',
    background: 'var(--cor-primaria-bg, rgba(212, 169, 28, 0.1))',
    padding: '8px 16px',
    borderRadius: '8px'
  },
  keyItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #1c1f26'
  },

  
  modalBody: {
    background: '#0d0f14',
    width: '90%',
    maxWidth: '500px',
    borderRadius: '24px',
    padding: '40px',
    border: '1px solid #1c1f26',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  },
  colorPicker: {
    width: '100%',
    height: '44px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  }
}