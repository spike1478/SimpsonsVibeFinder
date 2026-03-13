import type { Episode, ScoredEpisode } from '../types';
import { extractFeatures } from './featureExtract';
import type { Filters } from '../types';
import { shouldIncludeEpisode } from './filters';

interface TFIDFVector {
  [term: string]: number;
}

interface CorpusStats {
  termDocumentFrequency: Map<string, number>;
  totalDocuments: number;
}

function buildCorpus(episodes: Episode[]): CorpusStats {
  const termDocumentFrequency = new Map<string, number>();
  const totalDocuments = episodes.length;
  
  episodes.forEach(episode => {
    const features = extractFeatures(episode);
    const uniqueTerms = new Set(features.keywords);
    uniqueTerms.forEach(term => {
      termDocumentFrequency.set(
        term,
        (termDocumentFrequency.get(term) || 0) + 1
      );
    });
  });
  
  return { termDocumentFrequency, totalDocuments };
}

function computeTFIDFVector(
  episode: Episode,
  corpus: CorpusStats
): TFIDFVector {
  const features = extractFeatures(episode);
  const termFrequency: Map<string, number> = new Map();
  const totalTerms = features.keywords.length;
  
  // Count term frequency
  features.keywords.forEach(term => {
    termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
  });
  
  // Compute TF-IDF
  const vector: TFIDFVector = {};
  termFrequency.forEach((count, term) => {
    const tf = count / totalTerms;
    const df = corpus.termDocumentFrequency.get(term) || 1;
    const idf = Math.log(corpus.totalDocuments / df);
    vector[term] = tf * idf;
  });
  
  return vector;
}

function cosineSimilarity(vec1: TFIDFVector, vec2: TFIDFVector): number {
  const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  allTerms.forEach(term => {
    const val1 = vec1[term] || 0;
    const val2 = vec2[term] || 0;
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  });
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) {
    return 0;
  }
  
  return dotProduct / denominator;
}

// Filter logic is now in shared filters.ts module

function generateWhyText(
  _selectedEpisode: Episode,
  _similarEpisode: Episode,
  _similarityScore: number,
  sharedKeywords: string[],
  filters: Filters
): string {
  const parts: string[] = [];
  
  // Similarity keywords - prioritize character/location names
  if (sharedKeywords.length > 0) {
    const keywordText = sharedKeywords.slice(0, 3).join(', ');
    // Capitalize first letter of each keyword for readability
    const formattedKeywords = keywordText.split(', ').map(k => 
      k.charAt(0).toUpperCase() + k.slice(1)
    ).join(', ');
    parts.push(`both feature ${formattedKeywords}`);
  } else {
    parts.push('they share similar themes and story elements');
  }
  
  // Filter context
  const filterNotes: string[] = [];
  if (filters.excludeClipShows) {
    filterNotes.push('clip shows excluded');
  }
  if (filters.excludeHalloween) {
    filterNotes.push('Halloween episodes excluded');
  }
  if (filters.classicOnly) {
    parts.push('limited to classic era (Seasons 3-9)');
  }
  
  if (filterNotes.length > 0) {
    parts.push(`(${filterNotes.join(', ')})`);
  }
  
  return `This episode is similar because ${parts.join('. ')}.`;
}

// Character names and locations that should be prioritized in explanations
const PRIORITY_KEYWORDS = new Set([
  'homer', 'marge', 'bart', 'lisa', 'maggie',
  'springfield', 'nuclear', 'school', 'power plant',
  'krusty', 'burns', 'smithers', 'flanders', 'moe',
  'barney', 'milhouse', 'nelson', 'ralph', 'skinner'
]);

function getSharedKeywords(
  vec1: TFIDFVector,
  vec2: TFIDFVector,
  topN: number = 5
): string[] {
  const sharedTerms = Object.keys(vec1).filter(term => vec2[term]);
  
  const scored = sharedTerms
    .map(term => ({
      term,
      score: (vec1[term] || 0) * (vec2[term] || 0),
      isPriority: PRIORITY_KEYWORDS.has(term.toLowerCase()),
    }))
    .sort((a, b) => {
      // Prioritize character/location names, then by score
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return b.score - a.score;
    })
    .slice(0, topN)
    .map(item => item.term);
  
  return scored;
}

export function findSimilarEpisodes(
  selectedEpisode: Episode,
  allEpisodes: Episode[],
  filters: Filters
): ScoredEpisode[] {
  // Build corpus from all episodes
  const corpus = buildCorpus(allEpisodes);
  
  // Compute TF-IDF vector for selected episode
  const selectedVector = computeTFIDFVector(selectedEpisode, corpus);
  
  // Compute similarity for all other episodes
  const scored: ScoredEpisode[] = [];
  
  allEpisodes.forEach(episode => {
    // Exclude the selected episode itself
    if (episode.id === selectedEpisode.id) {
      return;
    }
    
    const features = extractFeatures(episode);
    
    // Apply filters
    if (!shouldIncludeEpisode(episode, features, filters)) {
      return;
    }
    
    // Compute similarity
    const episodeVector = computeTFIDFVector(episode, corpus);
    const similarity = cosineSimilarity(selectedVector, episodeVector);
    
    // Get shared keywords for why text
    const sharedKeywords = getSharedKeywords(selectedVector, episodeVector);
    
    const whyText = generateWhyText(
      selectedEpisode,
      episode,
      similarity,
      sharedKeywords,
      filters
    );
    
    scored.push({
      episode,
      features,
      quizScore: 0, // Not used in similarity mode
      similarityScore: similarity,
      finalScore: similarity,
      whyText,
    });
  });
  
  // Sort by similarity score descending
  scored.sort((a, b) => b.finalScore - a.finalScore);
  
  // Return top 3
  return scored.slice(0, 3);
}


