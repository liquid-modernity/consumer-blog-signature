/**
 * GAGA Production Hardening Foundation.
 * Keeps runtime policies explicit and framework independent.
 */

export interface GagaProductionPolicy {
  reducedMotion: boolean;
  diagnostics: boolean;
  secureExternalContent: boolean;
}

export const defaultProductionPolicy: GagaProductionPolicy = {
  reducedMotion: false,
  diagnostics: false,
  secureExternalContent: true,
};

export function resolveProductionPolicy(
  overrides: Partial<GagaProductionPolicy> = {},
): GagaProductionPolicy {
  return {
    ...defaultProductionPolicy,
    ...overrides,
  };
}
