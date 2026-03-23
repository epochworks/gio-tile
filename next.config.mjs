import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'www.giotile.com',
      },
    ],
  },

  async redirects() {
    const redirectsPath = resolve(__dirname, 'data/redirects.json')

    if (!existsSync(redirectsPath)) {
      return []
    }

    try {
      const raw = readFileSync(redirectsPath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      console.warn('Warning: Could not parse data/redirects.json')
      return []
    }
  },
}

export default nextConfig
