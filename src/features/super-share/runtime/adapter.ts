import type { SuperShareContext } from "../contracts/types";

export interface SuperShareRuntimeAdapter {
  resolve(context: SuperShareContext): unknown;
}
