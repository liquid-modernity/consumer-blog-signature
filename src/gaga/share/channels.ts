import type { GagaShareChannel } from './types';

export const nativeShareChannel: GagaShareChannel = {
  id: 'native',
  async execute(metadata) {
    if (!navigator.share) return false;

    await navigator.share({
      title: metadata.title,
      text: metadata.description,
      url: metadata.url
    });

    return true;
  }
};

export const clipboardShareChannel: GagaShareChannel = {
  id: 'clipboard',
  async execute(metadata) {
    await navigator.clipboard.writeText(metadata.url);
    return true;
  }
};
