import "./carnes/styles.css";
import AuthProvider from "./components/AuthProvider";
import ConsoleWarning from "./components/ConsoleWarning"; // Importe o novo componente

export const metadata = {
  title: "SafraLog",
  description: "Sistema de encomendas e produção",
  openGraph: {
    title: "SafraLog Dashboard",
    description: "SafraLog é um ecossistema digital completo projetado para centralizar a operação de fazendas...",
    type: "website",
    url: "https://tysaiw.com",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {/* <ConsoleWarning /> O aviso rodará apenas no cliente aqui */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}