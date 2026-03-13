import type { Episode, TMDBCache } from '../types';
import {
  TMDB_BASE_URL,
  SIMPSONS_SHOW_NAME,
  SIMPSONS_TMDB_ID,
  MAX_SEASONS,
  CACHE_TTL_HOURS,
  getEpisodeKey,
} from '../config';

const cache: TMDBCache = {
  showId: null,
  episodes: new Map(),
  features: new Map(),
  lastFetch: 0,
};

/**
 * Check if cache is still valid based on TTL
 */
function isCacheValid(): boolean {
  if (cache.lastFetch === 0 || cache.episodes.size === 0) {
    return false;
  }
  const ttlMs = CACHE_TTL_HOURS * 60 * 60 * 1000;
  return Date.now() - cache.lastFetch < ttlMs;
}

/**
 * Create a user-friendly error message from TMDB API response
 */
function createErrorMessage(status: number, statusText: string): string {
  if (status === 401 || status === 403) {
    return 'Invalid TMDB API key. Please check your VITE_TMDB_API_KEY environment variable.';
  }
  if (status === 429) {
    return 'TMDB API rate limit exceeded. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return 'TMDB API server error. Please try again later.';
  }
  return `TMDB API error: ${status} ${statusText}`;
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      if (i === retries) {
        const errorMessage = createErrorMessage(response.status, response.statusText);
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (i === retries) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Network error: Failed to connect to TMDB API');
      }
    }
    // Wait before retry (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
  }
  throw new Error('Failed to fetch from TMDB');
}

async function getShowId(): Promise<number> {
  if (cache.showId) {
    return cache.showId;
  }

  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    throw new Error(
      'VITE_TMDB_API_KEY is not set. Please create a .env file with your TMDB API key.'
    );
  }

  // Try using known ID first (faster, avoids search)
  // If that fails, fall back to search
  try {
    const testUrl = `${TMDB_BASE_URL}/tv/${SIMPSONS_TMDB_ID}?api_key=${apiKey}`;
    const testResponse = await fetch(testUrl);
    if (testResponse.ok) {
      cache.showId = SIMPSONS_TMDB_ID;
      return SIMPSONS_TMDB_ID;
    }
  } catch {
    // Fall through to search
  }

  const url = `${TMDB_BASE_URL}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(SIMPSONS_SHOW_NAME)}`;
  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    // Find The Simpsons (should be first result, but check name match)
    const simpsons = data.results.find((show: any) => 
      show.name === SIMPSONS_SHOW_NAME
    ) || data.results[0];
    
    cache.showId = simpsons.id;
    return simpsons.id;
  }

  throw new Error('Could not find The Simpsons on TMDB');
}

async function fetchSeason(showId: number, seasonNumber: number): Promise<Episode[]> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_TMDB_API_KEY is not set');
  }

  const url = `${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${apiKey}`;
  const response = await fetchWithRetry(url);
  const data = await response.json();

  if (!data.episodes || !Array.isArray(data.episodes)) {
    return [];
  }

  return data.episodes.map((ep: any) => ({
    id: ep.id,
    name: ep.name,
    overview: ep.overview || '',
    episode_number: ep.episode_number,
    season_number: seasonNumber,
    air_date: ep.air_date || null,
    vote_average: ep.vote_average || null,
    vote_count: ep.vote_count || null,
    still_path: ep.still_path || null,
  }));
}

export async function getAllEpisodes(): Promise<Episode[]> {
  // If cache is valid, return cached episodes
  if (isCacheValid()) {
    return Array.from(cache.episodes.values());
  }

  // Cache expired or empty, fetch fresh data
  return fetchAllEpisodes();
}

/**
 * Fetch all episodes from TMDB (bypasses cache check)
 */
async function fetchAllEpisodes(): Promise<Episode[]> {
  const showId = await getShowId();
  
  // Fetch all seasons in parallel
  const seasonPromises: Promise<Episode[]>[] = [];
  for (let season = 1; season <= MAX_SEASONS; season++) {
    seasonPromises.push(
      fetchSeason(showId, season).catch(() => []) // Gracefully handle missing seasons
    );
  }

  const seasonResults = await Promise.all(seasonPromises);
  const allEpisodes: Episode[] = [];

  seasonResults.forEach((episodes) => {
    episodes.forEach(episode => {
      const key = getEpisodeKey(episode.season_number, episode.episode_number);
      cache.episodes.set(key, episode);
      allEpisodes.push(episode);
    });
  });

  cache.lastFetch = Date.now();
  return allEpisodes;
}

/**
 * Get episodes, using cache if valid, otherwise fetching fresh data
 * This is the main entry point that App.tsx should use
 */
export async function getEpisodesOrFetch(): Promise<Episode[]> {
  return getAllEpisodes();
}

export function getCachedEpisode(season: number, episode: number): Episode | null {
  const key = getEpisodeKey(season, episode);
  return cache.episodes.get(key) || null;
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  episodeCount: number;
  lastFetch: number;
  isValid: boolean;
} {
  return {
    episodeCount: cache.episodes.size,
    lastFetch: cache.lastFetch,
    isValid: isCacheValid(),
  };
}

export function getAllCachedEpisodes(): Episode[] {
  return Array.from(cache.episodes.values());
}

export function clearCache(): void {
  cache.showId = null;
  cache.episodes.clear();
  cache.features.clear();
  cache.lastFetch = 0;
}


