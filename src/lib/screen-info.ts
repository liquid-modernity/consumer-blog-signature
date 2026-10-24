import { sanitizeOutlineItems, type CanonicalContentMetadata, type ContentDateLocaleConfig } from '@gaga/engine-capabilities/content';
import { getPageContext, type PageContext, type PageContextTocItem } from './page-context';
import type { AuthorRecord, ConsumerArticleRecord, TagGroup, TopicGroup } from './content';

export { sanitizeOutlineItems };
export type ScreenInfo = PageContext;
export type ScreenKind = PageContext['kind'];
export type ScreenTocItem = PageContextTocItem;

export type ScreenInfoInput = {
  pathname: string;
  data: CanonicalContentMetadata;
  language?: string;
  defaults: {
    defaultAuthor: string;
    dateLocale: ContentDateLocaleConfig;
  };
  tocItems?: PageContextTocItem[];
  articles?: ConsumerArticleRecord[];
  authors?: AuthorRecord[];
  topicGroups?: TopicGroup[];
  tagGroups?: TagGroup[];
};

export function getScreenInfo(input: ScreenInfoInput): ScreenInfo {
  const { defaults, data, ...rest } = input;
  return getPageContext({
    ...rest,
    metadata: data,
    defaultAuthor: defaults.defaultAuthor,
    dateLocale: defaults.dateLocale
  });
}
