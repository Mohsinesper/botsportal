
import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CallFlowAI',
    short_name: 'CallFlowAI',
    description: 'AI-Powered Call Center Optimization Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7FAFC', // Corresponds to --background light
    theme_color: '#29ABE2', // Corresponds to --primary
    icons: [
      {
        src: '/icon-192x192.png', // Placeholder, you would need to add these icons to /public
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png', // Placeholder
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
