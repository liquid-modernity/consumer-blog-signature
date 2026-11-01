import { breakpoints } from './systems.ts';
// Relevance is semantic; capacity changes only the projection of available context.
export const surfaceProjectionPolicy = Object.freeze({ minimumRelated: 2, minimumGroups: 2, denseNavigation: 8, minimumRailSpace: breakpoints.desktopMin });
/** @param {{groups?:Array<{items?:unknown[]}>, discovery?:Array<{href:string}>, facts?:Array<{id:string,values?:Array<{href?:string}>}>}} input */
export function contextualRailRelevance({ groups = [], discovery = [], facts = [] } = {}, policy = surfaceProjectionPolicy) {
  const independent = groups.filter(g => g.items?.length);
  return {
    left: independent.length >= policy.minimumGroups && independent.reduce((count,g)=>count+g.items.length,0) >= policy.denseNavigation,
    right: facts.some(f => f.id === 'graph' && f.values?.some(v=>v.href)) && new Set(discovery.map(item=>item.href).filter(Boolean)).size >= policy.minimumRelated
  };
}
export function resolveSurfacePlan({ mode, width, relevance }, policy = surfaceProjectionPolicy) {
  const spacious = mode === 'desktop' && Number.isFinite(width) && width >= policy.minimumRailSpace;
  return { left: relevance.left ? spacious ? 'rail' : 'sheet' : 'absent', right: relevance.right ? spacious ? 'rail' : 'sheet' : 'absent' };
}
