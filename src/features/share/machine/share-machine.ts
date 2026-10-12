import type { ShareState } from '../contracts';

export interface ShareMachine {
  state: ShareState;
  transition(next: ShareState): ShareMachine;
}

export function createShareMachine(): ShareMachine {
  return {
    state: 'idle',
    transition(next) {
      return createShareMachineWithState(next);
    },
  };
}

function createShareMachineWithState(state: ShareState): ShareMachine {
  return {
    state,
    transition(next) {
      return createShareMachineWithState(next);
    },
  };
}
