import type { ShareChannel } from "./types";

export function resolveChannelAdapter(channel: ShareChannel) {
  return {
    channel,
    extractionReady: true
  };
}
