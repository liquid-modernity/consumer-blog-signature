export function resolveKeyboardAction(key: string) {
  if (key === "Escape") return "close";
  if (key === "Enter") return "activate";
  return "ignore";
}
