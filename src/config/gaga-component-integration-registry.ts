export const gagaComponentIntegrationRegistry = {
  informationSurface: {
    component: 'GlobalInformationSurface',
    trigger: 'information-action'
  },
  actionRuntime: {
    component: 'WorkspaceActionRuntime',
    placement: 'main-workspace'
  },
  rails: {
    left: 'ContextRail',
    right: 'IntelligenceRail'
  },
  archive: {
    component: 'MonthlyAccordionArchive'
  },
  graph: {
    component: 'SemanticGraphSurface'
  }
} as const;
