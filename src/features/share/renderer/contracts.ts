import type { ShareRenderPayload } from "./types";

export interface ShareRenderer {
  kind: string;
  render(payload: ShareRenderPayload): unknown;
}
