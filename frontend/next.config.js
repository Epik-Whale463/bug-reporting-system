const path = require('path')

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
  webpack: (config, { isServer }) => {
    // Add alias for @ imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    
    return config
  },
}

module.exports = nextConfig