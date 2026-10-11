import type { Loader } from 'astro/loaders';

export function gagaContentLoader(): Loader {
  return {
    name: 'gaga-content-loader',

    async load(context) {
      return;
    }
  };
}
