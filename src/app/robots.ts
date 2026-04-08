import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Block all crawlers on staging
  if (process.env.NEXT_PUBLIC_SITE_ENV === 'staging') {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/sanity/', '/_next/'],
      },
    ],
    sitemap: 'https://giotile.com/sitemap.xml',
  }
}
