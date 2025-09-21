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
  
  // Webpack configuration for better module resolution
  webpack: (config) => {
    // Ensure proper module resolution
    config.resolve.modules = ['node_modules', 'src']
    config.resolve.extensions = ['.js', '.jsx', '.json']
    
    return config
  },
}

module.exports = nextConfig