export const gagaMediaRegistry = {
  image: {
    id: 'image',
    capabilities: ['responsive', 'caption', 'fullscreen']
  },
  carousel: {
    id: 'carousel',
    capabilities: ['keyboard', 'touch', 'lazy']
  },
  gallery: {
    id: 'gallery',
    capabilities: ['grid', 'lightbox']
  },
  video: {
    id: 'video',
    capabilities: ['chapter', 'caption']
  },
  audio: {
    id: 'audio',
    capabilities: ['narration']
  },
  embed: {
    id: 'embed',
    capabilities: ['interactive']
  }
} as const;
