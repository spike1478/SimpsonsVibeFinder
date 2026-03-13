import type { Episode, EpisodeFeatures, ScoredEpisode, QuizAnswers, Filters, ToneBuckets } from '../types';
import { extractFeatures } from './featureExtract';
import { SCORING_WEIGHTS, energyToTones } from './weights';
import { shouldIncludeEpisode } from './filters';

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) {
    return 0;
  }
  
  return dotProduct / denominator;
}

function buildUserToneVector(answers: QuizAnswers): number[] {
  const tones: (keyof ToneBuckets)[] = [
    'cosy',
    'laughOutLoud',
    'cleverSatire',
    'chaotic',
    'wholesome',
    'cynical',
  ];
  
  const vector = new Array(tones.length).fill(0);
  
  // Primary vibe gets highest weight (1.0)
  if (answers.primaryVibe) {
    const primaryIndex = tones.indexOf(answers.primaryVibe);
    if (primaryIndex >= 0) {
      vector[primaryIndex] = 1.0;
    }
  }
  
  // Secondary tones get medium weight (0.5 each)
  answers.secondaryTones.forEach(tone => {
    const index = tones.indexOf(tone);
    if (index >= 0 && vector[index] === 0) {
      vector[index] = 0.5;
    }
  });
  
  // Energy level adds to relevant tones
  if (answers.energyLevel) {
    const energyTones = energyToTones[answers.energyLevel] || [];
    energyTones.forEach(tone => {
      const index = tones.indexOf(tone);
      if (index >= 0) {
        vector[index] = Math.min(vector[index] + 0.3, 1.0);
      }
    });
  }
  
  return vector;
}

function buildEpisodeToneVector(toneBuckets: ToneBuckets): number[] {
  return [
    toneBuckets.cosy,
    toneBuckets.laughOutLoud,
    toneBuckets.cleverSatire,
    toneBuckets.chaotic,
    toneBuckets.wholesome,
    toneBuckets.cynical,
  ];
}

// Filter logic is now in shared filters.ts module

function generateWhyText(
  episode: Episode,
  features: EpisodeFeatures,
  userTones: number[],
  _quizScore: number,
  filters: Filters,
  answers: QuizAnswers
): string {
  const parts: string[] = [];
  
  // Find top matching tones
  const toneNames: (keyof ToneBuckets)[] = [
    'cosy',
    'laughOutLoud',
    'cleverSatire',
    'chaotic',
    'wholesome',
    'cynical',
  ];
  
  const toneMatches: Array<{ name: string; score: number }> = [];
  userTones.forEach((userScore, index) => {
    if (userScore > 0) {
      const episodeScore = buildEpisodeToneVector(features.toneBuckets)[index];
      const matchScore = userScore * episodeScore;
      if (matchScore > 0.1) {
        toneMatches.push({
          name: toneNames[index],
          score: matchScore,
        });
      }
    }
  });
  
  toneMatches.sort((a, b) => b.score - a.score);
  
  // Build tone description
  if (toneMatches.length > 0) {
    const topTones = toneMatches.slice(0, 2).map(m => {
      const toneLabels: Record<string, string> = {
        cosy: 'cosy comfort',
        laughOutLoud: 'laugh-out-loud humor',
        cleverSatire: 'clever satire',
        chaotic: 'chaotic energy',
        wholesome: 'wholesome heartwarming moments',
        cynical: 'cynical dark humor',
      };
      return toneLabels[m.name] || m.name;
    });
    
    parts.push(`This episode matches your preference for ${topTones.join(' and ')}`);
  } else {
    parts.push('This episode aligns with your vibe');
  }
  
  // Halloween note (if included intentionally)
  if (features.isHalloween && answers.includeHalloween) {
    parts.push('You said Halloween episodes are okay, so spooky episodes are in the mix');
  }
  
  // Filter context
  const filterNotes: string[] = [];
  if (filters.excludeClipShows) {
    filterNotes.push('clip shows excluded');
  }
  if (filters.excludeHalloween && !answers.includeHalloween) {
    filterNotes.push('Halloween episodes excluded');
  }
  if (filters.classicOnly) {
    filterNotes.push('from the classic era (Seasons 3-9)');
  }
  
  if (filterNotes.length > 0) {
    parts.push(`(${filterNotes.join(', ')})`);
  }
  
  // Popularity note (if notable)
  if (features.popularityScore > 0.75 && episode.vote_average && episode.vote_average > 8) {
    parts.push(`It's also a fan favorite with a ${episode.vote_average.toFixed(1)}/10 rating`);
  }
  
  return parts.join('. ') + '.';
}

export function scoreEpisodes(
  episodes: Episode[],
  answers: QuizAnswers,
  filters: Filters
): ScoredEpisode[] {
  const userToneVector = buildUserToneVector(answers);
  
  const scored: ScoredEpisode[] = [];
  
  episodes.forEach(episode => {
    const features = extractFeatures(episode);
    
    // Apply filters
    if (!shouldIncludeEpisode(episode, features, filters, {
      includeHalloween: answers.includeHalloween,
    })) {
      return;
    }
    
    // Calculate quiz score
    const episodeToneVector = buildEpisodeToneVector(features.toneBuckets);
    const toneSimilarity = cosineSimilarity(userToneVector, episodeToneVector);
    
    const quizScore =
      toneSimilarity * SCORING_WEIGHTS.quizToneWeight +
      features.popularityScore * SCORING_WEIGHTS.popularityWeight;
    
    const whyText = generateWhyText(
      episode,
      features,
      userToneVector,
      quizScore,
      filters,
      answers
    );
    
    scored.push({
      episode,
      features,
      quizScore,
      finalScore: quizScore,
      whyText,
    });
  });
  
  // Sort by final score descending
  scored.sort((a, b) => b.finalScore - a.finalScore);
  
  // Check if top scores are very close (tie-breaker)
  if (scored.length >= 3) {
    const topScore = scored[0].finalScore;
    const thirdScore = scored[2].finalScore;
    
    if (topScore - thirdScore < SCORING_WEIGHTS.tieBreakerThreshold) {
      // Scores are very close, but we'll skip tie-breaker for now
      // as it would require a reference episode
    }
  }
  
  return scored;
}

export function getTopRecommendations(
  scored: ScoredEpisode[],
  count: number = 3
): ScoredEpisode[] {
  return scored.slice(0, count);
}


