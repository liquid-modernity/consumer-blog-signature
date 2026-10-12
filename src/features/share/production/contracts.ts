import type { ProductionShareContext } from "./types";

export interface ProductionShareSurface {
  open(context: ProductionShareContext): void;
}
