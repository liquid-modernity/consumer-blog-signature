import { normalizeNavigationItems, currentNavigationItem, paginationRelations } from '@gaga/engine-capabilities/navigation';
export const cleanPath = path => path.replace(/\/+$/, '') || '/';
/** @param {Array<import("@gaga/engine-capabilities/navigation").NavigationItem & {labelEn?:string}>} items @returns {Array<import("@gaga/engine-capabilities/navigation").NavigationItem & {labelEn?:string}>} */
export const flattenNavigation = items => items.flatMap(item => [item, ...flattenNavigation(item.children ?? [])]);

// Input is normalized application navigation, never provider-specific content.
/** @param {{path:string,title:string,family?:string,items?: Array<import('@gaga/engine-capabilities/navigation').NavigationItem & {labelEn?:string}>,ordered?: import('@gaga/engine-capabilities/navigation').NavigationItem[],documentOutline?: Array<{id:string}>}} input */
export function resolveLocalContext({ path, title, family, items = [], ordered = [], documentOutline = [] }) {
  path = cleanPath(path);
  const seen = new Set(), destinations = new Set();
  function validate(entries) {
    for (const item of entries) {
      if ((item.href.includes('#')&&item.href.split('#')[0]!==path)||!item.id || !item.label?.trim() || seen.has(item.id) || destinations.has(item.href) || (!/^\/(?!\/)[^?#\\\s]*(?:#[a-zA-Z][\w-]*)?$/.test(item.href) || /(?:^|\/)\.\.?(?:\/|$)|%2f|%5c|%2e/i.test(item.href))) throw new Error('Invalid or duplicate local navigation');
      seen.add(item.id); destinations.add(item.href); validate(item.children ?? []);
    }
  }
  validate(items);
  const flat = flattenNavigation(items);
  if (ordered.some(i => !flat.some(item => item.id === i.id && item.href === i.href))) throw new Error('Sequence must use registered local destinations');
  const nearest = flat.filter(i => path === i.href || path.startsWith(i.href + '/')).sort((a,b) => b.href.length - a.href.length)[0];
  const labels = new Map(flat.map(i=>[i.href,i.labelEn]));
  function project(entries) {
    return normalizeNavigationItems(entries.map(item => ({ ...item, relation: item === nearest ? 'current' : 'related', children: project(item.children ?? []) }))).map(item=>({...item,labelEn:labels.get(item.href)}));
  }
  const localNavigation = project(items);
  const current = currentNavigationItem(flattenNavigation(localNavigation).map(i=>({...i,children:undefined})));
  const index = ordered.findIndex(i => i.href === path);
  const sequence = paginationRelations(index < 0 ? [] : [
    ...(ordered[index-1] ? [{...ordered[index-1], relation:'previous'}] : []),
    ...(ordered[index+1] ? [{...ordered[index+1], relation:'next'}] : [])
  ]);
  return { family, localNavigation, documentOutline, sequence, position: { path, label: title, currentId: current?.id, exact: current?.href === path } };
}
export function hasLocalNavigation(context) {
  return flattenNavigation(context?.localNavigation ?? []).some(i => i.href !== context.position.path);
}
/** @param {import('@gaga/engine-capabilities/navigation').NavigationItem[]} items @param {string} id */
export function headingSequence(items, id) {
  const index = items.findIndex(i => i.id === id);
  return paginationRelations(index < 0 ? [] : [
    ...(items[index-1] ? [{...items[index-1],relation:'previous'}] : []),
    ...(items[index+1] ? [{...items[index+1],relation:'next'}] : [])
  ]);
}

export function localNavigationLayout(items){return items.length<=5&&items.every(i=>!i.children?.length&&i.label.length<=32)?'compact':'list';}
