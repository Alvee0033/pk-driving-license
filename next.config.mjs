/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    return [
      {
        source: '/index.php',
        destination: '/',
      },
      {
        source: '/dl-status/:id',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
