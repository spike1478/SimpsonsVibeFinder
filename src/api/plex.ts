const PLEX_CLIENT_ID = 'simpsons-vibe-finder-' + (localStorage.getItem('plex_client_id') || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem('plex_client_id', id);
  return id;
})());

const PLEX_HEADERS = {
  'Accept': 'application/json',
  'X-Plex-Product': 'Simpsons Vibe Finder',
  'X-Plex-Client-Identifier': PLEX_CLIENT_ID,
  'X-Plex-Platform': 'Web',
};

interface PlexPin {
  id: number;
  code: string;
  authToken: string | null;
}

interface PlexServer {
  name: string;
  uri: string;
  accessToken: string;
  clientIdentifier: string;
}

/** Map of "S{season}E{episode}" → ratingKey for direct deep links */
export type PlexEpisodeMap = Map<string, string>;

/**
 * Request a new PIN from Plex for the OAuth flow
 */
export async function requestPin(): Promise<PlexPin> {
  const resp = await fetch('https://plex.tv/api/v2/pins?strong=true', {
    method: 'POST',
    headers: PLEX_HEADERS,
  });
  if (!resp.ok) throw new Error('Failed to request Plex PIN');
  return resp.json();
}

/**
 * Open the Plex auth page in a popup
 */
export function openPlexAuth(pinCode: string): Window | null {
  const url = `https://app.plex.tv/auth#?clientID=${encodeURIComponent(PLEX_CLIENT_ID)}&code=${pinCode}&context%5Bdevice%5D%5Bproduct%5D=Simpsons%20Vibe%20Finder`;
  return window.open(url, 'plex-auth', 'width=800,height=600');
}

/**
 * Poll for PIN to be claimed (user approved the app)
 */
export async function pollForToken(pinId: number, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const resp = await fetch(`https://plex.tv/api/v2/pins/${pinId}`, {
      headers: PLEX_HEADERS,
    });
    if (!resp.ok) continue;
    const pin: PlexPin = await resp.json();
    if (pin.authToken) return pin.authToken;
  }
  throw new Error('Plex sign-in timed out');
}

/**
 * Get the user's Plex servers
 */
export async function getServers(token: string): Promise<PlexServer[]> {
  const resp = await fetch('https://plex.tv/api/v2/resources?includeHttps=1', {
    headers: {
      ...PLEX_HEADERS,
      'X-Plex-Token': token,
    },
  });
  if (!resp.ok) throw new Error('Failed to fetch Plex servers');
  const resources: any[] = await resp.json();
  return resources
    .filter((r: any) => r.provides === 'server' && r.connections?.length > 0)
    .map((r: any) => {
      // Prefer the HTTPS connection, fall back to first available
      const conn = r.connections.find((c: any) => c.protocol === 'https' && !c.local)
        || r.connections.find((c: any) => c.protocol === 'https')
        || r.connections[0];
      return {
        name: r.name,
        uri: conn.uri,
        accessToken: r.accessToken,
        clientIdentifier: r.clientIdentifier,
      };
    });
}

/**
 * Find The Simpsons on a Plex server and build a map of S{x}E{y} → ratingKey
 */
export async function fetchPlexEpisodeMap(server: PlexServer): Promise<{ map: PlexEpisodeMap; machineId: string } | null> {
  const headers = {
    ...PLEX_HEADERS,
    'X-Plex-Token': server.accessToken,
  };

  try {
    // Search for The Simpsons on this server
    const searchResp = await fetch(
      `${server.uri}/hubs/search?query=${encodeURIComponent('The Simpsons')}&type=2&limit=5`,
      { headers }
    );
    if (!searchResp.ok) return null;
    const searchData = await searchResp.json();

    // Find the show (type 2 = show) in the hubs
    const showHub = searchData.MediaContainer?.Hub?.find((h: any) => h.type === 'show');
    const show = showHub?.Metadata?.find((m: any) =>
      m.title === 'The Simpsons' || m.title?.toLowerCase().includes('simpsons')
    );
    if (!show) return null;

    const showKey = show.ratingKey;

    // Fetch all episodes for this show
    const episodesResp = await fetch(
      `${server.uri}/library/metadata/${showKey}/allLeaves`,
      { headers }
    );
    if (!episodesResp.ok) return null;
    const episodesData = await episodesResp.json();

    const map: PlexEpisodeMap = new Map();
    const episodes = episodesData.MediaContainer?.Metadata || [];
    for (const ep of episodes) {
      if (ep.parentIndex != null && ep.index != null) {
        const key = `S${ep.parentIndex}E${ep.index}`;
        map.set(key, ep.ratingKey);
      }
    }

    return { map, machineId: server.clientIdentifier };
  } catch {
    return null;
  }
}

/**
 * Build a direct Plex deep link to a specific episode
 */
export function buildPlexDeepLink(machineId: string, ratingKey: string): string {
  return `https://app.plex.tv/desktop/#!/server/${machineId}/details?key=${encodeURIComponent(`/library/metadata/${ratingKey}`)}`;
}

/**
 * Build a Plex link for an episode. Uses deep link if available, falls back to search.
 */
export function buildPlexLink(
  season: number,
  episode: number,
  episodeName: string,
  episodeMap: PlexEpisodeMap | null,
  machineId: string | null,
): string {
  if (episodeMap && machineId) {
    const key = `S${season}E${episode}`;
    const ratingKey = episodeMap.get(key);
    if (ratingKey) {
      return buildPlexDeepLink(machineId, ratingKey);
    }
  }
  // Fallback to search
  const query = encodeURIComponent(`The Simpsons ${episodeName}`);
  return `https://app.plex.tv/desktop/#!/search?query=${query}`;
}

/**
 * Store/retrieve Plex auth from localStorage
 */
export function savePlexAuth(token: string) {
  localStorage.setItem('plex_auth_token', token);
}

export function getStoredPlexAuth(): string | null {
  return localStorage.getItem('plex_auth_token');
}

export function clearPlexAuth() {
  localStorage.removeItem('plex_auth_token');
}

/**
 * Get the user's display name from Plex
 */
export async function getPlexUser(token: string): Promise<{ username: string; thumb: string } | null> {
  try {
    const resp = await fetch('https://plex.tv/api/v2/user', {
      headers: {
        ...PLEX_HEADERS,
        'X-Plex-Token': token,
      },
    });
    if (!resp.ok) return null;
    const user = await resp.json();
    return { username: user.username || user.title, thumb: user.thumb || '' };
  } catch {
    return null;
  }
}
