export const gagaBehaviourRegistry = {
  informationSurface: {
    trigger: 'global-navigation',
    mode: 'overlay'
  },
  actionRuntime: {
    placement: 'workspace-full-bleed',
    visibility: 'all-pages-except-landing'
  },
  rails: {
    left: {
      default: 'collapsed',
      expand: ['hover', 'click', 'keyboard']
    },
    right: {
      default: 'collapsed',
      expand: ['hover', 'click', 'keyboard']
    }
  },
  archive: {
    pattern: 'monthly-accordion'
  }
} as const;
