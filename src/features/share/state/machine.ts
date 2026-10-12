import type { ShareState } from "./types";

export function createShareStateMachine() {
  let state: ShareState = "idle";

  return {
    current: () => state,
    transition: (next: ShareState) => {
      state = next;
      return state;
    }
  };
}
