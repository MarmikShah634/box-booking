import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boxcricket.in'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/city/', '/venue/', '/legal/'],
        disallow: ['/me/', '/book/', '/auth/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
