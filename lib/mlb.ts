import { teamAbbrFromName, todayEt, shiftEt } from "./format";
import { generateCrazyStats } from "./crazy-stats";
import { aggregateHits, hitFromApi, lastN, pitchFromApi } from "./stats";
import type {
  GameHit,
  GamePitch,
  Heater,
  HomeGame,
  HomePayload,
  PlayerPayload,
  PlayerRef,
} from "./types";

const MLB = "https://statsapi.mlb.com/api/v1";
const SEASON = 2026;

const LEADER_LABEL: Record<string, string> = {
  homeRuns: "HR",
  onBasePlusSlugging: "OPS",
  stolenBases: "SB",
  earnedRunAverage: "ERA",
  strikeouts: "K",
};

async function mlb<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${MLB}${path}`, {
    headers: { "User-Agent": "mlb-player-stats-live/1.0" },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`MLB API ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function playerRef(
  person: Record<string, unknown>,
  extras: Partial<PlayerRef> = {},
): PlayerRef {
  const team = rec(person.currentTeam ?? extras);
  const pos = rec(person.primaryPosition);
  const teamName = String(team.name ?? extras.team ?? "");
  return {
    id: Number(person.id),
    name: String(person.fullName ?? person.name ?? "Unknown"),
    nickname: person.nickName ? String(person.nickName) : extras.nickname,
    team: teamName || extras.team,
    teamId: Number(team.id ?? extras.teamId) || extras.teamId,
    teamAbbr: extras.teamAbbr ?? (teamName ? teamAbbrFromName(teamName) : undefined),
    position: String(pos.abbreviation ?? extras.position ?? ""),
    number: person.primaryNumber ? String(person.primaryNumber) : extras.number,
  };
}

function teamAbbr(team: Record<string, unknown>): string {
  if (team.abbreviation) return String(team.abbreviation);
  return teamAbbrFromName(String(team.name ?? ""));
}

async function schedule(date: string): Promise<{ games: HomeGame[]; players: PlayerRef[] }> {
  const data = await mlb<{ dates?: { games?: Record<string, unknown>[] }[] }>(
    `/schedule?sportId=1&date=${date}&hydrate=lineups,probablePitcher,team`,
    60,
  );
  const games: HomeGame[] = [];
  const players = new Map<number, PlayerRef>();

  const add = (person: Record<string, unknown>, team: Record<string, unknown>, position?: string) => {
    if (!person.id) return;
    const ref = playerRef(person, {
      team: String(team.name ?? ""),
      teamId: Number(team.id) || undefined,
      teamAbbr: teamAbbr(team),
      position,
    });
    if (ref.id) players.set(ref.id, ref);
  };

  for (const game of data.dates?.[0]?.games ?? []) {
    const teams = rec(game.teams);
    const homeSide = rec(teams.home);
    const awaySide = rec(teams.away);
    const homeTeam = rec(homeSide.team);
    const awayTeam = rec(awaySide.team);
    const status = rec(game.status);
    const lineups = rec(game.lineups);

    for (const raw of Array.isArray(lineups.homePlayers) ? lineups.homePlayers : []) {
      add(rec(raw), homeTeam);
    }
    for (const raw of Array.isArray(lineups.awayPlayers) ? lineups.awayPlayers : []) {
      add(rec(raw), awayTeam);
    }
    add(rec(homeSide.probablePitcher), homeTeam, "P");
    add(rec(awaySide.probablePitcher), awayTeam, "P");

    games.push({
      gamePk: Number(game.gamePk),
      status: String(status.detailedState ?? status.abstractGameState ?? ""),
      abstractState: String(status.abstractGameState ?? ""),
      home: {
        abbr: teamAbbr(homeTeam),
        score: homeSide.score != null ? Number(homeSide.score) : undefined,
      },
      away: {
        abbr: teamAbbr(awayTeam),
        score: awaySide.score != null ? Number(awaySide.score) : undefined,
      },
    });
  }

  return { games, players: [...players.values()] };
}

