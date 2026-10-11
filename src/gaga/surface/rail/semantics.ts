export type GagaRailRole =
  | "navigation"
  | "complementary";

export function applyRailSemantics(
  rail: HTMLElement,
  role: GagaRailRole,
): void {
  rail.setAttribute("role", role);
}
