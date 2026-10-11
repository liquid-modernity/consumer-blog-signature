import type { GagaShareChannel } from './types';

const channels = new Map<string, GagaShareChannel>();

export function registerShareChannel(channel: GagaShareChannel) {
  channels.set(channel.id, channel);
}

export function getShareChannels() {
  return [...channels.values()];
}
