import { experienceSurfaceProfile, type ExperienceContext } from './experience';

export function gagaDockActionIds(context: ExperienceContext) {
  return experienceSurfaceProfile(context).dockActionIds;
}
