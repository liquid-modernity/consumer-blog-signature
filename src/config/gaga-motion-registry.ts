export const gagaMotionRegistry = {
  instant: {
    duration: 100,
    intent: 'feedback'
  },
  subtle: {
    duration: 180,
    intent: 'transition'
  },
  immersive: {
    duration: 360,
    intent: 'focus'
  },
  reduced: {
    duration: 0,
    intent: 'accessibility'
  }
} as const;
