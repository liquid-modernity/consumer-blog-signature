export function createComposerFlow() {
  return {
    state: "idle",
    transition(next: string) {
      this.state = next;
      return this.state;
    },
  };
}
