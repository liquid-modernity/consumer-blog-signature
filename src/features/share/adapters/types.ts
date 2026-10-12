export type ShareChannel =
  | "native"
  | "copy-link"
  | "external";

export interface ShareChannelPayload {
  title: string;
  url: string;
  text?: string;
}
