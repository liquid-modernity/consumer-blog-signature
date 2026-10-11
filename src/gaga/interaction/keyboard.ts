export const GAGA_KEYBOARD_KEYS = {
  escape: 'Escape',
  enter: 'Enter',
  space: ' ',
  tab: 'Tab',
} as const;

export function isActivationKey(key: string): boolean {
  return key === GAGA_KEYBOARD_KEYS.enter || key === GAGA_KEYBOARD_KEYS.space;
}
