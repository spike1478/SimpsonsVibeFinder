import { describe, it, expect } from 'vitest';
import { extractFeatures } from './featureExtract';
import type { Episode } from '../types';

describe('featureExtract', () => {
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

  it('should detect Halloween episodes', () => {
    const halloweenEpisode: Episode = {
      ...baseEpisode,
      name: 'Treehouse of Horror V',
      overview: 'A spooky Halloween special',
    };

    const features = extractFeatures(halloweenEpisode);
    expect(features.isHalloween).toBe(true);
  });

  it('should not detect non-Halloween episodes as Halloween', () => {
    const regularEpisode: Episode = {
      ...baseEpisode,
      name: 'Bart Gets an F',
      overview: 'Bart struggles with school',
    };

    const features = extractFeatures(regularEpisode);
    expect(features.isHalloween).toBe(false);
  });

  it('should detect clip shows by known title', () => {
    const clipShow: Episode = {
      ...baseEpisode,
      name: 'So It\'s Come to This: A Simpsons Clip Show',
      overview: 'A collection of clips',
    };

    const features = extractFeatures(clipShow);
    expect(features.isClipShow).toBe(true);
  });

  it('should detect clip shows by overview keywords', () => {
    const clipShow: Episode = {
      ...baseEpisode,
      name: 'Some Episode',
      overview: 'The family looks back at flashback moments from past episodes',
    };

    const features = extractFeatures(clipShow);
    expect(features.isClipShow).toBe(true);
  });

  it('should not detect regular episodes as clip shows', () => {
    const regularEpisode: Episode = {
      ...baseEpisode,
      name: 'Marge vs. the Monorail',
      overview: 'Springfield gets a monorail',
    };

    const features = extractFeatures(regularEpisode);
    expect(features.isClipShow).toBe(false);
  });

  it('should extract tone buckets', () => {
    const episode: Episode = {
      ...baseEpisode,
      name: 'Funny Comedy Episode',
      overview: 'A hilarious and chaotic story with clever satire',
    };

    const features = extractFeatures(episode);
    expect(features.toneBuckets.laughOutLoud).toBeGreaterThan(0);
    expect(features.toneBuckets.chaotic).toBeGreaterThan(0);
    expect(features.toneBuckets.cleverSatire).toBeGreaterThan(0);
  });

  it('should calculate popularity score from vote data', () => {
    const popularEpisode: Episode = {
      ...baseEpisode,
      vote_average: 9.0,
      vote_count: 1000,
    };

    const features = extractFeatures(popularEpisode);
    expect(features.popularityScore).toBeGreaterThan(0.5);
    expect(features.popularityScore).toBeLessThanOrEqual(1.0);
  });

  it('should return neutral popularity score when vote data is missing', () => {
    const episode: Episode = {
      ...baseEpisode,
      vote_average: null,
      vote_count: null,
    };

    const features = extractFeatures(episode);
    expect(features.popularityScore).toBe(0.5);
  });

  it('should extract keywords from title and overview', () => {
    const episode: Episode = {
      ...baseEpisode,
      name: 'Homer Goes to College',
      overview: 'Homer goes to college and causes chaos',
    };

    const features = extractFeatures(episode);
    expect(features.keywords.length).toBeGreaterThan(0);
    expect(features.keywords).toContain('homer');
    expect(features.keywords).toContain('college');
  });

  it('should handle missing overview gracefully', () => {
    const episode: Episode = {
      ...baseEpisode,
      overview: '',
    };

    const features = extractFeatures(episode);
    expect(features).toBeDefined();
    expect(features.keywords.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect Christmas episodes', () => {
    const christmasEpisode: Episode = {
      ...baseEpisode,
      name: 'Simpsons Roasting on an Open Fire',
      overview: 'A Christmas holiday special with Santa and presents',
    };

    const features = extractFeatures(christmasEpisode);
    expect(features.isChristmas).toBe(true);
  });

  it('should not detect non-Christmas episodes as Christmas', () => {
    const regularEpisode: Episode = {
      ...baseEpisode,
      name: 'Bart Gets an F',
      overview: 'Bart struggles with school',
    };

    const features = extractFeatures(regularEpisode);
    expect(features.isChristmas).toBe(false);
  });
});


