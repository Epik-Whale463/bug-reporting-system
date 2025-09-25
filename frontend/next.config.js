/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Optimized for Docker deployment
  
  // Disable source maps in production for smaller build size
  productionBrowserSourceMaps: false,
  
  // Compress static assets
  compress: true,
  
  // Trailing slash configuration for consistency
  trailingSlash: false,
  
  // Ensure environment variables are available at runtime
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  
  // Proxy API requests to Django backend in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  
  // Webpack configuration for better module resolution
  webpack: (config) => {
    // Ensure proper module resolution
    config.resolve.modules = ['node_modules', 'src']
    config.resolve.extensions = ['.js', '.jsx', '.json']
    
    return config
  },
}

module.exports = nextConfig