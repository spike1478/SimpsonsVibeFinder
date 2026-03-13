import type { Episode, EpisodeFeatures, Filters } from '../types';
import { CLASSIC_ERA_MIN_SEASON, CLASSIC_ERA_MAX_SEASON } from '../config';

export interface FilterOptions {
  includeHalloween?: boolean; // Override for Halloween when user explicitly enables it
}

/**
 * Shared filter logic for determining if an episode should be included
 * based on filters and optional quiz answers.
 * 
 * This ensures consistency between quiz mode and similarity mode.
 */
export function shouldIncludeEpisode(
  episode: Episode,
  features: EpisodeFeatures,
  filters: Filters,
  options?: FilterOptions
): boolean {
  // Exclude clip shows if filter is enabled
  if (filters.excludeClipShows && features.isClipShow) {
    return false;
  }
  
  // Halloween filter: exclude unless user explicitly enabled it (via options)
  if (filters.excludeHalloween && features.isHalloween) {
    if (!options?.includeHalloween) {
      return false;
    }
  }
  
  // Classic era filter
  if (filters.classicOnly) {
    if (episode.season_number < CLASSIC_ERA_MIN_SEASON || 
        episode.season_number > CLASSIC_ERA_MAX_SEASON) {
      return false;
    }
  }
  
  return true;
}
