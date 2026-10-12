import type { ShareInputMode } from "./types";

export interface ShareAccessibilityContract {
  mode: ShareInputMode;
  announce(label: string): string;
}
