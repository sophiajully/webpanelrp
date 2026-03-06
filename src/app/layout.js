import "./carnes/styles.css";
import AuthProvider from "./components/AuthProvider"; // Ajuste o caminho se necessário

export const metadata = {
  title: "SafraLog",
  description: "Sistema de encomendas e produção",
  openGraph: {
    title: "SafraLog Dashboard",
    description: "SafraLog é um ecossistema digital completo projetado para centralizar a operação de fazendas, açougues e empresas de grande porte. Unindo o cálculo preciso de produção (crafting) com uma gestão de equipe hierárquica, o sistema oferece controle total sobre pedidos, receitas e colaboradores. Com segurança de nível bancário via NextAuth e persistência de dados em tempo real, o AgroLegacy foi feito para durar gerações, garantindo que a tecnologia seja o alicerce do seu crescimento.",
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}