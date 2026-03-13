import React from 'react';
import type { ScoredEpisode } from '../types';
import { getTMDBEpisodeUrl } from '../config';

interface EpisodeCardProps {
  episode: ScoredEpisode;
  rank: number;
  plexBaseUrl?: string;
  plexAuthToken?: string;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  rank,
  plexBaseUrl,
  plexAuthToken,
}) => {
  const { name, season_number, episode_number, vote_average } = episode.episode;

  const tmdbUrl = getTMDBEpisodeUrl(season_number, episode_number);

  const getPlexUrl = (): string | null => {
    if (!plexBaseUrl) {
      return null;
    }

    // Clean the base URL
    const baseUrl = plexBaseUrl.trim().replace(/\/$/, '');
    
    // Format search query - use episode title, Plex is good at matching
    const searchQuery = encodeURIComponent(name);
    
    // Check if it's a Plex.tv URL or local server
    if (baseUrl.includes('app.plex.tv') || baseUrl.includes('plex.tv')) {
      // Plex.tv web app format - uses browser session, no token needed
      if (baseUrl.includes('/desktop')) {
        return `${baseUrl}#!/search?query=${searchQuery}`;
      } else {
        return `${baseUrl}/desktop/#!/search?query=${searchQuery}`;
      }
    } else {
      // Local server format (e.g., http://192.168.1.100:32400)
      // Modern Plex web interface
      if (baseUrl.includes('/web')) {
        // Token goes in the hash fragment for web UI
        const hashAuth = plexAuthToken ? `?X-Plex-Token=${encodeURIComponent(plexAuthToken)}` : '';
        return `${baseUrl}${hashAuth}#!/search?query=${searchQuery}`;
      } else {
        // For direct server access, token in URL params before hash
        const tokenParam = plexAuthToken ? `?X-Plex-Token=${encodeURIComponent(plexAuthToken)}` : '';
        return `${baseUrl}/web/index.html${tokenParam}#!/search?query=${searchQuery}`;
      }
    }
  };

  const plexUrl = getPlexUrl();

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
            {' '}• {vote_average.toFixed(1)}/10
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
          Open on TMDB
        </a>
        {plexUrl ? (
          <a
            href={plexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button"
            aria-label={`Search for ${name} in Plex (opens in new tab)`}
          >
            Search in Plex
          </a>
        ) : (
          <span className="action-button disabled" aria-label="Plex URL not configured">
            Plex (not configured)
          </span>
        )}
      </div>
    </article>
  );
};
