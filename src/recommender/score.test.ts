import { describe, it, expect } from 'vitest';
import { scoreEpisodes, getTopRecommendations } from './score';
import type { Episode, QuizAnswers, Filters } from '../types';

describe('score', () => {
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

  it('should score episodes based on quiz answers', () => {
    const episodes: Episode[] = [
      {
        ...baseEpisode,
        name: 'Cosy Family Episode',
        overview: 'A warm and comfortable family story at home',
      },
      {
        ...baseEpisode,
        id: 2,
        name: 'Chaotic Adventure',
        overview: 'A wild and unhinged chaotic adventure',
      },
    ];

    const answers: QuizAnswers = {
      primaryVibe: 'cosy',
      secondaryTones: [],
      energyLevel: 'chill',
      includeHalloween: false,
    };

    const scored = scoreEpisodes(episodes, answers, defaultFilters);
    expect(scored.length).toBe(2);
    expect(scored[0].finalScore).toBeGreaterThanOrEqual(0);
    expect(scored[0].finalScore).toBeLessThanOrEqual(1);
  });

  it('should exclude clip shows when filter is enabled', () => {
    const episodes: Episode[] = [
      {
        ...baseEpisode,
        name: 'So It\'s Come to This: A Simpsons Clip Show',
        overview: 'A clip show',
      },
      {
        ...baseEpisode,
        id: 2,
        name: 'Regular Episode',
        overview: 'A regular episode',
      },
    ];

    const answers: QuizAnswers = {
      primaryVibe: 'cosy',
      secondaryTones: [],
      energyLevel: 'chill',
      includeHalloween: false,
    };

    const filters: Filters = {
      ...defaultFilters,
      excludeClipShows: true,
    };

    const scored = scoreEpisodes(episodes, answers, filters);
    const clipShowIncluded = scored.some(
      s => s.episode.name.includes('Clip Show')
    );
    expect(clipShowIncluded).toBe(false);
  });

  it('should exclude Halloween episodes when filter is enabled', () => {
    const episodes: Episode[] = [
      {
        ...baseEpisode,
        name: 'Treehouse of Horror V',
        overview: 'A Halloween special',
      },
      {
        ...baseEpisode,
        id: 2,
        name: 'Regular Episode',
        overview: 'A regular episode',
      },
    ];

    const answers: QuizAnswers = {
      primaryVibe: 'cosy',
      secondaryTones: [],
      energyLevel: 'chill',
      includeHalloween: false,
    };

    const filters: Filters = {
      ...defaultFilters,
      excludeHalloween: true,
    };

    const scored = scoreEpisodes(episodes, answers, filters);
    const halloweenIncluded = scored.some(
      s => s.episode.name.includes('Treehouse')
    );
    expect(halloweenIncluded).toBe(false);
  });

  it('should include Halloween episodes when user explicitly enables them', () => {
    const episodes: Episode[] = [
      {
        ...baseEpisode,
        name: 'Treehouse of Horror V',
        overview: 'A Halloween special',
      },
    ];

    const answers: QuizAnswers = {
      primaryVibe: 'cosy',
      secondaryTones: [],
      energyLevel: 'chill',
      includeHalloween: true,
    };

    const filters: Filters = {
      ...defaultFilters,
      excludeHalloween: true, // Filter is on, but user enabled Halloween
    };

    const scored = scoreEpisodes(episodes, answers, filters);
    const halloweenIncluded = scored.some(
      s => s.episode.name.includes('Treehouse')
    );
    expect(halloweenIncluded).toBe(true);
  });

  it('should filter by classic-only when enabled', () => {
    const episodes: Episode[] = [
      {
        ...baseEpisode,
        id: 1,
        season_number: 2,
        name: 'Early Episode',
      },
      {
        ...baseEpisode,
        id: 2,
        season_number: 5,
        name: 'Classic Episode',
      },
      {
        ...baseEpisode,
        id: 3,
        season_number: 15,
        name: 'Modern Episode',
      },
    ];

    const answers: QuizAnswers = {
      primaryVibe: 'cosy',
      secondaryTones: [],
      energyLevel: 'chill',
      includeHalloween: false,
    };

    const filters: Filters = {
      ...defaultFilters,
      classicOnly: true,
    };

    const scored = scoreEpisodes(episodes, answers, filters);
    const allClassic = scored.every(
      s => s.episode.season_number >= 3 && s.episode.season_number <= 9
    );
    expect(allClassic).toBe(true);
  });

  it('should generate why text', () => {
    const episodes: Episode[] = [
      {
        ...baseEpisode,
        name: 'Cosy Episode',
        overview: 'A warm and comfortable family story',
      },
    ];

    const answers: QuizAnswers = {
      primaryVibe: 'cosy',
      secondaryTones: [],
      energyLevel: 'chill',
      includeHalloween: false,
    };

    const scored = scoreEpisodes(episodes, answers, defaultFilters);
    expect(scored[0].whyText).toBeTruthy();
    expect(scored[0].whyText.length).toBeGreaterThan(0);
  });

  it('should return top recommendations', () => {
    const episodes: Episode[] = Array.from({ length: 10 }, (_, i) => ({
      ...baseEpisode,
      id: i + 1,
      name: `Episode ${i + 1}`,
    }));

    const answers: QuizAnswers = {
      primaryVibe: 'cosy',
      secondaryTones: [],
      energyLevel: 'chill',
      includeHalloween: false,
    };

    const scored = scoreEpisodes(episodes, answers, defaultFilters);
    const top3 = getTopRecommendations(scored, 3);
    expect(top3.length).toBe(3);
  });

  it('should be deterministic with same inputs', () => {
    const episodes: Episode[] = [
      {
        ...baseEpisode,
        name: 'Test Episode',
        overview: 'A test description',
      },
    ];

    const answers: QuizAnswers = {
      primaryVibe: 'cosy',
      secondaryTones: ['wholesome'],
      energyLevel: 'chill',
      includeHalloween: false,
    };

    const scored1 = scoreEpisodes(episodes, answers, defaultFilters);
    const scored2 = scoreEpisodes(episodes, answers, defaultFilters);

    expect(scored1[0].finalScore).toBe(scored2[0].finalScore);
  });
});


