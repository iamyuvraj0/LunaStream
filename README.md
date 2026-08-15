# LUMA 2.0 — Full Dynamic Movie/TV Site

## What is actually functional
- Dynamic movie and TV catalog from TMDB
- Trending, popular, top-rated and discovery sections
- Search across movies and TV
- Dynamic movie/series details
- TV seasons and episode lists
- Dynamic Vidking player URLs
- Movie/episode watch progress saved locally
- Continue Watching
- Player settings
- Responsive glass/cinematic UI
- Backend proxy keeps the TMDB token out of browser JavaScript

## Run locally
1. Install Node.js 18+.
2. Copy `.env.example` to `.env`.
3. Put your TMDB API Read Access Token in `TMDB_TOKEN`.
4. Run:
   npm install
   npm start
5. Open http://localhost:3000

TMDB API credentials are required because the catalog is fetched live rather than being hardcoded.

## Important playback note
LUMA generates the Vidking embed URLs dynamically from TMDB IDs. Whether a particular title actually plays depends on Vidking's currently available sources. The site does not host or upload video files.

Use only streaming content/sources you are authorized to distribute.
