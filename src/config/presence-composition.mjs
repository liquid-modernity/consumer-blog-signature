import {createPresenceComposition} from '@gaga/arsenal/presence';
export {presenceCapabilityIds,presenceSectionTypes} from '@gaga/arsenal/presence';
export const {presencePath,presenceLink,presenceLabel,presenceSections,createPresenceRegistry}=createPresenceComposition({defaultLocale:'id',fallbackLocale:'en',requiredLocales:['id','en'],discoveryKind:'information'});
