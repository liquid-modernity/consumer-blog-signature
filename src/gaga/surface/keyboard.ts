export type GagaSurfaceKey =
  | "Enter"
  | " "
  | "Escape"
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight";

export function isActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

export function isDismissKey(key: string): boolean {
  return key === "Escape";
}
