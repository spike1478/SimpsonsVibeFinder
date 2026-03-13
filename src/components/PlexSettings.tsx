import React, { useState } from 'react';

interface PlexSettingsProps {
  plexBaseUrl: string;
  plexAuthToken: string;
  onPlexUrlChange: (url: string) => void;
  onPlexAuthTokenChange: (token: string) => void;
}

export const PlexSettings: React.FC<PlexSettingsProps> = ({
  plexBaseUrl,
  plexAuthToken,
  onPlexUrlChange,
  onPlexAuthTokenChange,
}) => {
  const [_showTokenHelp, _setShowTokenHelp] = useState(false);

  const handleGetTokenClick = () => {
    // Open Plex token instructions
    window.open('https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/', '_blank');
  };

  return (
    <details className="plex-settings">
      <summary>Plex Settings (Optional)</summary>
      <div className="plex-settings-content">
        <label htmlFor="plex-url-input">
          Plex Server URL
          <input
            id="plex-url-input"
            type="url"
            value={plexBaseUrl}
            onChange={e => onPlexUrlChange(e.target.value)}
            placeholder="https://app.plex.tv/desktop"
            className="plex-url-input"
            aria-describedby="plex-url-help"
          />
        </label>
        
        <label htmlFor="plex-token-input" className="plex-token-label">
          Plex Auth Token (Optional - for direct server access)
          <div className="plex-token-input-group">
            <input
              id="plex-token-input"
              type="password"
              value={plexAuthToken}
              onChange={e => onPlexAuthTokenChange(e.target.value)}
              placeholder="X-Plex-Token (leave empty to use browser session)"
              className="plex-url-input"
              aria-describedby="plex-token-help"
            />
            <button
              type="button"
              onClick={handleGetTokenClick}
              className="plex-token-help-button"
              aria-label="How to get Plex token"
            >
              How to get token
            </button>
          </div>
        </label>

        <p id="plex-url-help" className="help-text">
          <strong>For Plex.tv users:</strong> Leave the default <code>https://app.plex.tv/desktop</code> if you're logged into Plex in your browser. 
          Links will work automatically using your browser session (no token needed).
        </p>
        <p className="help-text">
          <strong>For local server users:</strong> Change this to your local Plex server URL (e.g., <code>http://192.168.1.100:32400</code>). 
          You'll likely need a token (see below) for direct server access.
        </p>
        
        <p id="plex-token-help" className="help-text">
          <strong>Token required for:</strong> Local server URLs, or if you get 401 authentication errors with Plex.tv.
          <br />
          <strong>Token not needed for:</strong> Plex.tv URLs when you're logged into Plex in your browser.
          <br />
          Get your token from browser developer tools (Network tab → X-Plex-Token header) or use the "How to get token" button above.
        </p>
      </div>
    </details>
  );
};

