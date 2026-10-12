import { glob } from 'astro/loaders';

export function gagaContentLoader() {
  return glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/docs',
    generateId({ entry }) {
      return entry.replace(/\.(md|mdx)$/, '');
    }
  });
}
