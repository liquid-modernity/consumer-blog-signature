// Application policy; scroll execution remains on the public Engine ScrollContext.
export const signatureMotion = Object.freeze({
  hideTravel: 96, revealTravel: 24, jitter: 3, top: 72, endInset: 48,
  revealMs: 180, retractMs: 160, geometryMs: 200, contextMs: 140,
  hoverMs: 120, leaveMs: 300, holdMs: 280,
  narrowWidth: 480, primaryNarrow: 5, primaryWide: 8, margin: 16
});
export function initialScrollIntent(position = 0) {
  return { position: Math.max(0, position), direction: 0, travel: 0, signal: 'reveal' };
}
export function resolveScrollIntent(previous, { position, viewport, contentEnd, active = true }, policy = signatureMotion) {
  const y = Math.max(0, Number.isFinite(position) ? position : previous.position);
  if (!active || y <= policy.top || y + viewport >= contentEnd - policy.endInset) return initialScrollIntent(y);
  const delta = y - previous.position;
  if (Math.abs(delta) < policy.jitter) return { ...previous, signal: 'hold' };
  const direction = Math.sign(delta);
  const travel = (previous.direction === direction ? previous.travel : 0) + Math.abs(delta);
  const threshold = direction > 0 ? policy.hideTravel : policy.revealTravel;
  return { position: y, direction, travel: travel >= threshold ? 0 : travel,
    signal: travel >= threshold ? direction > 0 ? 'retract' : 'reveal' : 'hold' };
}
export function signatureVisibility(previous, signal, pinned) {
  if (pinned) return 'pinned';
  if (signal === 'retract') return 'retracted';
  return previous === 'pinned' || signal === 'reveal' ? 'visible' : previous;
}
export function notchGeometry({ state = 'collapsed', search = false, audio = false, panel = false, viewport = 1440, actions = 0 }, policy = signatureMotion) {
  const geometry = audio ? 'audio' : panel || state === 'expanded' ? 'panel' : search ? 'search' : state === 'peek' ? 'context' : 'compact';
  const capacity = viewport < policy.narrowWidth ? policy.primaryNarrow : policy.primaryWide;
  const maximum = Math.max(0, viewport - policy.margin * 2);
  const minimum = { compact: 0, context: Math.min(capacity, actions) * 48 + 24, search: 340, audio: 320, panel: 360 }[geometry];
  return { geometry, min: Math.min(minimum, maximum), max: Math.min(geometry === 'compact' ? 352 : 448, maximum), capacity, overflow: Math.max(0, actions - capacity) };
}
export function signatureReducedMotion(system, preference) { return system || preference === 'reduced'; }
