import {createSurfacePlanner} from '@gaga/arsenal/experience';
import { breakpoints } from './systems.ts';
// Relevance is semantic; capacity changes only the projection of available context.
export const surfaceProjectionPolicy = Object.freeze({ minimumRelated: 2, minimumGroups: 2, denseNavigation: 8, minimumRailSpace: breakpoints.desktopMin, railModes:['desktop'], relationFacts:['graph'] });
export const {contextualRailRelevance,resolveSurfacePlan}=createSurfacePlanner(surfaceProjectionPolicy);
