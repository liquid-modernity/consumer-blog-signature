export const gagaActionRegistry = {
  smartBack: {
    id: 'smart-back',
    shortcut: 'Alt+ArrowLeft',
    contexts: ['article', 'topic', 'library']
  },
  smartShare: {
    id: 'smart-share',
    shortcut: 'Ctrl+Shift+S',
    contexts: ['*']
  },
  focusMode: {
    id: 'focus-mode',
    contexts: ['article']
  },
  highlight: {
    id: 'highlight',
    contexts: ['article']
  },
  speak: {
    id: 'speak',
    contexts: ['article']
  }
} as const;
