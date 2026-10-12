import type { CoverageMode, CoverageStatus } from './editorial-schema';

export interface CoverageUpdate {
  id: string;
  timestamp: string;
  title: string;
  summary?: string;
  href?: string;
}

export interface CoverageAuthority {
  mode: CoverageMode;
  status: CoverageStatus;
  active: boolean;
  label: string;
  summary?: string;
  startedAt?: string;
  updatedAt?: string;
  endedAt?: string;
  latestUpdate?: CoverageUpdate;
  updates: CoverageUpdate[];
}

export interface CoverageSource {
  breaking?: unknown;
  live?: unknown;
  coverageMode?: unknown;
  coverageStatus?: unknown;
  coverageLabel?: unknown;
  coverageSummary?: unknown;
  coverageStartedAt?: unknown;
  coverageUpdatedAt?: unknown;
  coverageEndedAt?: unknown;
  coverageUpdates?: unknown;
}

const MODES: readonly CoverageMode[] = ['standard', 'breaking', 'live'];
const STATUSES: readonly CoverageStatus[] = ['inactive', 'active', 'paused', 'ended'];

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function validMode(value: unknown): value is CoverageMode {
  return typeof value === 'string' && MODES.includes(value as CoverageMode);
}

function validStatus(value: unknown): value is CoverageStatus {
  return typeof value === 'string' && STATUSES.includes(value as CoverageStatus);
}

function timestamp(value?: string) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeUpdates(value: unknown): CoverageUpdate[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): CoverageUpdate | undefined => {
      if (!item || typeof item !== 'object') return undefined;
      const record = item as Record<string, unknown>;
      const timestampValue = stringValue(record.timestamp);
      const title = stringValue(record.title);
      if (!timestampValue || !title) return undefined;

      return {
        id: stringValue(record.id) ?? `update-${index + 1}`,
        timestamp: timestampValue,
        title,
        ...(stringValue(record.summary) ? { summary: stringValue(record.summary) } : {}),
        ...(stringValue(record.href) ? { href: stringValue(record.href) } : {})
      };
    })
    .filter((item): item is CoverageUpdate => Boolean(item))
    .sort((left, right) => timestamp(right.timestamp) - timestamp(left.timestamp));
}

export function resolveCoverageAuthority(source: CoverageSource): CoverageAuthority {
  const legacyLive = source.live === true;
  const legacyBreaking = source.breaking === true;

  const mode: CoverageMode = legacyLive
    ? 'live'
    : legacyBreaking
      ? 'breaking'
      : validMode(source.coverageMode)
        ? source.coverageMode
        : 'standard';

  const status: CoverageStatus = mode === 'standard'
    ? 'inactive'
    : validStatus(source.coverageStatus)
      ? source.coverageStatus
      : 'active';

  const updates = normalizeUpdates(source.coverageUpdates);
  const latestUpdate = updates[0];
  const updatedAt = stringValue(source.coverageUpdatedAt)
    ?? latestUpdate?.timestamp
    ?? stringValue(source.coverageStartedAt);

  const defaultLabel = mode === 'live'
    ? 'Live'
    : mode === 'breaking'
      ? 'Breaking'
      : 'Standard';

  return {
    mode,
    status,
    active: mode !== 'standard' && status === 'active',
    label: stringValue(source.coverageLabel) ?? defaultLabel,
    ...(stringValue(source.coverageSummary) ? { summary: stringValue(source.coverageSummary) } : {}),
    ...(stringValue(source.coverageStartedAt) ? { startedAt: stringValue(source.coverageStartedAt) } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    ...(stringValue(source.coverageEndedAt) ? { endedAt: stringValue(source.coverageEndedAt) } : {}),
    ...(latestUpdate ? { latestUpdate } : {}),
    updates
  };
}

export function coverageModeIsPromotable(coverage: CoverageAuthority) {
  return coverage.active && (coverage.mode === 'breaking' || coverage.mode === 'live');
}
