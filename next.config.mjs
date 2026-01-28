/** @type {import('next').NextConfig} */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp'],
  },
    reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  // Disable preload warnings
  webpack: (config) => {
    config.infrastructureLogging = {
      level: 'error',
    }
    return config
  }
}

export default nextConfig
