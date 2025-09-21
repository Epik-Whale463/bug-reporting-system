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
  
  // Webpack configuration to support absolute imports
  webpack: (config) => {
    // Ensure module resolution works correctly
    config.resolve.modules = ['node_modules', 'src']
    return config
  },
}

module.exports = nextConfig