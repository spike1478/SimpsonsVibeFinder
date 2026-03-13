import { useState, useEffect } from 'react';
import {
  requestPin,
  openPlexAuth,
  pollForToken,
  savePlexAuth,
  getStoredPlexAuth,
  clearPlexAuth,
  getPlexUser,
  getServers,
  fetchPlexEpisodeMap,
} from '../api/plex';
import type { PlexEpisodeMap } from '../api/plex';

interface PlexSettingsProps {
  onSignedIn: (token: string, episodeMap: PlexEpisodeMap | null, machineId: string | null) => void;
  onSignedOut: () => void;
}

export const PlexSettings: React.FC<PlexSettingsProps> = ({ onSignedIn, onSignedOut }) => {
  const [status, setStatus] = useState<'idle' | 'signing-in' | 'loading-library' | 'signed-in' | 'error'>('idle');
  const [username, setUsername] = useState<string | null>(null);
  const [thumb, setThumb] = useState<string>('');
  const [episodeCount, setEpisodeCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  async function loadPlexLibrary(token: string) {
    try {
      const servers = await getServers(token);
      for (const server of servers) {
        const result = await fetchPlexEpisodeMap(server);
        if (result && result.map.size > 0) {
          setEpisodeCount(result.map.size);
          onSignedIn(token, result.map, result.machineId);
          return;
        }
      }
      // No Simpsons found, still signed in but no deep links
      onSignedIn(token, null, null);
    } catch {
      onSignedIn(token, null, null);
    }
  }

  // Check for existing auth on mount
  useEffect(() => {
    const stored = getStoredPlexAuth();
    if (stored) {
      setStatus('loading-library');
      getPlexUser(stored).then(user => {
        if (user) {
          setUsername(user.username);
          setThumb(user.thumb);
          loadPlexLibrary(stored).then(() => setStatus('signed-in'));
        } else {
          clearPlexAuth();
          setStatus('idle');
          onSignedOut();
        }
      });
    }
  }, []);

  const handleSignIn = async () => {
    setStatus('signing-in');
    setError(null);

    try {
      const pin = await requestPin();
      openPlexAuth(pin.code);
      const token = await pollForToken(pin.id);

      savePlexAuth(token);

      const user = await getPlexUser(token);
      if (user) {
        setUsername(user.username);
        setThumb(user.thumb);
      }

      setStatus('loading-library');
      await loadPlexLibrary(token);
      setStatus('signed-in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      setStatus('error');
    }
  };

  const handleSignOut = () => {
    clearPlexAuth();
    setUsername(null);
    setThumb('');
    setEpisodeCount(0);
    setStatus('idle');
    onSignedOut();
  };

  return (
    <div className="plex-settings-card">
      {status === 'signed-in' ? (
        <div className="plex-signed-in">
          <div className="plex-user-info">
            {thumb && <img src={thumb} alt="" className="plex-avatar" />}
            <span className="plex-username">
              Signed in as <strong>{username || 'Plex User'}</strong>
            </span>
          </div>
          {episodeCount > 0 ? (
            <p className="plex-hint">Found {episodeCount} Simpsons episodes in your library. Links go directly to each episode.</p>
          ) : (
            <p className="plex-hint">The Simpsons not found in your library. Links will search Plex instead.</p>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="plex-sign-out-button"
            aria-label="Sign out of Plex"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="plex-sign-in">
          <div className="plex-branding">
            <svg className="plex-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L2 19.5h20L12 2z" fill="#E5A00D" />
            </svg>
            <span className="plex-label">Plex</span>
          </div>
          <p className="plex-hint">
            Sign in to link episodes directly to your Plex library.
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            className="plex-sign-in-button"
            disabled={status === 'signing-in' || status === 'loading-library'}
            aria-label="Sign in with Plex"
          >
            {status === 'signing-in'
              ? 'Waiting for approval...'
              : status === 'loading-library'
                ? 'Finding your Simpsons...'
                : 'Sign in to Plex'}
          </button>
          {error && <p className="plex-error" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
};
