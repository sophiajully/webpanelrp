/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
};

export default nextConfig;