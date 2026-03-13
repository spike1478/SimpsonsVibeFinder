import React, { useState, useEffect } from 'react';
import { Tabs } from './components/Tabs';
import { Filters } from './components/Filters';
import { Quiz } from './components/Quiz';
import { EpisodeSearch } from './components/EpisodeSearch';
import { Results } from './components/Results';
import { PlexSettings } from './components/PlexSettings';
import { SimpsonsLogo } from './components/SimpsonsLogo';
import { getEpisodesOrFetch } from './api/tmdb';
import { scoreEpisodes, getTopRecommendations } from './recommender/score';
import { findSimilarEpisodes } from './recommender/similarity';
import { extractFeatures } from './recommender/featureExtract';
import { shouldIncludeEpisode } from './recommender/filters';
import type { Episode, QuizAnswers, Filters as FiltersType, ScoredEpisode } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'similar'>('quiz');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersType>({
    excludeClipShows: true,
    excludeHalloween: true,
    classicOnly: false,
  });
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    primaryVibe: null,
    secondaryTones: [],
    energyLevel: null,
    includeHalloween: false,
  });
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [results, setResults] = useState<ScoredEpisode[]>([]);
  const [plexBaseUrl, setPlexBaseUrl] = useState('https://app.plex.tv/desktop');
  const [plexAuthToken, setPlexAuthToken] = useState('');

  useEffect(() => {
    async function loadEpisodes() {
      try {
        setLoading(true);
        setError(null);
        const allEpisodes = await getEpisodesOrFetch();
        setEpisodes(allEpisodes);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load episodes';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    loadEpisodes();
  }, []);

  const handleQuizSubmit = () => {
    if (episodes.length === 0) return;

    const scored = scoreEpisodes(episodes, quizAnswers, filters);
    const top3 = getTopRecommendations(scored, 3);
    setResults(top3);
  };

  const handleSimilarSubmit = () => {
    if (!selectedEpisode || episodes.length === 0) return;

    const similar = findSimilarEpisodes(selectedEpisode, episodes, filters);
    setResults(similar);
  };

  const handleSurpriseMe = () => {
    if (episodes.length === 0) return;

    // Use proper feature extraction and filter logic
    const filtered = episodes.filter(episode => {
      const features = extractFeatures(episode);
      return shouldIncludeEpisode(episode, features, filters);
    });

    if (filtered.length === 0) {
      // Show empty state message instead of clearing
      const emptyResult: ScoredEpisode = {
        episode: {
          id: -1,
          name: '',
          overview: '',
          episode_number: 0,
          season_number: 0,
          air_date: null,
          vote_average: null,
          vote_count: null,
          still_path: null,
        },
        features: {
          episode: {
            id: -1,
            name: '',
            overview: '',
            episode_number: 0,
            season_number: 0,
            air_date: null,
            vote_average: null,
            vote_count: null,
            still_path: null,
          },
          isHalloween: false,
          isClipShow: false,
          isChristmas: false,
          toneBuckets: {
            cosy: 0,
            laughOutLoud: 0,
            cleverSatire: 0,
            chaotic: 0,
            wholesome: 0,
            cynical: 0,
          },
          popularityScore: 0,
          keywords: [],
        },
        quizScore: 0,
        finalScore: 0,
        whyText: '',
      };
      setResults([emptyResult]);
      return;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    const randomEpisode = filtered[randomIndex];
    const features = extractFeatures(randomEpisode);

    // Create a simple scored episode for the surprise result
    const surpriseResult: ScoredEpisode = {
      episode: randomEpisode,
      features,
      quizScore: 0,
      finalScore: 0,
      whyText: 'A random episode selected just for you!',
    };

    setResults([surpriseResult]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <SimpsonsLogo />
          <h1>Vibe Finder</h1>
        </div>
        <p className="subtitle">Find your perfect Simpsons episode</p>
      </header>

      <main className="app-main">
        <Tabs 
          activeTab={activeTab} 
          onTabChange={(newTab) => {
            setActiveTab(newTab);
            // Move focus to the active panel heading for screen readers after tab change
            setTimeout(() => {
              const panelId = newTab === 'quiz' ? 'quiz-panel' : 'similar-panel';
              const panel = document.getElementById(panelId);
              const heading = panel?.querySelector('h2');
              if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus();
              }
            }, 100);
          }}
        />

        <Filters filters={filters} onFiltersChange={setFilters} />

        {loading && (
          <div className="loading" role="status" aria-live="polite">
            <p>Loading episodes...</p>
          </div>
        )}

        {error && (
          <div className="error" role="alert">
            <p>{error}</p>
            <p className="error-detail">
              Unable to load episodes. Please check your API key and try again.
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div
              id="quiz-panel"
              role="tabpanel"
              aria-labelledby="quiz-tab"
              hidden={activeTab !== 'quiz'}
            >
              <Quiz
                answers={quizAnswers}
                onAnswersChange={setQuizAnswers}
                onSubmit={handleQuizSubmit}
              />
            </div>

            <div
              id="similar-panel"
              role="tabpanel"
              aria-labelledby="similar-tab"
              hidden={activeTab !== 'similar'}
            >
              <EpisodeSearch
                episodes={episodes}
                onEpisodeSelect={setSelectedEpisode}
                onSubmit={handleSimilarSubmit}
              />
              {selectedEpisode && (
                <p className="selected-episode-info" role="status">
                  Selected: <strong>{selectedEpisode.name}</strong> (S{selectedEpisode.season_number} E{selectedEpisode.episode_number})
                </p>
              )}
            </div>

            <div className="surprise-section">
              <button
                type="button"
                onClick={handleSurpriseMe}
                className="surprise-button"
                disabled={episodes.length === 0}
                aria-label="Get a random episode recommendation"
              >
                Surprise Me
              </button>
            </div>

            {results.length > 0 && (
              <Results 
                results={results} 
                plexBaseUrl={plexBaseUrl || undefined}
                plexAuthToken={plexAuthToken || undefined}
              />
            )}

            <PlexSettings
              plexBaseUrl={plexBaseUrl}
              plexAuthToken={plexAuthToken}
              onPlexUrlChange={setPlexBaseUrl}
              onPlexAuthTokenChange={setPlexAuthToken}
            />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by TMDB API</p>
      </footer>
    </div>
  );
}

export default App;

