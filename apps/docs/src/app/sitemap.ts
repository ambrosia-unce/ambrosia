import { source } from '@/lib/source';
import type { MetadataRoute } from 'next';

const baseUrl = 'https://ambrosia.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages();

  const docEntries: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}/${page.locale}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ru`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...docEntries,
  ];
}
