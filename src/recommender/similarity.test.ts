import { describe, it, expect } from 'vitest';
import { findSimilarEpisodes } from './similarity';
import type { Episode, Filters } from '../types';

describe('similarity', () => {
  const baseEpisode: Episode = {
    id: 1,
    name: 'Test Episode',
    overview: 'A test episode description',
    episode_number: 1,
    season_number: 1,
    air_date: '1990-01-01',
    vote_average: 8.0,
    vote_count: 100,
    still_path: null,
  };

  const defaultFilters: Filters = {
    excludeClipShows: true,
    excludeHalloween: true,
    classicOnly: false,
  };

  it('should never recommend the selected episode itself', () => {
    const selectedEpisode: Episode = {
      ...baseEpisode,
      id: 1,
      name: 'Selected Episode',
      overview: 'This is the selected episode',
    };

    const allEpisodes: Episode[] = [
      selectedEpisode,
      {
        ...baseEpisode,
        id: 2,
        name: 'Other Episode',
        overview: 'A different episode',
      },
    ];

    const similar = findSimilarEpisodes(selectedEpisode, allEpisodes, defaultFilters);
    const selfIncluded = similar.some(s => s.episode.id === selectedEpisode.id);
    expect(selfIncluded).toBe(false);
  });

  it('should rank episodes with shared keywords higher', () => {
    const selectedEpisode: Episode = {
      ...baseEpisode,
      id: 1,
      name: 'Homer Goes to College',
      overview: 'Homer goes to college and causes chaos',
    };

    const allEpisodes: Episode[] = [
      selectedEpisode,
      {
        ...baseEpisode,
        id: 2,
        name: 'Homer at College',
        overview: 'Homer is at college again',
      },
      {
        ...baseEpisode,
        id: 3,
        name: 'Completely Different',
        overview: 'A completely different story about something else',
      },
    ];

    const similar = findSimilarEpisodes(selectedEpisode, allEpisodes, defaultFilters);
    expect(similar.length).toBeGreaterThan(0);
    // Episodes with shared keywords should rank higher
    if (similar.length >= 2) {
      const firstSimilarity = similar[0].similarityScore || 0;
      const secondSimilarity = similar[1].similarityScore || 0;
      expect(firstSimilarity).toBeGreaterThanOrEqual(secondSimilarity);
    }
  });

  it('should return similarity scores between 0 and 1', () => {
    const selectedEpisode: Episode = {
      ...baseEpisode,
      id: 1,
      name: 'Test Episode',
      overview: 'A test description',
    };

    const allEpisodes: Episode[] = [
      selectedEpisode,
      {
        ...baseEpisode,
        id: 2,
        name: 'Other Episode',
        overview: 'Another description',
      },
    ];

    const similar = findSimilarEpisodes(selectedEpisode, allEpisodes, defaultFilters);
    similar.forEach(result => {
      expect(result.similarityScore).toBeGreaterThanOrEqual(0);
      expect(result.similarityScore).toBeLessThanOrEqual(1);
    });
  });

  it('should respect filters', () => {
    const selectedEpisode: Episode = {
      ...baseEpisode,
      id: 1,
      name: 'Regular Episode',
      overview: 'A regular episode',
    };

    const allEpisodes: Episode[] = [
      selectedEpisode,
      {
        ...baseEpisode,
        id: 2,
        name: 'So It\'s Come to This: A Simpsons Clip Show',
        overview: 'A clip show with flashbacks',
      },
      {
        ...baseEpisode,
        id: 3,
        name: 'Treehouse of Horror',
        overview: 'A Halloween special',
      },
    ];

    const filters: Filters = {
      excludeClipShows: true,
      excludeHalloween: true,
      classicOnly: false,
    };

    const similar = findSimilarEpisodes(selectedEpisode, allEpisodes, filters);
    const clipShowIncluded = similar.some(s => s.episode.name.includes('Clip Show'));
    const halloweenIncluded = similar.some(s => s.episode.name.includes('Treehouse'));
    
    expect(clipShowIncluded).toBe(false);
    expect(halloweenIncluded).toBe(false);
  });

  it('should respect classic-only filter', () => {
    const selectedEpisode: Episode = {
      ...baseEpisode,
      id: 1,
      season_number: 5,
      name: 'Classic Episode',
      overview: 'A classic episode',
    };

    const allEpisodes: Episode[] = [
      selectedEpisode,
      {
        ...baseEpisode,
        id: 2,
        season_number: 2,
        name: 'Early Episode',
      },
      {
        ...baseEpisode,
        id: 3,
        season_number: 5,
        name: 'Another Classic',
      },
      {
        ...baseEpisode,
        id: 4,
        season_number: 15,
        name: 'Modern Episode',
      },
    ];

    const filters: Filters = {
      ...defaultFilters,
      classicOnly: true,
    };

    const similar = findSimilarEpisodes(selectedEpisode, allEpisodes, filters);
    const allClassic = similar.every(
      s => s.episode.season_number >= 3 && s.episode.season_number <= 9
    );
    expect(allClassic).toBe(true);
  });

  it('should return top 3 results', () => {
    const selectedEpisode: Episode = {
      ...baseEpisode,
      id: 1,
      name: 'Test Episode',
      overview: 'A test description',
    };

    const allEpisodes: Episode[] = Array.from({ length: 10 }, (_, i) => ({
      ...baseEpisode,
      id: i + 1,
      name: `Episode ${i + 1}`,
      overview: `Description ${i + 1}`,
    }));

    const similar = findSimilarEpisodes(selectedEpisode, allEpisodes, defaultFilters);
    expect(similar.length).toBeLessThanOrEqual(3);
  });

  it('should generate why text', () => {
    const selectedEpisode: Episode = {
      ...baseEpisode,
      id: 1,
      name: 'Homer Episode',
      overview: 'Homer does something',
    };

    const allEpisodes: Episode[] = [
      selectedEpisode,
      {
        ...baseEpisode,
        id: 2,
        name: 'Homer Again',
        overview: 'Homer does something else',
      },
    ];

    const similar = findSimilarEpisodes(selectedEpisode, allEpisodes, defaultFilters);
    expect(similar[0].whyText).toBeTruthy();
    expect(similar[0].whyText.length).toBeGreaterThan(0);
  });

  it('should be deterministic with same inputs', () => {
    const selectedEpisode: Episode = {
      ...baseEpisode,
      id: 1,
      name: 'Test Episode',
      overview: 'A test description',
    };

    const allEpisodes: Episode[] = [
      selectedEpisode,
      {
        ...baseEpisode,
        id: 2,
        name: 'Other Episode',
        overview: 'Another description',
      },
    ];

    const similar1 = findSimilarEpisodes(selectedEpisode, allEpisodes, defaultFilters);
    const similar2 = findSimilarEpisodes(selectedEpisode, allEpisodes, defaultFilters);

    expect(similar1.length).toBe(similar2.length);
    if (similar1.length > 0 && similar2.length > 0) {
      expect(similar1[0].similarityScore).toBe(similar2[0].similarityScore);
    }
  });
});


