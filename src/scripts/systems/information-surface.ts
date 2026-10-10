import { initInformationSurface as initEngineInformationSurface } from '@gaga/engine-web/runtime/information-surface';
import { requestFeedback, requestOutline } from '@gaga/engine-web/runtime/events';
import { getInformationPreviewRestoreDelayMs } from '../../config/systems';

let initialized = false;

export function initInformationSurface() {
  if (initialized) return;
  initialized = true;
  initEngineInformationSurface({
    ctaText: 'Read Article',
    restoreDelayMs: getInformationPreviewRestoreDelayMs(),
    requestFeedback,
    requestOutline,
    getFeedback: ({ title }) => ({
      label: `Preview ${title}`,
      x: window.innerWidth - 220,
      y: 64,
      source: 'information-preview'
    })
  });
}
