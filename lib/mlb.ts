import { unstable_cache } from "next/cache";
import { headshotUrl, shiftEt, teamAbbrFromName, todayEt } from "./format";
import { generateCrazyStats } from "./crazy-stats";
import { aggregateHits, aggregatePitches, hitFromApi, lastN, pitchFromApi } from "./stats";
import type {
  GameHit,
  GamePitch,
  HomeGame,
  HomePayload,
  PlayerPayload,
  PlayerRef,
} from "./types";

const MLB = "https://statsapi.mlb.com/api/v1";
const SEASON = 2026;

type CacheEntry<T> = { expires: number; value: T };
const cache = new Map<string, CacheEntry<unknown>>();

async function mlb<T>(path: string, ttlMs: number): Promise<T> {
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const res = await fetch(`${MLB}${path}`, {
    headers: { "User-Agent": "mlb-player-stats-live/1.0" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`MLB API ${res.status} for ${path}`);
  }
  const value = (await res.json()) as T;
  cache.set(path, { expires: Date.now() + ttlMs, value });
  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function personName(person: Record<string, unknown>): string {
  return String(person.fullName ?? person.name ?? "Unknown");
}

function refFromPerson(
  person: Record<string, unknown>,
  extras: Partial<PlayerRef> = {},
): PlayerRef {
  const team = asRecord(person.currentTeam ?? extras);
  const pos = asRecord(person.primaryPosition);
  const teamName = String(team.name ?? extras.team ?? "");
  return {
    id: Number(person.id),
    name: personName(person),
    firstName: person.firstName ? String(person.firstName) : undefined,
    lastName: person.lastName ? String(person.lastName) : undefined,
    nickname: person.nickName ? String(person.nickName) : undefined,
    team: teamName || extras.team,
    teamId: Number(team.id ?? extras.teamId) || extras.teamId,
    teamAbbr: extras.teamAbbr ?? (teamName ? teamAbbrFromName(teamName) : undefined),
    position: String(pos.abbreviation ?? extras.position ?? ""),
    number: person.primaryNumber ? String(person.primaryNumber) : extras.number,
  };
}

export function playerImage(id: number): string {
  return headshotUrl(id);
}

type LeaderPerson = PlayerRef & { value: string; category: string };

async function leaders(category: string, group: "hitting" | "pitching", limit = 8): Promise<LeaderPerson[]> {
  const data = await mlb<{
    leagueLeaders?: {
      leaderCategory?: string;
      statGroup?: string;
      leaders?: {
        value?: string;
        person?: Record<string, unknown>;
        team?: Record<string, unknown>;
      }[];
    }[];
  }>(
    `/stats/leaders?leaderCategories=${category}&season=${SEASON}&sportId=1&statGroup=${group}&limit=${limit}`,
    5 * 60_000,
  );
  const block =
    data.leagueLeaders?.find((b) => (b.statGroup ?? group) === group) ??
    data.leagueLeaders?.[0];
  return (block?.leaders ?? []).map((row) => {
    const person = asRecord(row.person);
    const team = asRecord(row.team);
    return {
      ...refFromPerson(person, {
        team: team.name ? String(team.name) : undefined,
        teamId: team.id ? Number(team.id) : undefined,
        teamAbbr: teamNameAbbr(team),
      }),
      value: String(row.value ?? ""),
      category,
    };
  });
}

function teamNameAbbr(team: Record<string, unknown>): string | undefined {
  if (team.abbreviation) return String(team.abbreviation);
  if (team.name) return teamAbbrFromName(String(team.name));
  return undefined;
}

async function scheduleFor(date: string): Promise<HomeGame[]> {
  const data = await mlb<{
    dates?: {
      games?: Record<string, unknown>[];
    }[];
  }>(
    `/schedule?sportId=1&date=${date}&hydrate=probablePitcher,lineups,team`,
    60_000,
  );
  const games = data.dates?.[0]?.games ?? [];
  return games.map((game) => {
    const teams = asRecord(game.teams);
    const homeSide = asRecord(teams.home);
    const awaySide = asRecord(teams.away);
    const homeTeam = asRecord(homeSide.team);
    const awayTeam = asRecord(awaySide.team);
    const status = asRecord(game.status);
    const lineups = asRecord(game.lineups);
    const venue = asRecord(game.venue);
    const players: PlayerRef[] = [];
    const pushSide = (
      list: unknown,
      team: Record<string, unknown>,
    ) => {
      if (!Array.isArray(list)) return;
      for (const raw of list) {
        const person = asRecord(raw);
        players.push(
          refFromPerson(person, {
            team: String(team.name ?? ""),
            teamId: Number(team.id) || undefined,
            teamAbbr: teamNameAbbr(team),
          }),
        );
      }
    };
    pushSide(lineups.homePlayers, homeTeam);
    pushSide(lineups.awayPlayers, awayTeam);
    const homePitcher = asRecord(asRecord(homeSide.probablePitcher));
    const awayPitcher = asRecord(asRecord(awaySide.probablePitcher));
    if (homePitcher.id) {
      players.push(
        refFromPerson(homePitcher, {
          team: String(homeTeam.name ?? ""),
          teamId: Number(homeTeam.id) || undefined,
          teamAbbr: teamNameAbbr(homeTeam),
          position: "P",
        }),
      );
    }
    if (awayPitcher.id) {
      players.push(
        refFromPerson(awayPitcher, {
          team: String(awayTeam.name ?? ""),
          teamId: Number(awayTeam.id) || undefined,
          teamAbbr: teamNameAbbr(awayTeam),
          position: "P",
        }),
      );
    }
    const uniq = new Map<number, PlayerRef>();
    for (const p of players) if (p.id) uniq.set(p.id, p);
    return {
      gamePk: Number(game.gamePk),
      status: String(status.detailedState ?? status.abstractGameState ?? ""),
      abstractState: String(status.abstractGameState ?? ""),
      venue: venue.name ? String(venue.name) : undefined,
      home: {
        id: Number(homeTeam.id),
        name: String(homeTeam.name ?? "Home"),
        abbr: teamNameAbbr(homeTeam),
        score: homeSide.score != null ? Number(homeSide.score) : undefined,
      },
      away: {
        id: Number(awayTeam.id),
        name: String(awayTeam.name ?? "Away"),
        abbr: teamNameAbbr(awayTeam),
        score: awaySide.score != null ? Number(awaySide.score) : undefined,
      },
      players: [...uniq.values()],
    };
  });
}

export async function getHome(): Promise<HomePayload> {
  const today = todayEt();
  const yesterday = shiftEt(-1);
  let games = await scheduleFor(today);
  let slateLabel = "Today's lineups";
  if (games.every((g) => g.players.length === 0) || games.length === 0) {
    games = await scheduleFor(yesterday);
    slateLabel = "Last night's lineups";
  } else if (games.every((g) => g.abstractState === "Final")) {
    slateLabel = "Today's slate — final";
  } else if (games.some((g) => g.abstractState === "Live")) {
    slateLabel = "Live right now";
  }

  const [homeRuns, ops, stolenBases, era, strikeouts] = await Promise.all([
    leaders("homeRuns", "hitting"),
    leaders("onBasePlusSlugging", "hitting"),
    leaders("stolenBases", "hitting"),
    leaders("earnedRunAverage", "pitching"),
    leaders("strikeouts", "pitching"),
  ]);

  return {
    asOf: today,
    slateLabel,
    games,
    heaters: { homeRuns, ops, stolenBases, era, strikeouts },
  };
}

export const getHomeCached = unstable_cache(getHome, ["mlb-home"], {
  revalidate: 60,
});

export async function searchPlayers(query: string): Promise<PlayerRef[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await mlb<{ people?: Record<string, unknown>[] }>(
    `/people/search?names=${encodeURIComponent(q)}`,
    30_000,
  );
  return (data.people ?? [])
    .map((p) => refFromPerson(p))
    .filter((p) => p.id)
    .slice(0, 12);
}

function mapHitGame(split: Record<string, unknown>): GameHit | null {
  const stat = hitFromApi(asRecord(split.stat));
  if (!stat) return null;
  const opponent = asRecord(split.opponent);
  return {
    ...stat,
    date: String(split.date ?? ""),
    opponent: String(opponent.name ?? "Opp"),
    opponentId: opponent.id ? Number(opponent.id) : undefined,
    isHome: Boolean(split.isHome),
    isWin: split.isWin == null ? undefined : Boolean(split.isWin),
    summary: asRecord(split.stat).summary ? String(asRecord(split.stat).summary) : undefined,
  };
}

function mapPitchGame(split: Record<string, unknown>): GamePitch | null {
  const stat = pitchFromApi(asRecord(split.stat));
  if (!stat) return null;
  const opponent = asRecord(split.opponent);
  return {
    ...stat,
    date: String(split.date ?? ""),
    opponent: String(opponent.name ?? "Opp"),
    opponentId: opponent.id ? Number(opponent.id) : undefined,
    isHome: Boolean(split.isHome),
    isWin: split.isWin == null ? undefined : Boolean(split.isWin),
    summary: asRecord(split.stat).summary ? String(asRecord(split.stat).summary) : undefined,
  };
}

export async function getPlayer(id: number): Promise<PlayerPayload> {
  const hydrate =
    `currentTeam,stats(group=[hitting,pitching],type=[season,gameLog],season=${SEASON})`;
  const data = await mlb<{ people?: Record<string, unknown>[] }>(
    `/people/${id}?hydrate=${encodeURIComponent(hydrate)}`,
    45_000,
  );
  const person = data.people?.[0];
  if (!person) throw new Error(`Player ${id} not found`);

  const player = refFromPerson(person);
  const bat = asRecord(person.batSide);
  const throwH = asRecord(person.pitchHand);
  const pos = asRecord(person.primaryPosition);

  let seasonHit;
  let seasonPitch;
  const hitGames: GameHit[] = [];
  const pitchGames: GamePitch[] = [];

  for (const raw of (person.stats as unknown[] | undefined) ?? []) {
    const block = asRecord(raw);
    const group = String(asRecord(block.group).displayName ?? "").toLowerCase();
    const type = String(asRecord(block.type).displayName ?? "").toLowerCase();
    const splits = Array.isArray(block.splits) ? block.splits : [];
    if (type.includes("season") && group === "hitting") {
      seasonHit = hitFromApi(asRecord(asRecord(splits[0]).stat));
    }
    if (type.includes("season") && group === "pitching") {
      seasonPitch = pitchFromApi(asRecord(asRecord(splits[0]).stat));
    }
    if (type.includes("game") && group === "hitting") {
      for (const s of splits) {
        const g = mapHitGame(asRecord(s));
        if (g) hitGames.push(g);
      }
    }
    if (type.includes("game") && group === "pitching") {
      for (const s of splits) {
        const g = mapPitchGame(asRecord(s));
        if (g) pitchGames.push(g);
      }
    }
  }

  hitGames.sort((a, b) => a.date.localeCompare(b.date));
  pitchGames.sort((a, b) => a.date.localeCompare(b.date));

  const crazy = generateCrazyStats({
    name: player.name,
    nickname: player.nickname,
    team: player.team,
    position: player.position,
    seasonHit,
    seasonPitch,
    hitGames,
    pitchGames,
  });

  const lastHit = hitGames[hitGames.length - 1];
  const liveNote = lastHit
    ? `Last game ${lastHit.date} vs ${lastHit.opponent}${lastHit.summary ? ` — ${lastHit.summary}` : ""}`
    : undefined;

  return {
    player: {
      ...player,
      age: person.currentAge ? Number(person.currentAge) : undefined,
      bats: bat.description ? String(bat.description) : undefined,
      throws: throwH.description ? String(throwH.description) : undefined,
      positionName: pos.name ? String(pos.name) : undefined,
    },
    seasonHit,
    seasonPitch,
    recentHit: {
      last7: hitGames.length ? requireLine(hitGames, 7) : undefined,
      last15: hitGames.length ? requireLine(hitGames, 15) : undefined,
      last30: hitGames.length ? requireLine(hitGames, 30) : undefined,
    },
    recentPitch: {
      last3: pitchGames.length ? requirePitch(pitchGames, 3) : undefined,
      last5: pitchGames.length ? requirePitch(pitchGames, 5) : undefined,
    },
    lastHitGames: lastN(hitGames, 8).reverse(),
    lastPitchGames: lastN(pitchGames, 6).reverse(),
    crazy,
    featured: crazy[0],
    liveNote,
  };
}

function requireLine(games: GameHit[], n: number) {
  const line = aggregateHits(lastN(games, n));
  return line.games > 0 ? line : undefined;
}

function requirePitch(games: GamePitch[], n: number) {
  const line = aggregatePitches(lastN(games, n));
  return line.games > 0 ? line : undefined;
}