async function heaters(): Promise<Heater[]> {
  const [hit, pitch] = await Promise.all([
    mlb<{
      leagueLeaders?: {
        leaderCategory?: string;
        statGroup?: string;
        leaders?: { value?: string; person?: Record<string, unknown>; team?: Record<string, unknown> }[];
      }[];
    }>(
      `/stats/leaders?leaderCategories=homeRuns,onBasePlusSlugging,stolenBases&season=${SEASON}&sportId=1&statGroup=hitting&limit=4`,
      300,
    ),
    mlb<{
      leagueLeaders?: {
        leaderCategory?: string;
        statGroup?: string;
        leaders?: { value?: string; person?: Record<string, unknown>; team?: Record<string, unknown> }[];
      }[];
    }>(
      `/stats/leaders?leaderCategories=earnedRunAverage,strikeouts&season=${SEASON}&sportId=1&statGroup=pitching&limit=4`,
      300,
    ),
  ]);

  const out: Heater[] = [];
  const seen = new Set<number>();
  for (const block of [...(hit.leagueLeaders ?? []), ...(pitch.leagueLeaders ?? [])]) {
    const category = String(block.leaderCategory ?? "");
    const label = LEADER_LABEL[category] ?? category;
    for (const row of block.leaders ?? []) {
      const person = rec(row.person);
      const id = Number(person.id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const team = rec(row.team);
      out.push({
        ...playerRef(person, {
          team: team.name ? String(team.name) : undefined,
          teamId: team.id ? Number(team.id) : undefined,
          teamAbbr: team.name ? teamAbbr(team) : undefined,
        }),
        value: String(row.value ?? ""),
        label,
      });
      if (out.length >= 8) return out;
    }
  }
  return out;
}

export async function getHome(): Promise<HomePayload> {
  const today = todayEt();
  const [slate, board] = await Promise.all([schedule(today), heaters()]);
  let { games, players } = slate;
  let slateLabel = "Today";

  if (games.length === 0 || players.length === 0) {
    const prior = await schedule(shiftEt(-1));
    games = prior.games;
    players = prior.players;
    slateLabel = "Last night";
  } else if (games.some((g) => g.abstractState === "Live")) {
    slateLabel = "Live";
  } else if (games.every((g) => g.abstractState === "Final")) {
    slateLabel = "Final";
  }

  return {
    asOf: today,
    slateLabel,
    games,
    players: players.slice(0, 10),
    heaters: board,
  };
}

export async function searchPlayers(query: string): Promise<PlayerRef[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await mlb<{ people?: Record<string, unknown>[] }>(
    `/people/search?names=${encodeURIComponent(q)}`,
    30,
  );
  return (data.people ?? []).map((p) => playerRef(p)).filter((p) => p.id).slice(0, 8);
}

function mapHitGame(split: Record<string, unknown>): GameHit | null {
  const stat = hitFromApi(rec(split.stat));
  if (!stat) return null;
  const opponent = rec(split.opponent);
  return {
    ...stat,
    date: String(split.date ?? ""),
    opponent: String(opponent.name ?? "Opp"),
    opponentId: opponent.id ? Number(opponent.id) : undefined,
    isHome: Boolean(split.isHome),
    isWin: split.isWin == null ? undefined : Boolean(split.isWin),
    summary: rec(split.stat).summary ? String(rec(split.stat).summary) : undefined,
  };
}

function mapPitchGame(split: Record<string, unknown>): GamePitch | null {
  const stat = pitchFromApi(rec(split.stat));
  if (!stat) return null;
  const opponent = rec(split.opponent);
  return {
    ...stat,
    date: String(split.date ?? ""),
    opponent: String(opponent.name ?? "Opp"),
    opponentId: opponent.id ? Number(opponent.id) : undefined,
    isHome: Boolean(split.isHome),
    isWin: split.isWin == null ? undefined : Boolean(split.isWin),
    summary: rec(split.stat).summary ? String(rec(split.stat).summary) : undefined,
  };
}

export async function getPlayer(id: number): Promise<PlayerPayload> {
  const hydrate = `currentTeam,stats(group=[hitting,pitching],type=[season,gameLog],season=${SEASON})`;
  const data = await mlb<{ people?: Record<string, unknown>[] }>(
    `/people/${id}?hydrate=${encodeURIComponent(hydrate)}`,
    45,
  );
  const person = data.people?.[0];
  if (!person) throw new Error(`Player ${id} not found`);

  const player = playerRef(person);
  const bat = rec(person.batSide);
  const throwH = rec(person.pitchHand);

  let seasonHit;
  let seasonPitch;
  const hitGames: GameHit[] = [];
  const pitchGames: GamePitch[] = [];

  for (const raw of (person.stats as unknown[] | undefined) ?? []) {
    const block = rec(raw);
    const group = String(rec(block.group).displayName ?? "").toLowerCase();
    const type = String(rec(block.type).displayName ?? "").toLowerCase();
    const splits = Array.isArray(block.splits) ? block.splits : [];
    if (type.includes("season") && group === "hitting") {
      seasonHit = hitFromApi(rec(rec(splits[0]).stat));
    } else if (type.includes("season") && group === "pitching") {
      seasonPitch = pitchFromApi(rec(rec(splits[0]).stat));
    } else if (type.includes("game") && group === "hitting") {
      for (const s of splits.slice(-40)) {
        const g = mapHitGame(rec(s));
        if (g) hitGames.push(g);
      }
    } else if (type.includes("game") && group === "pitching") {
      for (const s of splits.slice(-8)) {
        const g = mapPitchGame(rec(s));
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
  }).slice(0, 5);

  const lastHit = hitGames[hitGames.length - 1];

  return {
    player: {
      ...player,
      bats: bat.description ? String(bat.description) : undefined,
      throws: throwH.description ? String(throwH.description) : undefined,
    },
    seasonHit,
    seasonPitch,
    recentHit: {
      last7: hitGames.length ? packHit(hitGames, 7) : undefined,
      last15: hitGames.length ? packHit(hitGames, 15) : undefined,
      last30: hitGames.length ? packHit(hitGames, 30) : undefined,
    },
    lastHitGames: lastN(hitGames, 5)
      .reverse()
      .map((g) => ({
        date: g.date,
        opponent: g.opponent,
        isHome: g.isHome,
        line: g.summary || `${g.hits}-${g.atBats}`,
      })),
    crazy,
    liveNote: lastHit
      ? `Last game ${lastHit.date} vs ${lastHit.opponent}${lastHit.summary ? ` — ${lastHit.summary}` : ""}`
      : undefined,
  };
}

function packHit(games: GameHit[], n: number) {
  const line = aggregateHits(lastN(games, n));
  return line.games > 0 ? line : undefined;
}
