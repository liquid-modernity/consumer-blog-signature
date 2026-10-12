import type { SharePreviewModel } from './types';

export interface PreviewCanvas {
  render(model: SharePreviewModel): unknown;
}
