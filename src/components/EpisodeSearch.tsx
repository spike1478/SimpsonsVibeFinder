import React, { useState, useRef, useEffect } from 'react';
import type { Episode } from '../types';
import { MIN_SEARCH_LENGTH } from '../config';

interface EpisodeSearchProps {
  episodes: Episode[];
  onEpisodeSelect: (episode: Episode) => void;
  onSubmit: () => void;
}

export const EpisodeSearch: React.FC<EpisodeSearchProps> = ({
  episodes,
  onEpisodeSelect,
  onSubmit,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const filteredEpisodes = episodes.filter(episode => {
    if (query.length < MIN_SEARCH_LENGTH) {
      return false;
    }
    // Normalize: trim and case-insensitive
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedName = episode.name.trim().toLowerCase();
    return normalizedName.includes(normalizedQuery);
  }).slice(0, 10); // Limit to 10 results

  useEffect(() => {
    setShowResults(query.length > 0 && filteredEpisodes.length > 0);
    setSelectedIndex(-1);
  }, [query, filteredEpisodes.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSelect = (episode: Episode) => {
    setQuery(episode.name);
    setShowResults(false);
    onEpisodeSelect(episode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || filteredEpisodes.length === 0) {
      if (e.key === 'Enter' && query) {
        // Try to find exact match
        const exactMatch = episodes.find(
          ep => ep.name.toLowerCase() === query.toLowerCase()
        );
        if (exactMatch) {
          handleSelect(exactMatch);
          onSubmit();
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredEpisodes.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredEpisodes.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredEpisodes.length) {
          handleSelect(filteredEpisodes[selectedIndex]);
          onSubmit();
        }
        break;
      case 'Escape':
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="episode-search-container" role="region" aria-labelledby="search-heading">
      <h2 id="search-heading">More Like This</h2>
      <div className="search-wrapper">
        <label htmlFor="episode-search-input" className="visually-hidden">
          Search for an episode
        </label>
        <input
          id="episode-search-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length > 0 && filteredEpisodes.length > 0) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            // Delay to allow click events to fire
            setTimeout(() => setShowResults(false), 200);
          }}
          placeholder="Type episode title..."
          className="search-input"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls="episode-search-results"
          aria-activedescendant={
            selectedIndex >= 0
              ? `episode-result-${selectedIndex}`
              : undefined
          }
        />
        {showResults && (
          <div
            id="episode-search-results"
            ref={resultsRef}
            className="search-results"
            role="listbox"
            aria-label="Episode search results"
          >
            {filteredEpisodes.map((episode, index) => (
              <button
                key={episode.id}
                id={`episode-result-${index}`}
                type="button"
                role="option"
                aria-selected={selectedIndex === index}
                className={`search-result-item ${
                  selectedIndex === index ? 'selected' : ''
                }`}
                onClick={() => {
                  handleSelect(episode);
                  onSubmit();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="result-title">{episode.name}</span>
                <span className="result-meta">
                  S{episode.season_number} E{episode.episode_number}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {query && !showResults && filteredEpisodes.length === 0 && (
        <p className="search-no-results" role="status">
          No episodes found. Try a different search term.
        </p>
      )}
      {query.length > 0 && query.length < MIN_SEARCH_LENGTH && (
        <p className="search-hint" role="note" aria-live="polite">
          Type at least {MIN_SEARCH_LENGTH} characters to see results. Press Enter on an exact title match to search directly.
        </p>
      )}
      {query.length === 0 && (
        <p className="search-hint" role="note">
          Start typing an episode title to search. You can also press Enter on an exact match.
        </p>
      )}
    </div>
  );
};


