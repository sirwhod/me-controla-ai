import type { MetadataRoute } from 'next'

import Icon192 from '@/public/icon-192x192.png'
import Icon512 from '@/public/icon-512x512.png'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MeControla.AI',
    short_name: 'MeControla.AI',
    description: 'Aplicativo de gestão financeira.',
    start_url: '/',
    display: 'minimal-ui',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: Icon192.src,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: Icon512.src,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}