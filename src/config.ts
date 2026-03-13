/**
 * Application-wide constants and configuration
 */

// TMDB API Configuration
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const SIMPSONS_SHOW_NAME = 'The Simpsons';
export const SIMPSONS_TMDB_ID = 456; // Known TMDB ID for The Simpsons

// Season Configuration
export const MAX_SEASONS = Number.parseInt(
  import.meta.env.VITE_MAX_SEASONS || '35',
  10
);
export const CLASSIC_ERA_MIN_SEASON = 3;
export const CLASSIC_ERA_MAX_SEASON = 9;

// Episode Search Configuration
export const SEARCH_RESULTS_LIMIT = 10;
export const MIN_SEARCH_LENGTH = 3;

// Recommendation Configuration
export const DEFAULT_RECOMMENDATION_COUNT = 3;

// Cache Configuration
export const CACHE_TTL_HOURS = 24; // Cache episodes for 24 hours

// TMDB URL Helpers
export function getTMDBShowUrl(showId: number = SIMPSONS_TMDB_ID): string {
  return `https://www.themoviedb.org/tv/${showId}-the-simpsons`;
}

export function getTMDBEpisodeUrl(
  season: number,
  episode: number,
  showId: number = SIMPSONS_TMDB_ID
): string {
  return `${getTMDBShowUrl(showId)}/season/${season}/episode/${episode}`;
}

// Episode Key Helper
export function getEpisodeKey(season: number, episode: number): string {
  return `S${season}E${episode}`;
}
