import type { ShareChannelPayload } from "./types";

export interface ChannelAdapter {
  channel: string;
  execute(payload: ShareChannelPayload): Promise<unknown>;
}
