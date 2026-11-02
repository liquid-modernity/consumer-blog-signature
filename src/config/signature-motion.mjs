import {createSignatureExperience} from '@gaga/arsenal/experience';
// Application policy; scroll execution remains on the public Engine ScrollContext.
export const signatureMotion = Object.freeze({
  hideTravel: 96, revealTravel: 24, jitter: 3, top: 72, endInset: 48,
  revealMs: 180, retractMs: 160, geometryMs: 200, contextMs: 140,
  hoverMs: 120, leaveMs: 300, holdMs: 280,
  outlineExpandTravel: 56, outlineCloseTravel: 72,
  narrowWidth: 480, primaryNarrow: 5, primaryWide: 8, margin: 16,
  geometry:{controlSize:48,contextInset:24,compactMaximum:352,maximum:448,minimum:{search:340,audio:320,panel:360}}
});
export const {initialScrollIntent,resolveScrollIntent,signatureVisibility,notchGeometry,signatureReducedMotion}=createSignatureExperience(signatureMotion);
