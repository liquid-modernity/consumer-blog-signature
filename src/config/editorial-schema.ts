export const editorialRoleValues = ['lead', 'major', 'standard', 'brief'] as const;
export type EditorialRole = typeof editorialRoleValues[number];

export const storyFormatValues = [
  'standard',
  'analysis',
  'explainer',
  'brief',
  'opinion',
  'interview',
  'review',
  'live'
] as const;
export type StoryFormat = typeof storyFormatValues[number];

export const editorialPriorityMin = 0;
export const editorialPriorityMax = 100;

export const coverageModeValues = ['standard', 'breaking', 'live'] as const;
export type CoverageMode = typeof coverageModeValues[number];

export const coverageStatusValues = ['inactive', 'active', 'paused', 'ended'] as const;
export type CoverageStatus = typeof coverageStatusValues[number];
