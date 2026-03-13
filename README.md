# Simpsons Vibe Finder

A retro-styled web app that recommends Simpsons episodes based on your mood or finds episodes similar to one you love. Built with React, TypeScript, and Vite.

## Features

- **Mood Quiz**: Answer 4 short questions to get personalized episode recommendations
- **More Like This**: Search for an episode and find 3 similar episodes using TF-IDF similarity
- **Smart Filters**: Exclude clip shows, Halloween episodes, or limit to classic era (Seasons 3-9)
- **Surprise Me**: Get a random episode recommendation
- **Accessible**: Full keyboard navigation, screen reader support, and WCAG-compliant design
- **Retro Styling**: Simpsons-themed color palette and nostalgic UI

## Setup

### Prerequisites

- Node.js 18+ and npm
- A TMDB API key ([Get one here](https://www.themoviedb.org/settings/api))

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.template .env
```

4. Add your TMDB API key to `.env`:
```
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

## Running Locally

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## Building for Production

Build the production bundle:
```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the production build with:
```bash
npm run preview
```

## Testing

Run unit tests:
```bash
npm test
```

Tests cover:
- Feature extraction (Halloween/clip show detection, tone buckets)
- Scoring logic (quiz scoring, filter application)
- Similarity search (TF-IDF, self-exclusion, filter respect)

## Deployment

### Important: API Key Security

**Warning**: This app currently uses the TMDB API key directly from the browser. This exposes your API key in the client-side code, which means:

- Anyone can view your API key in the browser's developer tools
- Your API key could be extracted and used by others
- This may violate TMDB's terms of service

### Recommended: Proxy API Calls

For production deployment, you should:

1. **Create a backend proxy** that:
   - Stores the TMDB API key securely (server-side only)
   - Proxies requests from your frontend to TMDB
   - Adds rate limiting and error handling

2. **Update the API client** (`src/api/tmdb.ts`) to:
   - Call your proxy endpoint instead of TMDB directly
   - Remove the API key from client-side code

3. **Example proxy structure**:
   ```
   Frontend → Your Backend → TMDB API
   (no key)    (key stored)   (key used)
   ```

### Deployment Platforms

The built `dist` folder can be deployed to:
- **Vercel**: Connect your repo and deploy
- **Netlify**: Drag and drop the `dist` folder or connect your repo
- **GitHub Pages**: Use GitHub Actions to build and deploy
- **Any static hosting**: The `dist` folder contains all static files

## Project Structure

```
SimpsonsVibeFinder/
├── src/
│   ├── api/
│   │   └── tmdb.ts              # TMDB API client and cache
│   ├── recommender/
│   │   ├── featureExtract.ts    # Extract features from episodes
│   │   ├── weights.ts           # Tone keywords and scoring weights
│   │   ├── score.ts             # Hybrid scoring logic
│   │   └── similarity.ts        # TF-IDF similarity implementation
│   ├── components/
│   │   ├── Tabs.tsx             # Accessible tab component
│   │   ├── Filters.tsx          # Filter toggles
│   │   ├── Quiz.tsx             # 4-question quiz
│   │   ├── EpisodeSearch.tsx    # Search with typeahead
│   │   ├── EpisodeCard.tsx      # Result card component
│   │   ├── Results.tsx          # Results container
│   │   └── PlexSettings.tsx     # Optional Plex URL input
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── test/
│   │   └── setup.ts             # Test configuration
│   ├── App.tsx                  # Main app component
│   ├── App.css                  # Retro styling
│   └── main.tsx                 # Entry point
├── .env.template                # Environment variable template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## How It Works

### Mood Quiz Mode

1. User answers 4 questions about their preferences
2. Answers are converted to a tone preference vector
3. Each episode's tone buckets are compared to user preferences using cosine similarity
4. Popularity score adds a small boost
5. Filters are applied (clip shows, Halloween, classic-only)
6. Top 3 episodes are selected and displayed with "why" explanations

### More Like This Mode

1. User searches for an episode by title
2. TF-IDF vectors are computed for all episodes (title + overview)
3. Cosine similarity is calculated between selected episode and all others
4. Selected episode is excluded from results
5. Filters are applied
6. Top 3 most similar episodes are returned with keyword-based explanations

### Feature Extraction

Each episode is analyzed to extract:
- **Halloween detection**: Matches "Treehouse of Horror" patterns
- **Clip show detection**: Known titles + keyword matching
- **Tone buckets**: 6 tones (cosy, laugh-out-loud, clever satire, chaotic, wholesome, cynical)
- **Popularity score**: Normalized from TMDB vote data
- **Keywords**: Extracted for TF-IDF similarity

## Accessibility

This app follows WCAG guidelines:

- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Color Contrast**: WCAG AA minimum (4.5:1 for text)
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Semantic HTML**: Proper heading hierarchy and landmarks

## Tech Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Vitest**: Unit testing
- **TMDB API**: Episode data source
- **Plain CSS**: No CSS framework (retro styling)

## License

This project is open source and available for personal use.

## Credits

- Episode data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Inspired by The Simpsons (TM & © 20th Century Fox)


