/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize compilation
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },

  // Reduce webpack bundle overhead
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce HMR overhead
      config.watchOptions = {
        poll: 1000, // Check for changes every second instead of continuously
        aggregateTimeout: 300, // Delay before rebuilding
      };
    }
    return config;
  },
}

module.exports = nextConfig
