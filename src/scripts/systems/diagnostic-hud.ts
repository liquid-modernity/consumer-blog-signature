/**
 * GAGA REAL-TIME BEHAVIOURAL & RUNTIME DIAGNOSTIC HUD
 * 
 * Provides interactive real-time telemetry on:
 * - Cognitive Human Reading Behavior (Velocity, WPM, Dwell time, Mode)
 * - Scroll Container & TOC Spy Alignment
 * - Viewport Collision & Horizontal Overflow Detection
 * - Speech Narration Engine Pipeline
 * - Algorithmic Self-Healing Reconcilers
 */

import { getReadingBehaviorMetrics, subscribeReadingBehavior } from './reading-behaviour';
import { getUnifiedScrollMetrics, readingScrollOwner } from './reading-scroll';
import { rebindTocSpy } from './toc-spy';
import { requestToast } from '@gaga/engine-web/runtime/events';

let hudElement: HTMLElement | null = null;
let isVisible = false;
let updateIntervalTimer: number | undefined;

function detectHorizontalOverflowElements(): Element[] {
  const windowWidth = window.innerWidth;
  const violators: Element[] = [];
  const allElements = document.querySelectorAll<HTMLElement>('body *');

  allElements.forEach((el) => {
    // Exclude fixed diagnostic HUD itself
    if (el.closest('.gaga-diagnostic-hud')) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > windowWidth + 3 && rect.width > 0 && rect.height > 0) {
      violators.push(el);
    }
  });

  return violators;
}

export function selfHealLayoutOverflow(): number {
  const violators = detectHorizontalOverflowElements();
  violators.forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.maxWidth = '100vw';
    htmlEl.style.boxSizing = 'border-box';
    htmlEl.style.overflowX = 'clip';
  });

  document.documentElement.style.overflowX = 'clip';
  document.body.style.overflowX = 'clip';

  requestToast({
    message: violators.length
      ? `Berhasil memperbaiki ${violators.length} elemen overflow horizontal`
      : 'Layout stabil: tidak ada overflow horizontal terdeteksi',
    tone: 'ok',
    x: window.innerWidth / 2,
    y: 60
  });

  return violators.length;
}

export function selfHealTocAlignment() {
  rebindTocSpy();
  requestToast({
    message: 'TOC Spy berhasil di-re-anchor ke scroll owner aktif',
    tone: 'ok',
    x: window.innerWidth / 2,
    y: 60
  });
}

export function selfHealSelectionState() {
  const sel = window.getSelection();
  sel?.removeAllRanges();
  document.querySelectorAll('.gaga-selection-menu, .gaga-highlight-popup').forEach((m) => m.remove());
  requestToast({
    message: 'Status seleksi dan overlay berhasil di-reset',
    tone: 'ok',
    x: window.innerWidth / 2,
    y: 60
  });
}

