import type { ReaderShareContext } from "./types";

export interface ReaderShareIntegration {
  resolve(context: ReaderShareContext): unknown;
}
