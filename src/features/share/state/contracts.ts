import type { ShareState } from "./types";

export interface ShareStateMachine {
  current(): ShareState;
  transition(next: ShareState): ShareState;
}
