export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { role: true, company: true } // Você já busca a empresa aqui!
        });

        if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
          throw new Error("Usuário ou senha incorretos.");
        }

        // Retornamos os dados da EMPRESA para o Token
        return {
          id: user.id,
          name: user.username,
          isOwner: user.role?.isOwner || false,
          companyId: user.companyId,
          role: user.role,
          pombo: user.pombo,
          companyName: user.company?.name,
          colorPrimary: user.company?.colorPrimary,
          colorAccent: user.company?.colorAccent
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Login inicial
      if (user) {
        token.id = user.id;
        token.isOwner = user.isOwner;
        token.companyId = user.companyId;
        token.role = user.role;
        token.companyName = user.companyName;
        token.colorPrimary = user.colorPrimary;
        token.colorAccent = user.colorAccent;
        token.pombo = user.pombo
      }

      // IMPORTANTE: Escuta o comando update() do front-end
      if (trigger === "update") {
        // Buscamos os dados atualizados do usuário e da empresa no banco
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { 
            company: true, // Buscamos a nova empresa vinculada
            role: true 
          }
        });

        if (dbUser) {
          // Atualizamos o token com as informações REAIS do banco de dados
          token.companyId = dbUser.companyId;
          token.role = dbUser.role;
          token.pombo = dbUser.pombo;
          token.companyName = dbUser.company?.name;
          token.colorPrimary = dbUser.company?.colorPrimary;
          token.colorAccent = dbUser.company?.colorAccent;
          token.isOwner = dbUser.role?.isOwner || false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isOwner = token.isOwner;
        session.user.companyId = token.companyId;
        session.user.role = token.role;
        // PASSA PARA A SESSÃO:
        session.user.companyName = token.companyName;
        session.user.colorPrimary = token.colorPrimary;
        session.user.colorAccent = token.colorAccent;
        session.user.pombo = token.pombo;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET, // CERTIFIQUE-SE QUE ISSO ESTÁ NO SEU .ENV
};

const handler = NextAuth(authOptions);

// NO APP ROUTER PRECISAMOS DISSO:
export { handler as GET, handler as POST };