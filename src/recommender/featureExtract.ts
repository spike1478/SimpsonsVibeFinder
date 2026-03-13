import type { Episode, EpisodeFeatures, ToneBuckets } from '../types';
import {
  toneKeywords,
  knownClipShowTitles,
  clipShowKeywords,
  halloweenPatterns,
  christmasKeywords,
} from './weights';

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction: split by non-word characters, filter out short words
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 2);
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'a',
    'an', 'his', 'her', 'its', 'their', 'our', 'your', 'my', 'me', 'him',
    'she', 'we', 'they', 'them', 'us', 'it', 'he', 'i', 'you'
  ]);
  
  return words.filter(word => !stopWords.has(word));
}

function detectHalloween(episode: Episode): boolean {
  const title = normalizeText(episode.name);
  const overview = normalizeText(episode.overview);
  const combined = `${title} ${overview}`;
  
  return halloweenPatterns.some(pattern => combined.includes(pattern));
}

function detectClipShow(episode: Episode): boolean {
  const title = normalizeText(episode.name);
  const overview = normalizeText(episode.overview);
  
  // Check against known clip show titles
  if (knownClipShowTitles.some(known => title.includes(known))) {
    return true;
  }
  
  // Check for clip show keywords in overview
  return clipShowKeywords.some(keyword => overview.includes(keyword));
}

function detectChristmas(episode: Episode): boolean {
  const title = normalizeText(episode.name);
  const overview = normalizeText(episode.overview);
  const combined = `${title} ${overview}`;
  
  return christmasKeywords.some(keyword => combined.includes(keyword));
}

function calculateToneBuckets(episode: Episode): ToneBuckets {
  const title = normalizeText(episode.name);
  const overview = normalizeText(episode.overview);
  const combined = `${title} ${overview}`;
  
  const buckets: ToneBuckets = {
    cosy: 0,
    laughOutLoud: 0,
    cleverSatire: 0,
    chaotic: 0,
    wholesome: 0,
    cynical: 0,
  };
  
  // Count keyword matches for each tone
  Object.entries(toneKeywords).forEach(([tone, keywords]) => {
    const matches = keywords.filter(keyword => combined.includes(keyword)).length;
    // Normalize to 0-1 range (divide by max possible matches, capped at 1)
    buckets[tone as keyof ToneBuckets] = Math.min(matches / 5, 1);
  });
  
  return buckets;
}

function calculatePopularityScore(episode: Episode): number {
  // If no vote data, return 0.5 (neutral)
  if (!episode.vote_average || !episode.vote_count) {
    return 0.5;
  }
  
  // Normalize vote_average (0-10 scale) to 0-1
  const normalizedRating = episode.vote_average / 10;
  
  // Boost based on vote count (more votes = more reliable)
  // Log scale to prevent huge vote counts from dominating
  const voteBoost = Math.min(Math.log10(episode.vote_count + 1) / 3, 1);
  
  // Combine: 70% rating, 30% vote count boost
  return normalizedRating * 0.7 + voteBoost * 0.3;
}

export function extractFeatures(episode: Episode): EpisodeFeatures {
  const keywords = extractKeywords(`${episode.name} ${episode.overview}`);
  
  return {
    episode,
    isHalloween: detectHalloween(episode),
    isClipShow: detectClipShow(episode),
    isChristmas: detectChristmas(episode),
    toneBuckets: calculateToneBuckets(episode),
    popularityScore: calculatePopularityScore(episode),
    keywords,
  };
}


