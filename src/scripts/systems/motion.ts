import { initMotion as initEngineMotion } from '@gaga/engine-web/runtime/motion';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function pulse(target: HTMLElement) {
  if (prefersReducedMotion()) return;
  target.classList.add('gaga-ui-pulse');
  window.setTimeout(() => target.classList.remove('gaga-ui-pulse'), 180);
}

function animateNode(target: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  if (prefersReducedMotion()) return;
  if (typeof (target as HTMLElement).animate !== 'function') {
    if (target instanceof HTMLElement) pulse(target);
    return;
  }
  target.animate(keyframes, options);
}

export function initMotion() {
  initEngineMotion({
    isReducedMotion: prefersReducedMotion,
    animateInView(target) {
      animateNode(target, [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 350,
        easing: 'ease-out',
        fill: 'both'
      });
    },
    animateFeedback(target, detail) {
      if (typeof target.animate !== 'function') {
        pulse(target);
        return;
      }
      const hover = detail.kind === 'hover';
      target.animate([
        { transform: 'scale(1)' },
        { transform: hover ? 'scale(1.045)' : 'scale(0.94)' },
        { transform: hover ? 'scale(1)' : 'scale(1.02)' },
        { transform: 'scale(1)' }
      ], {
        duration: hover ? 140 : 180,
        easing: 'ease-out'
      });
    }
  });
}
