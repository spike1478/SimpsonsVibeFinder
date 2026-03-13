import React from 'react';
import type { ScoredEpisode } from '../types';
import type { PlexEpisodeMap } from '../api/plex';
import { EpisodeCard } from './EpisodeCard';

interface ResultsProps {
  results: ScoredEpisode[];
  plexEpisodeMap?: PlexEpisodeMap | null;
  plexMachineId?: string | null;
}

export const Results: React.FC<ResultsProps> = ({ results, plexEpisodeMap, plexMachineId }) => {
  const isEmptyResult = results.length === 1 && results[0].episode.id === -1;

  if (results.length === 0 || isEmptyResult) {
    return (
      <div className="results-container" role="region" aria-live="polite">
        <p className="no-results">
          {isEmptyResult
            ? 'No episodes match your current filters. Try relaxing them to get a surprise recommendation.'
            : 'No episodes match your criteria. Try adjusting filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="results-container" role="region" aria-live="polite" aria-label="Recommendation results">
      <h2 className="results-heading">Recommendations</h2>
      <div className="results-grid">
        {results.map((result, index) => (
          <EpisodeCard
            key={result.episode.id}
            episode={result}
            rank={index + 1}
            plexEpisodeMap={plexEpisodeMap}
            plexMachineId={plexMachineId}
          />
        ))}
      </div>
    </div>
  );
};
