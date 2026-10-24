export {
  classifySiteUrl,
  isCurrentSiteSection,
  isSameSitePath,
  normalizeSitePath,
  shouldOpenExternalNavigation,
  sitePathFromHref
} from '@gaga/engine-capabilities/url';

export type {
  SiteUrlClassification as GagaUrlClassification,
  SiteUrlSemantics as GagaUrlSemantics
} from '@gaga/engine-capabilities/url';
