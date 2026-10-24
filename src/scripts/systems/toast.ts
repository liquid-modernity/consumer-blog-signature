import { onRuntimeEvent, type ToastDetail } from '@gaga/engine-runtime/runtime/events';

let toastEl: HTMLElement | null = null;
let lastPointer = { x: 24, y: 24 };
let clearTimer = 0;

function ensureToast() {
  if (toastEl) return toastEl;
  toastEl = document.createElement('output');
  toastEl.className = 'gaga-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.dataset.gagaState = 'hidden';
  document.body.append(toastEl);
  return toastEl;
}

function show(detail: ToastDetail) {
  const node = ensureToast();
  const x = detail.x ?? lastPointer.x;
  const y = detail.y ?? lastPointer.y;
  const offset = 18;
  node.textContent = detail.message;
  node.dataset.gagaState = 'visible';
  node.dataset.gagaTone = detail.tone ?? 'info';
  node.style.left = `${Math.min(Math.max(10, x + offset), window.innerWidth - 180)}px`;
  node.style.top = `${Math.min(Math.max(10, y + offset), window.innerHeight - 64)}px`;
  window.clearTimeout(clearTimer);
  clearTimer = window.setTimeout(() => {
    if (toastEl) toastEl.dataset.gagaState = 'hidden';
  }, 980);
}

export function initToast() {
  document.addEventListener('pointermove', (event) => {
    lastPointer = { x: event.clientX, y: event.clientY };
  }, { passive: true });

  onRuntimeEvent('toastRequested', (detail) => {
    if (!detail.message) return;
    show(detail);
  });
}
