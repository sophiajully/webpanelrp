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
          include: { 
            role: true, 
            company: {
              include: { crafts: true }
            } 
          },

        });

        if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
          throw new Error("Usuário ou senha incorretos.");
        }

        
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
          company: user.company
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
        token.pombo = user.pombo
        token.company = user.company
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
          token.company = dbUser.company
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
        session.user.company = token.company
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