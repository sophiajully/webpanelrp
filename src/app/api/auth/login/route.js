import { prisma } from "../../../../lib/prisma"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // npm install jsonwebtoken
import { serialize } from "cookie"; // npm install cookie

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true, company: true }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Usuário ou senha inválidos." });
    }

    // 1. Verificar Expiração (Apenas Donos)
    if (user.isOwner) {
      const agora = new Date();
      if (agora > new Date(user.expires_at)) {
        return res.status(403).json({ error: "Sua licença expirou. Entre em contato com o suporte." });
      }
    }

    // 2. Verificar se Funcionário está vinculado a uma empresa
    if (!user.isOwner && !user.companyId) {
      return res.status(403).json({ error: "Sua conta ainda não foi vinculada a uma empresa ou aguarda aprovação." });
    }

    // 3. Gerar Token de Acesso
    const token = jwt.sign(
      { userId: user.id, companyId: user.companyId, isOwner: user.isOwner, role: user.role },
      process.env.JWT_SECRET || 'secret-key-123',
      { expiresIn: '7d' }
    );

    // 4. Salvar nos Cookies
    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/'
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ 
      message: "Logado com sucesso!",
      user: { username: user.username, isOwner: user.isOwner, company: user.company?.name, role: user.role?.name }
    });

  } catch (error) {
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}