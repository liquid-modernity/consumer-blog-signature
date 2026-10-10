import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRemarkObsidianBridge } from '@gaga/engine-obsidian';
import { contentRootConfig } from '../config/content-roots.mjs';

const repositoryRoot = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

function resolveHref(context) {
  if (context.slug) return `/${context.slug.replace(/^\/|\/$/g, '')}`;
  const rel = context.relativePath.replace(/\\/g, '/').replace(/\.(md|mdx)$/, '').replace(/(^|\/)index$/, '');
  return `/${rel.replace(/^\/|\/$/g, '')}`;
}

export const remarkObsidianBridge = createRemarkObsidianBridge({
  projectRoot: repositoryRoot,
  docsRoot: contentRootConfig.docsRoot,
  resolveHref
});
