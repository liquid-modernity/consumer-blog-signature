export interface ComposerFlowContract {
  state: string;
  transition(next: string): string;
}
