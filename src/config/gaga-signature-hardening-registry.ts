export const gagaSignatureHardeningRegistry = {
  information: {
    source: 'global-navigation',
    mode: 'surface'
  },
  actionRuntime: {
    enabled: true,
    excludeRoutes: ['/landing'],
    placement: 'workspace'
  },
  desktopRails: {
    left: 'collapsed',
    right: 'collapsed'
  },
  archive: {
    interaction: 'accordion-month'
  },
  graph: {
    surface: 'universal-bootstrap'
  },
  interaction: {
    tooltip: true,
    hoverLabel: true,
    pointerFeedback: true
  }
} as const;
