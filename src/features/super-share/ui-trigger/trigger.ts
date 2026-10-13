import type { SuperShareTriggerContext } from "./types";

export interface SuperShareTrigger {
  open(context: SuperShareTriggerContext): void;
}
