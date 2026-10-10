import { gagaActionRegistry } from '../config/gaga-action-registry';

export function resolveGagaAction(id: keyof typeof gagaActionRegistry) {
  return gagaActionRegistry[id];
}
