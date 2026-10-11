import type { Loader } from 'astro/loaders';
import { glob } from 'glob';
import fs from 'node:fs/promises';
import path from 'node:path';

export function gagaContentLoader(): Loader {
  return {
    name: 'gaga-content-loader',

    async load(context) {
      const contentRoot = path.resolve('src/content/docs');

      const files = await glob('**/*.{md,mdx}', {
        cwd: contentRoot
      });

      for (const file of files) {
        const absolutePath = path.join(contentRoot, file);
        const body = await fs.readFile(absolutePath, 'utf-8');

        const id = file
          .replace(/\.(md|mdx)$/, '')
          .replace(/\\/g, '/');

        context.store.set({
          id,
          data: {},
          body
        });
      }
    }
  };
}
