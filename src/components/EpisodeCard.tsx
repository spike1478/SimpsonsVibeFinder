import React from 'react';
import type { ScoredEpisode } from '../types';
import { getTMDBEpisodeUrl } from '../config';
import { buildPlexLink } from '../api/plex';
import type { PlexEpisodeMap } from '../api/plex';

interface EpisodeCardProps {
  episode: ScoredEpisode;
  rank: number;
  plexEpisodeMap?: PlexEpisodeMap | null;
  plexMachineId?: string | null;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  rank,
  plexEpisodeMap,
  plexMachineId,
}) => {
  const { name, season_number, episode_number, vote_average } = episode.episode;

  const tmdbUrl = getTMDBEpisodeUrl(season_number, episode_number);
  const plexUrl = (plexEpisodeMap || plexMachineId)
    ? buildPlexLink(season_number, episode_number, name, plexEpisodeMap ?? null, plexMachineId ?? null)
    : null;

  const rankLabels: Record<number, string> = {
    1: '1st Pick',
    2: '2nd Pick',
    3: '3rd Pick',
  };

  return (
    <article className="episode-card" aria-labelledby={`episode-title-${rank}`}>
      <div className="episode-card-header">
        <h3 id={`episode-title-${rank}`} className="episode-title">
          {name}
        </h3>
        <span className="episode-rank" aria-label={rankLabels[rank]}>
          {rankLabels[rank]}
        </span>
      </div>
      <p className="episode-meta">
        Season {season_number}, Episode {episode_number}
        {vote_average && (
          <span className="episode-rating" aria-label={`Rating: ${vote_average} out of 10`}>
            {' '}&bull; {vote_average.toFixed(1)}/10
          </span>
        )}
      </p>
      <p className="episode-why">{episode.whyText}</p>
      <div className="episode-actions">
        <a
          href={tmdbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="action-button"
          aria-label={`Open ${name} on TMDB (opens in new tab)`}
        >
          TMDB
        </a>
        {plexUrl && (
          <a
            href={plexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button action-button-plex"
            aria-label={`Open ${name} in Plex (opens in new tab)`}
          >
            Open in Plex
          </a>
        )}
      </div>
    </article>
  );
};
