/**
 * GAGA HUMAN BEHAVIOUR & COGNITIVE READING VELOCITY ALGORITHM
 * 
 * Accurately models and tracks reader engagement, distinguishing between
 * rapid visual skimming vs deep cognitive reading using velocity (px/s),
 * estimated reading pace (words per minute), and dwell-time heuristics.
 */

export type ReadingBehaviorState = 'SKIMMING' | 'DEEP_READING' | 'IDLE_PAUSE';

export interface ReadingBehaviorMetrics {
  state: ReadingBehaviorState;
  scrollVelocity: number; // Pixels per second (exponential moving average)
  readingRateWpm: number; // Words per minute across currently visible text
  currentSectionId: string;
  currentSectionDwellMs: number; // Milliseconds spent in current section
  totalDeepReadingMs: number; // Cumulative deep reading time in session
  totalSkimmingMs: number; // Cumulative skimming time
  confidenceScore: number; // 0.0 to 1.0 confidence in engagement
}

type BehaviorChangeListener = (metrics: ReadingBehaviorMetrics) => void;

let currentState: ReadingBehaviorState = 'DEEP_READING';
let lastScrollY = 0;
let lastScrollTimestamp = 0;
let smoothedVelocity = 0; // px/s
let currentSectionId = '_top';
let sectionEnterTimestamp = Date.now();
let lastUserInteractionTimestamp = Date.now();
let totalDeepReadingMs = 0;
let totalSkimmingMs = 0;
let lastTickTimestamp = Date.now();
let isTracking = false;

const listeners = new Set<BehaviorChangeListener>();

// Behavioral Thresholds
const VELOCITY_SMOOTHING_FACTOR = 0.35;
const SKIMMING_VELOCITY_THRESHOLD = 650; // px/s
const DEEP_READING_MAX_VELOCITY = 320; // px/s
const IDLE_TIMEOUT_MS = 35000; // 35 seconds of inactivity -> IDLE_PAUSE
const MIN_SECTION_DWELL_FOR_DEEP_READING_MS = 1800; // 1.8 seconds minimum

