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
          isOwner: user.isOwner,
          companyId: user.companyId,
          role: user.role,
          // ADICIONE ESTES CAMPOS:
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
      }

      // IMPORTANTE: Escuta o comando update() do front-end
      if (trigger === "update" && session?.user) {
        // Atualiza o token com os novos dados que vieram do front
        return { ...token, ...session.user };
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