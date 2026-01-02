/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["skia-canvas", "sharp", "@napi-rs/canvas", "@pixi/node"],

  // Use webpack explicitly to avoid Turbopack issues in production builds
  experimental: {
    reactCompiler: false,
  },

  // Suppress hydration mismatch warnings in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Don't attempt to load these modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        'sharp': false,
        'skia-canvas': false,
        '@pixi/node': false,
        'pixi.js': false,
      };
    }

    // Optimización para producción
    if (!dev && isServer) {
      config.optimization.minimize = true;
    }

    return config;
  },

  // Exponer variables de entorno al cliente
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_SOCKET_PORT: process.env.NEXT_PUBLIC_SOCKET_PORT || '3011',
    NEXT_PUBLIC_USE_CANVAS_RENDERER: process.env.USE_CANVAS_RENDERER || 'true',
  },

  // Configuración de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Configuración de compilación
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configuración de rutas
  async rewrites() {
    return [
      {
        source: '/api/socket',
        destination: `${process.env.INTERNAL_SOCKET_URL || 'http://stream-socket:3001'}`,
      },
    ];
  },
};

export default nextConfig;
