/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      lib: path.resolve(__dirname, 'lib'),
      components: path.resolve(__dirname, 'components'),
    }
    return config
  }
}

module.exports = nextConfig