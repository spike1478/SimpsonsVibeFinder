export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  vote_average: number | null;
  vote_count: number | null;
  still_path: string | null;
}

export interface ToneBuckets {
  cosy: number;
  laughOutLoud: number;
  cleverSatire: number;
  chaotic: number;
  wholesome: number;
  cynical: number;
}

export interface EpisodeFeatures {
  episode: Episode;
  isHalloween: boolean;
  isClipShow: boolean;
  isChristmas: boolean;
  toneBuckets: ToneBuckets;
  popularityScore: number;
  keywords: string[];
}

export interface ScoredEpisode {
  episode: Episode;
  features: EpisodeFeatures;
  quizScore: number;
  similarityScore?: number;
  finalScore: number;
  whyText: string;
}

export interface TMDBCache {
  showId: number | null;
  episodes: Map<string, Episode>;
  features: Map<string, EpisodeFeatures>;
  lastFetch: number;
}

export interface QuizAnswers {
  primaryVibe: keyof ToneBuckets | null;
  secondaryTones: (keyof ToneBuckets)[];
  energyLevel: 'chill' | 'medium' | 'high' | null;
  includeHalloween: boolean;
}

export interface Filters {
  excludeClipShows: boolean;
  excludeHalloween: boolean;
  classicOnly: boolean;
}


