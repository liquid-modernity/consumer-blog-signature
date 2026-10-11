/**
 * Runtime lifecycle contract for cleanup-aware initialization.
 */

export interface GagaLifecycle {
  mount(): void;
  destroy(): void;
}
