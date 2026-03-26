import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ambrosia Documentation',
    short_name: 'Ambrosia',
    theme_color: '#0a0f14',
    background_color: '#0a0f14',
    display: 'standalone',
  };
}
