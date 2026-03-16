import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function POST(req) {
  try {
    const { username } = await req.json();
    
    // Gera uma secret temporária
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `SafraLog:${username}`,
      issuer: 'SafraLog'
    });

    // Gera o QR Code em formato DataURL (Base64) para o modal ler
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return NextResponse.json({ 
      qrCode: qrCodeUrl, 
      secret: secret.base32 // Enviamos a base32 para o verify depois
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao gerar setup" }, { status: 500 });
  }
}