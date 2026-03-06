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
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { role: true, company: true }
        });

        if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
          throw new Error("Usuário ou senha incorretos.");
        }

        if (user.isOwner && user.expiresAt) {
          if (new Date() > new Date(user.expiresAt)) {
            throw new Error("Sua licença expirou!");
          }
        }

        return {
          id: user.id,
          name: user.username,
          isOwner: user.isOwner,
          companyId: user.companyId,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isOwner = user.isOwner;
        token.companyId = user.companyId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isOwner = token.isOwner;
        session.user.companyId = token.companyId;
        session.user.role = token.role;
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