function renderHudContent() {
  if (!hudElement || !isVisible) return;

  const behavior = getReadingBehaviorMetrics();
  const scroll = getUnifiedScrollMetrics();
  const owner = readingScrollOwner();
  const violators = detectHorizontalOverflowElements();
  const synthState = typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis.speaking
      ? 'playing'
      : window.speechSynthesis.paused
        ? 'paused'
        : 'idle'
    : 'unsupported';

  const stateClass =
    behavior.state === 'DEEP_READING'
      ? 'gaga-hud-badge--deep'
      : behavior.state === 'SKIMMING'
        ? 'gaga-hud-badge--skim'
        : 'gaga-hud-badge--idle';

  hudElement.innerHTML = `
    <div class="gaga-diagnostic-hud__header">
      <div class="gaga-diagnostic-hud__title-group">
        <span class="gaga-diagnostic-hud__dot"></span>
        <strong class="gaga-diagnostic-hud__title">GAGA RUNTIME DIAGNOSTIC HUD</strong>
      </div>
      <div class="gaga-diagnostic-hud__controls">
        <span class="gaga-diagnostic-hud__shortcut">Ctrl+Shift+D</span>
        <button type="button" class="gaga-diagnostic-hud__btn-close" aria-label="Tutup HUD" data-hud-action="close">✕</button>
      </div>
    </div>

    <div class="gaga-diagnostic-hud__grid">
      <!-- PANEL 1: HUMAN BEHAVIOUR HEURISTICS -->
      <section class="gaga-diagnostic-hud__panel">
        <h4 class="gaga-diagnostic-hud__panel-title">1. HUMAN READING BEHAVIOUR</h4>
        <div class="gaga-diagnostic-hud__row">
          <span>Engagement State:</span>
          <span class="gaga-hud-badge ${stateClass}">${behavior.state}</span>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Scroll Velocity:</span>
          <strong>${behavior.scrollVelocity} px/s</strong>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Reading Cadence:</span>
          <strong>${behavior.readingRateWpm} WPM</strong>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Section Dwell Time:</span>
          <strong>${(behavior.currentSectionDwellMs / 1000).toFixed(1)}s</strong>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Deep Reading Session:</span>
          <strong>${Math.round(behavior.totalDeepReadingMs / 1000)}s</strong>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Confidence Score:</span>
          <strong>${Math.round(behavior.confidenceScore * 100)}%</strong>
        </div>
      </section>

      <!-- PANEL 2: SCROLL & TOC ALIGNMENT -->
      <section class="gaga-diagnostic-hud__panel">
        <h4 class="gaga-diagnostic-hud__panel-title">2. SCROLL & TOC ALIGNMENT</h4>
        <div class="gaga-diagnostic-hud__row">
          <span>Active Scroll Owner:</span>
          <code title="${owner.className}">&lt;${owner.tagName.toLowerCase()}&gt;</code>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Scroll Position:</span>
          <strong>${scroll.scrollTop}px / ${scroll.maxScroll}px</strong>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Reading Progress:</span>
          <strong>${scroll.percentage}%</strong>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Current Section Anchor:</span>
          <code>${behavior.currentSectionId || '_top'}</code>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Container Scrollable:</span>
          <strong class="${owner.scrollHeight > owner.clientHeight ? 'text-ok' : 'text-warn'}">
            ${owner.scrollHeight > owner.clientHeight ? 'YES (Valid)' : 'NO (Window scroll)'}
          </strong>
        </div>
      </section>

      <!-- PANEL 3: LAYOUT INTEGRITY & OVERFLOW -->
      <section class="gaga-diagnostic-hud__panel">
        <h4 class="gaga-diagnostic-hud__panel-title">3. LAYOUT & VIEWPORT INTEGRITY</h4>
        <div class="gaga-diagnostic-hud__row">
          <span>Viewport Dimensions:</span>
          <strong>${window.innerWidth} × ${window.innerHeight}</strong>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Horizontal Overflow:</span>
          <strong class="${violators.length > 0 ? 'text-danger' : 'text-ok'}">
            ${violators.length > 0 ? `${violators.length} Violations!` : '0 (Zero Overflow)'}
          </strong>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Speech Synthesis State:</span>
          <strong>${synthState.toUpperCase()}</strong>
        </div>
        <div class="gaga-diagnostic-hud__row">
          <span>Active Preference Theme:</span>
          <code>${document.body.dataset.gagaContrast || 'standard'}</code>
        </div>
      </section>
    </div>

    <!-- SELF-HEALING ACTION BAR -->
    <div class="gaga-diagnostic-hud__actions">
      <span class="gaga-diagnostic-hud__actions-label">Algorithmic Self-Healing Actions:</span>
      <div class="gaga-diagnostic-hud__btn-group">
        <button type="button" class="gaga-btn gaga-btn--sm" data-hud-action="heal-toc">
          Re-anchor TOC Spy
        </button>
        <button type="button" class="gaga-btn gaga-btn--sm" data-hud-action="heal-overflow">
          Fix Layout Overflow
        </button>
        <button type="button" class="gaga-btn gaga-btn--sm" data-hud-action="heal-selection">
          Reset Selection & Marks
        </button>
      </div>
    </div>
  `;

  hudElement.querySelector('[data-hud-action="close"]')?.addEventListener('click', toggleDiagnosticHud);
  hudElement.querySelector('[data-hud-action="heal-toc"]')?.addEventListener('click', selfHealTocAlignment);
  hudElement.querySelector('[data-hud-action="heal-overflow"]')?.addEventListener('click', () => selfHealLayoutOverflow());
  hudElement.querySelector('[data-hud-action="heal-selection"]')?.addEventListener('click', selfHealSelectionState);
}

export function toggleDiagnosticHud() {
  isVisible = !isVisible;
  if (!hudElement) {
    hudElement = document.createElement('div');
    hudElement.className = 'gaga-diagnostic-hud';
    hudElement.setAttribute('role', 'dialog');
    hudElement.setAttribute('aria-label', 'Gaga Runtime Diagnostic HUD');
    document.body.appendChild(hudElement);
  }

  hudElement.hidden = !isVisible;
  if (isVisible) {
    renderHudContent();
    window.clearInterval(updateIntervalTimer);
    updateIntervalTimer = window.setInterval(renderHudContent, 400);
  } else {
    window.clearInterval(updateIntervalTimer);
  }
}

export function initDiagnosticHud() {
  if (typeof window === 'undefined') return;

  window.addEventListener('keydown', (e) => {
    // Ctrl + Shift + D toggle shortcut
    if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      toggleDiagnosticHud();
    }
  });

  // Subscribe to behavioral changes to refresh HUD if open
  subscribeReadingBehavior(() => {
    if (isVisible) renderHudContent();
  });
}
