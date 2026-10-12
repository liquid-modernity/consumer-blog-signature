import type { ReaderShareContext } from "./types";

export function resolveReaderShare(context: ReaderShareContext) {
  return {
    context,
    source: "reader"
  };
}
