import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://mic-web-tester.vercel.app');

  return [
    {
      url: siteUrl,
      lastModified: new Date('2026-10-09T00:00:00Z'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
