export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy"; // Importação necessária para o V2E

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
        code: { label: "Código V2E", type: "text" } // Campo adicional para o código
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Usuário e senha são obrigatórios.");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { 
            role: true, 
            company: {
              include: { crafts: true }
            } 
          },
        });

        // 1. Validação Básica de Usuário e Senha
        if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
          throw new Error("Usuário ou senha incorretos.");
        }

        // 2. Validação do V2E (2FA)
        // Se o usuário tem o V2E ativado no banco
        if (user.twoFactorEnabled) {
          // Se ele não enviou o código ainda, avisamos o frontend
          if (!credentials.code) {
            throw new Error("V2E_REQUIRED"); 
          }

          // Validamos o código usando a secret salva no Prisma
          const isTokenValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: credentials.code,
            window: 1 // Margem de erro de 30s para cima ou para baixo (atrasos de rede)
          });

          if (!isTokenValid) {
            throw new Error("Código de verificação inválido.");
          }
        }

        // Se passou por tudo, retorna o objeto do usuário
        return {
          id: user.id,
          name: user.username,
          isOwner: user.role?.isOwner || false,
          companyId: user.companyId,
          role: user.role,
          pombo: user.pombo,
          companyName: user.company?.name,
          colorPrimary: user.company?.colorPrimary,
          colorAccent: user.company?.colorAccent,
          company: user.company,
          twoFactorEnabled: user.twoFactorEnabled // Útil para o frontend saber se deve pedir o código
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.isOwner = user.isOwner;
        token.companyId = user.companyId;
        token.role = user.role;
        token.companyName = user.companyName;
        token.colorPrimary = user.colorPrimary;
        token.colorAccent = user.colorAccent;
        token.pombo = user.pombo;
        token.company = user.company;
        token.twoFactorEnabled = user.twoFactorEnabled;
      }

      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { 
            company: {
              include: { crafts: true }
            }, 
            role: true 
          }
        });

        if (dbUser) {
          token.companyId = dbUser.companyId;
          token.role = dbUser.role;
          token.pombo = dbUser.pombo;
          token.companyName = dbUser.company?.name;
          token.colorPrimary = dbUser.company?.colorPrimary;
          token.colorAccent = dbUser.company?.colorAccent;
          token.isOwner = dbUser.role?.isOwner || false;
          token.company = dbUser.company;
          token.twoFactorEnabled = dbUser.twoFactorEnabled;
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
        session.user.companyName = token.companyName;
        session.user.colorPrimary = token.colorPrimary;
        session.user.colorAccent = token.colorAccent;
        session.user.pombo = token.pombo;
        session.user.company = token.company;
        session.user.twoFactorEnabled = token.twoFactorEnabled;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET, 
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };