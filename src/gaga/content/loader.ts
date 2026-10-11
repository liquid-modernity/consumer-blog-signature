import type { Loader } from 'astro/loaders';
import { glob } from 'astro/loaders';

export function gagaContentLoader(): Loader {
  return glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/docs',
    generateId({ entry }) {
      return entry
        .replace(/\.(md|mdx)$/, '')
        .replace(/\\/g, '/');
    }
  });
}
