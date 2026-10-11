import type { GagaNodeType } from './types';

export type GagaNodeRenderer = string;

const registry = new Map<GagaNodeType, GagaNodeRenderer>();

export function registerGagaNode(type: GagaNodeType, renderer: GagaNodeRenderer) {
  registry.set(type, renderer);
}

export function resolveGagaNode(type: GagaNodeType) {
  return registry.get(type);
}
