import {breakpoints} from './systems.ts';
import {resolveNotchPresentation as resolvePresentation,positionLinkPreview as positionPreview} from '@gaga/arsenal/experience';
export const notchPresentation=Object.freeze({placement:'top',shape:'notch'});
export const resolveNotchPresentation=(input=notchPresentation,width=1440)=>resolvePresentation(input,width,{sideMinimum:breakpoints.desktopMin,notchMinimum:breakpoints.tabletMiniMin});
export const positionLinkPreview=(anchor,box,viewport)=>positionPreview(anchor,box,viewport,{gap:10,margin:8});

export function outlineForRoute(items, path, kind, document = false) {
  if (kind !== 'article' && !document) return [];
  const meaningful = items.filter(item => item.slug !== '_top');
  return document && meaningful.length < 2 ? [] : meaningful;
}
