import { capabilityRegistry } from '../config/capabilities';
export const gagaCapabilityBindings = {
  annotation: capabilityRegistry.reading.annotation,
  spokenContent: capabilityRegistry.reading.speak,
  search: capabilityRegistry.intelligence.search,
  i18n: capabilityRegistry.personalization.languageSwitching,
  motion: capabilityRegistry.interaction.motion,
  sfx: capabilityRegistry.interaction.sfx,
  keyboard: capabilityRegistry.interaction.keyboard,
  touch: capabilityRegistry.interaction.touch
} as const;
