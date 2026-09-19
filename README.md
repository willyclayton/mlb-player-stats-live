# MLB Player Stats Live

Tap a player. The app pulls **live MLB numbers**, then writes a **crazy stat** — the line that should not be real.

## What it does

1. Browse today’s (or last night’s) lineups and 2026 league leaders.
2. Search any major-leaguer.
3. Click a player. A live feed runs against the MLB Stats API.
4. A take lands: two-way freaks, 30-30 clubs, last-15 heaters, nuclear weeks, unfair ERAs.

No API key. Numbers come straight from `statsapi.mlb.com`.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## Stack

- Next.js App Router
- TypeScript
- MLB Stats API (server routes + in-memory cache)
- Deterministic crazy-stat engine in `lib/crazy-stats.ts`

Add to Home Screen from Safari for the phone-sized shell.
