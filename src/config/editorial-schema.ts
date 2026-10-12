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
