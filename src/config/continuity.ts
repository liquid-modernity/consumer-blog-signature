export const continuityStatuses = ['read-next', 'in-progress', 'reference', 'completed'] as const;

export type ContinuityStatus = typeof continuityStatuses[number];

export type ContinuityItem = {
  id: string;
  href: string;
  title: string;
  lastHeadingId?: string;
  lastHeadingText?: string;
  progress: number;
  status: ContinuityStatus;
  updatedAt: string;
  completedAt?: string;
};

export type ContinuityState = {
  version: 1;
  updatedAt: string;
  currentId?: string;
  items: ContinuityItem[];
};

export const continuityStoragePolicy = {
  version: 1,
  maxItems: 40,
  retentionDays: 180,
  completionProgress: 92,
  progressWriteIntervalMs: 12000
} as const;

export const defaultContinuityState: ContinuityState = {
  version: continuityStoragePolicy.version,
  updatedAt: '',
  items: []
};

const unsafeLocalHrefCharacters = /[\\\u0000-\u001F\u007F]/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isLocalContinuityHref(value: unknown): value is string {
  return isNonEmptyString(value) &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !unsafeLocalHrefCharacters.test(value);
}

export function isContinuityStatus(value: unknown): value is ContinuityStatus {
  return continuityStatuses.some((status) => status === value);
}

export function isContinuityItem(value: unknown): value is ContinuityItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Partial<ContinuityItem>;
  return isNonEmptyString(item.id) &&
    isLocalContinuityHref(item.href) &&
    isNonEmptyString(item.title) &&
    typeof item.progress === 'number' &&
    Number.isFinite(item.progress) &&
    item.progress >= 0 &&
    item.progress <= 100 &&
    isContinuityStatus(item.status) &&
    isNonEmptyString(item.updatedAt) &&
    (item.lastHeadingId === undefined || isNonEmptyString(item.lastHeadingId)) &&
    (item.lastHeadingText === undefined || isNonEmptyString(item.lastHeadingText)) &&
    (item.completedAt === undefined || isNonEmptyString(item.completedAt));
}

export function isContinuityState(value: unknown): value is ContinuityState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const state = value as Partial<ContinuityState>;
  return state.version === continuityStoragePolicy.version &&
    isNonEmptyString(state.updatedAt) &&
    (state.currentId === undefined || isNonEmptyString(state.currentId)) &&
    Array.isArray(state.items) &&
    state.items.length <= continuityStoragePolicy.maxItems &&
    state.items.every(isContinuityItem);
}
