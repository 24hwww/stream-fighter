/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@napi-rs/canvas"],
  experimental: {
    instrumentationHook: true,
  },
  // Exponer variables de entorno al cliente
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_SOCKET_PORT: process.env.NEXT_PUBLIC_SOCKET_PORT || '3011',
  },
};

export default nextConfig;
