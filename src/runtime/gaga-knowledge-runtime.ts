import { gagaKnowledgeRegistry } from '../config/gaga-knowledge-registry';

export function resolveGagaKnowledge(type: keyof typeof gagaKnowledgeRegistry) {
  return gagaKnowledgeRegistry[type];
}