function getActiveScrollY(): number {
  const container = document.querySelector<HTMLElement>('[data-gaga-article-scroll], .gaga-main-region');
  if (container && container.scrollTop > 0) {
    return container.scrollTop;
  }
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function calculateVisibleWords(): number {
  const articleContent = document.querySelector<HTMLElement>(
    '.gaga-flagship-article__prose, .gaga-markdown-content, [data-gaga-article-shell]'
  );
  if (!articleContent) return 0;

  const viewportHeight = window.innerHeight;
  const paragraphs = articleContent.querySelectorAll<HTMLElement>('p, blockquote, li');
  let totalWords = 0;

  paragraphs.forEach((p) => {
    const rect = p.getBoundingClientRect();
    // Element intersects viewport reading area (between 10% and 80% of screen)
    if (rect.bottom > viewportHeight * 0.1 && rect.top < viewportHeight * 0.8) {
      const text = p.textContent || '';
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      totalWords += wordCount;
    }
  });

  return totalWords;
}

function computeMetrics(): ReadingBehaviorMetrics {
  const now = Date.now();
  const dwellMs = now - sectionEnterTimestamp;
  const visibleWords = calculateVisibleWords();
  const minutesInView = Math.max(0.05, dwellMs / 60000);
  const calculatedWpm = Math.min(1200, Math.round(visibleWords / minutesInView));

  // Determine engagement confidence
  let confidence = 0.5;
  if (currentState === 'DEEP_READING') {
    confidence = Math.min(1.0, 0.6 + (dwellMs / 10000) * 0.4);
  } else if (currentState === 'SKIMMING') {
    confidence = Math.min(0.9, 0.4 + (smoothedVelocity / 1500) * 0.5);
  } else {
    confidence = 0.2;
  }

  return {
    state: currentState,
    scrollVelocity: Math.round(smoothedVelocity),
    readingRateWpm: calculatedWpm,
    currentSectionId,
    currentSectionDwellMs: dwellMs,
    totalDeepReadingMs,
    totalSkimmingMs,
    confidenceScore: Math.round(confidence * 100) / 100
  };
}

function notifyListeners() {
  const metrics = computeMetrics();
  listeners.forEach((listener) => {
    try {
      listener(metrics);
    } catch (err) {
      console.warn('[Gaga Reading Behaviour] Listener error:', err);
    }
  });
}

function evaluateBehaviorState() {
  const now = Date.now();
  const timeSinceInteraction = now - lastUserInteractionTimestamp;
  const dwellMs = now - sectionEnterTimestamp;

  if (timeSinceInteraction > IDLE_TIMEOUT_MS) {
    if (currentState !== 'IDLE_PAUSE') {
      currentState = 'IDLE_PAUSE';
      notifyListeners();
    }
    return;
  }

  if (smoothedVelocity > SKIMMING_VELOCITY_THRESHOLD) {
    if (currentState !== 'SKIMMING') {
      currentState = 'SKIMMING';
      notifyListeners();
    }
    return;
  }

  if (smoothedVelocity <= DEEP_READING_MAX_VELOCITY && dwellMs >= MIN_SECTION_DWELL_FOR_DEEP_READING_MS) {
    if (currentState !== 'DEEP_READING') {
      currentState = 'DEEP_READING';
      notifyListeners();
    }
    return;
  }
}

function onScrollTick() {
  const now = performance.now();
  const currentY = getActiveScrollY();

  if (lastScrollTimestamp > 0) {
    const deltaMs = Math.max(1, now - lastScrollTimestamp);
    const deltaY = Math.abs(currentY - lastScrollY);
    const instantaneousVelocity = (deltaY / deltaMs) * 1000; // px/s

    // Exponential moving average
    smoothedVelocity =
      VELOCITY_SMOOTHING_FACTOR * instantaneousVelocity +
      (1 - VELOCITY_SMOOTHING_FACTOR) * smoothedVelocity;
  }

  lastScrollY = currentY;
  lastScrollTimestamp = now;
  lastUserInteractionTimestamp = Date.now();

  evaluateBehaviorState();
}

function backgroundCadenceTick() {
  const now = Date.now();
  const deltaMs = now - lastTickTimestamp;
  lastTickTimestamp = now;

  // Gradually decay velocity towards zero when not actively scrolling
  smoothedVelocity *= 0.85;
  if (smoothedVelocity < 5) smoothedVelocity = 0;

  if (currentState === 'DEEP_READING') {
    totalDeepReadingMs += deltaMs;
  } else if (currentState === 'SKIMMING') {
    totalSkimmingMs += deltaMs;
  }

  evaluateBehaviorState();
  notifyListeners();
}

export function subscribeReadingBehavior(listener: BehaviorChangeListener): () => void {
  listeners.add(listener);
  listener(computeMetrics());
  return () => {
    listeners.delete(listener);
  };
}

export function getReadingBehaviorMetrics(): ReadingBehaviorMetrics {
  return computeMetrics();
}

export function notifySectionChanged(sectionId: string) {
  if (currentSectionId === sectionId) return;
  currentSectionId = sectionId;
  sectionEnterTimestamp = Date.now();
  lastUserInteractionTimestamp = Date.now();
  notifyListeners();
}

export function isValidCognitiveReading(): boolean {
  return currentState === 'DEEP_READING' && smoothedVelocity < SKIMMING_VELOCITY_THRESHOLD;
}

export function initReadingBehavior() {
  if (isTracking || typeof window === 'undefined') return;
  isTracking = true;

  lastScrollY = getActiveScrollY();
  lastScrollTimestamp = performance.now();
  lastTickTimestamp = Date.now();
  sectionEnterTimestamp = Date.now();

  let scrollThrottle = false;
  const throttledScroll = () => {
    if (!scrollThrottle) {
      scrollThrottle = true;
      requestAnimationFrame(() => {
        onScrollTick();
        scrollThrottle = false;
      });
    }
  };

  window.addEventListener('scroll', throttledScroll, { passive: true });
  document.addEventListener('scroll', throttledScroll, { passive: true, capture: true });

  ['mousedown', 'mousemove', 'keydown', 'touchstart', 'pointerdown'].forEach((evt) => {
    window.addEventListener(
      evt,
      () => {
        lastUserInteractionTimestamp = Date.now();
      },
      { passive: true }
    );
  });

  // Regular 500ms cadence timer
  window.setInterval(backgroundCadenceTick, 500);
}
