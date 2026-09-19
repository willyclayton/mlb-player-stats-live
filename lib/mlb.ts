import { shiftEt, teamAbbrFromName, todayEt } from "./format";
import { generateCrazyStats, generateGameCrazyStats } from "./crazy-stats";
import { aggregateHits, hitFromApi, mostRecent, pitchFromApi } from "./stats";
import type {
  GameHit,
  GamePayload,
  GamePitch,
  GameSide,
  Heater,
  HomeGame,
  HomePayload,
  PlayerPayload,
  PlayerRef,
  TeamSide,
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
    teamAbbr: extras.teamAbbr ?? (team.abbreviation ? String(team.abbreviation) : teamName ? teamAbbrFromName(teamName) : undefined),
    position: String(pos.abbreviation ?? extras.position ?? ""),
    number: person.primaryNumber ? String(person.primaryNumber) : extras.number,
  };
}

function sideFromTeam(
  team: Record<string, unknown>,
  score: unknown,
): TeamSide {
  return {
    id: Number(team.id) || 0,
    name: String(team.name ?? "Team"),
    abbr: String(team.abbreviation ?? teamAbbrFromName(String(team.name ?? ""))),
    score: score != null ? Number(score) : undefined,
  };
}

function mapScheduleGame(game: Record<string, unknown>): HomeGame {
  const teams = rec(game.teams);
  const homeSide = rec(teams.home);
  const awaySide = rec(teams.away);
  const status = rec(game.status);
  return {
    gamePk: Number(game.gamePk),
    status: String(status.detailedState ?? status.abstractGameState ?? ""),
    abstractState: String(status.abstractGameState ?? ""),
    home: sideFromTeam(rec(homeSide.team), homeSide.score),
    away: sideFromTeam(rec(awaySide.team), awaySide.score),
  };
}

async function schedule(date: string): Promise<HomeGame[]> {
  const data = await mlb<{ dates?: { games?: Record<string, unknown>[] }[] }>(
    `/schedule?sportId=1&date=${date}&hydrate=team`,
    60,
  );
  return (data.dates?.[0]?.games ?? []).map(mapScheduleGame);
}

async function heaters(): Promise<Heater[]> {
  const query =
    `season=${SEASON}&sportId=1&playerPool=qualified&limit=4`;
  const [hit, pitch] = await Promise.all([
    mlb<{
      leagueLeaders?: {
        leaderCategory?: string;
        leaders?: { value?: string; person?: Record<string, unknown>; team?: Record<string, unknown> }[];
      }[];
    }>(
      `/stats/leaders?leaderCategories=homeRuns,onBasePlusSlugging,stolenBases&statGroup=hitting&${query}`,
      300,
    ),
    mlb<{
      leagueLeaders?: {
        leaderCategory?: string;
        leaders?: { value?: string; person?: Record<string, unknown>; team?: Record<string, unknown> }[];
      }[];
    }>(
      `/stats/leaders?leaderCategories=earnedRunAverage,strikeouts&statGroup=pitching&${query}`,
      300,
    ),
  ]);

  const out: Heater[] = [];
  const seen = new Set<number>();
  const order = Object.keys(LEADER_LABEL);
  const blocks = [...(hit.leagueLeaders ?? []), ...(pitch.leagueLeaders ?? [])].sort(
    (a, b) =>
      order.indexOf(String(a.leaderCategory ?? "")) -
      order.indexOf(String(b.leaderCategory ?? "")),
  );
  for (const block of blocks) {
    const label = LEADER_LABEL[String(block.leaderCategory ?? "")] ?? String(block.leaderCategory ?? "");
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
          teamAbbr: team.abbreviation ? String(team.abbreviation) : undefined,
        }),
        value: String(row.value ?? ""),
        label,
      });
      if (out.length >= 6) return out;
    }
  }
  return out;
}

export async function getHome(): Promise<HomePayload> {
  const today = todayEt();
  const [games, board] = await Promise.all([schedule(today), heaters()]);
  let slate = games;
  let slateLabel = "Today";

  if (slate.length === 0) {
    slate = await schedule(shiftEt(-1));
    slateLabel = "Last night";
  } else if (slate.some((g) => g.abstractState === "Live")) {
    slateLabel = "Live";
  } else if (slate.every((g) => g.abstractState === "Final")) {
    slateLabel = "Final";
  }

  return { asOf: today, slateLabel, games: slate, heaters: board };
}

export async function searchPlayers(query: string): Promise<PlayerRef[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await mlb<{ people?: Record<string, unknown>[] }>(
    `/people/search?names=${encodeURIComponent(q)}`,
    30,
  );
  return (data.people ?? [])
    .filter((p) => rec(p).active !== false)
    .map((p) => playerRef(p))
    .filter((p) => p.id)
    .slice(0, 8);
}

function playersFromLineup(
  list: unknown,
  team: TeamSide,
): PlayerRef[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((raw) =>
      playerRef(rec(raw), {
        team: team.name,
        teamId: team.id,
        teamAbbr: team.abbr,
      }),
    )
    .filter((p) => p.id);
}

function playersFromBox(
  boxSide: Record<string, unknown>,
  team: TeamSide,
): PlayerRef[] {
  const dict = rec(boxSide.players);
  const order = Array.isArray(boxSide.battingOrder)
    ? boxSide.battingOrder.map((id) => Number(id))
    : [];
  const out: PlayerRef[] = [];
  const seen = new Set<number>();

  const fromId = (id: number, fallbackPos?: string) => {
    if (!id || seen.has(id)) return;
    const row = rec(dict[`ID${id}`] ?? dict[String(id)]);
    const person = rec(row.person);
    if (!person.id) return;
    seen.add(id);
    out.push(
      playerRef(person, {
        team: team.name,
        teamId: team.id,
        teamAbbr: team.abbr,
        position: String(rec(row.position).abbreviation ?? fallbackPos ?? ""),
        number: row.jerseyNumber ? String(row.jerseyNumber) : undefined,
      }),
    );
  };

  for (const id of order) fromId(id);
  for (const id of Array.isArray(boxSide.pitchers) ? boxSide.pitchers : []) {
    fromId(Number(id), "P");
  }
  return out;
}

export async function getGame(gamePk: number): Promise<GamePayload> {
  const sched = await mlb<{ dates?: { games?: Record<string, unknown>[] }[] }>(
    `/schedule?gamePk=${gamePk}&hydrate=lineups,probablePitcher,team`,
    30,
  );
  const game = sched.dates?.[0]?.games?.[0];
  if (!game) throw new Error(`Game ${gamePk} not found`);

  const header = mapScheduleGame(game);
  const teams = rec(game.teams);
  const lineups = rec(game.lineups);
  const venue = rec(game.venue);

  const awayBase = header.away;
  const homeBase = header.home;
  let awayPlayers = playersFromLineup(lineups.awayPlayers, awayBase);
  let homePlayers = playersFromLineup(lineups.homePlayers, homeBase);

  const awayPitch = rec(rec(teams.away).probablePitcher);
  const homePitch = rec(rec(teams.home).probablePitcher);
  if (awayPitch.id) {
    awayPlayers = [
      playerRef(awayPitch, { ...awayBase, team: awayBase.name, position: "P" }),
      ...awayPlayers.filter((p) => p.id !== Number(awayPitch.id)),
    ];
  }
  if (homePitch.id) {
    homePlayers = [
      playerRef(homePitch, { ...homeBase, team: homeBase.name, position: "P" }),
      ...homePlayers.filter((p) => p.id !== Number(homePitch.id)),
    ];
  }

  if (header.abstractState !== "Preview") {
    try {
      const box = await mlb<{ teams?: { home?: Record<string, unknown>; away?: Record<string, unknown> } }>(
        `/game/${gamePk}/boxscore`,
        30,
      );
      const boxTeams = box.teams ?? {};
      if (boxTeams.away) awayPlayers = playersFromBox(boxTeams.away, awayBase);
      if (boxTeams.home) homePlayers = playersFromBox(boxTeams.home, homeBase);
    } catch {
      /* posted lineup is fine */
    }
  }

  const withSide = (base: TeamSide, players: PlayerRef[]): GameSide => ({
    ...base,
    players,
  });

  return {
    gamePk: header.gamePk,
    status: header.status,
    abstractState: header.abstractState,
    date: game.officialDate ? String(game.officialDate) : undefined,
    venue: venue.name ? String(venue.name) : undefined,
    away: withSide(awayBase, awayPlayers),
    home: withSide(homeBase, homePlayers),
  };
}

function mapHitGame(split: Record<string, unknown>): GameHit | null {
  if (split.gameType && split.gameType !== "R") return null;
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
  if (split.gameType && split.gameType !== "R") return null;
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

function usableHit(position: string | undefined, hit?: ReturnType<typeof hitFromApi>) {
  if (!hit) return undefined;
  if (position === "TWP") return hit;
  if ((position === "P" || position === "SP" || position === "RP") && hit.plateAppearances < 20) {
    return undefined;
  }
  return hit;
}

function usablePitch(position: string | undefined, pitch?: ReturnType<typeof pitchFromApi>) {
  if (!pitch) return undefined;
  if (position === "TWP") return pitch;
  const pitcher = position === "P" || position === "SP" || position === "RP";
  if (!pitcher && pitch.innings < 5) return undefined;
  return pitch;
}

async function lineFromBox(
  gamePk: number,
  playerId: number,
): Promise<{
  hit?: GameHit;
  pitch?: GamePitch;
  opponent: string;
  isHome: boolean;
  date?: string;
} | null> {
  const [box, sched] = await Promise.all([
    mlb<{ teams?: { home?: Record<string, unknown>; away?: Record<string, unknown> } }>(
      `/game/${gamePk}/boxscore`,
      30,
    ),
    mlb<{ dates?: { games?: Record<string, unknown>[] }[] }>(
      `/schedule?gamePk=${gamePk}&hydrate=team`,
      30,
    ),
  ]);
  const game = sched.dates?.[0]?.games?.[0];
  const header = game ? mapScheduleGame(game) : null;
  const date = game && game.officialDate ? String(game.officialDate) : undefined;

  for (const [side, boxSide] of [
    ["away", box.teams?.away],
    ["home", box.teams?.home],
  ] as const) {
    if (!boxSide) continue;
    const row = rec(rec(boxSide.players)[`ID${playerId}`]);
    const person = rec(row.person);
    if (Number(person.id) !== playerId) continue;
    const stats = rec(row.stats);
    const batting = rec(stats.batting);
    const pitching = rec(stats.pitching);
    const isHome = side === "home";
    const opponent = header ? (isHome ? header.away.name : header.home.name) : "Opp";
    const hit = Object.keys(batting).length ? hitFromApi(batting) : undefined;
    const pitch = Object.keys(pitching).length ? pitchFromApi(pitching) : undefined;
    return {
      hit: hit
        ? {
            ...hit,
            date: date ?? "",
            opponent,
            isHome,
            summary: batting.summary ? String(batting.summary) : undefined,
            leftOnBase: batting.leftOnBase != null ? Number(batting.leftOnBase) : undefined,
          }
        : undefined,
      pitch: pitch
        ? {
            ...pitch,
            date: date ?? "",
            opponent,
            isHome,
            summary: pitching.summary ? String(pitching.summary) : undefined,
          }
        : undefined,
      opponent,
      isHome,
      date,
    };
  }
  return header
    ? { opponent: header.away.name, isHome: true, date }
    : null;
}

export async function getPlayer(id: number, gamePk?: number): Promise<PlayerPayload> {
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
      for (const s of splits) {
        const g = mapHitGame(rec(s));
        if (g) hitGames.push(g);
      }
    } else if (type.includes("game") && group === "pitching") {
      for (const s of splits) {
        const g = mapPitchGame(rec(s));
        if (g) pitchGames.push(g);
      }
    }
  }

  const recentHits = mostRecent(hitGames, 40);
  const recentPitches = mostRecent(pitchGames, 10);
  const seasonHitUse = usableHit(player.position, seasonHit);
  const seasonPitchUse = usablePitch(player.position, seasonPitch);

  const seasonTakes = generateCrazyStats({
    name: player.name,
    nickname: player.nickname,
    team: player.team,
    position: player.position,
    seasonHit: seasonHitUse,
    seasonPitch: seasonPitchUse,
    hitGames: recentHits,
    pitchGames: recentPitches,
  })
    .filter((s) => s.id !== "last-game")
    .slice(0, 6);

  const lastHit = recentHits[recentHits.length - 1];
  const lastPitch = recentPitches[recentPitches.length - 1];
  const lastFive = mostRecent(recentHits, 5).reverse();

  const latestDate = [lastHit?.date, lastPitch?.date].filter(Boolean).sort().at(-1);
  let focusHit = lastHit && lastHit.date === latestDate ? lastHit : undefined;
  let focusPitch = lastPitch && lastPitch.date === latestDate ? lastPitch : undefined;
  let opponent = focusHit?.opponent ?? focusPitch?.opponent ?? "Opp";
  let isHome = focusHit?.isHome ?? focusPitch?.isHome ?? true;
  let gameDate = latestDate;
  let gameLabel = focusHit
    ? `${focusHit.isHome ? "vs" : "@"} ${focusHit.opponent}`
    : focusPitch
      ? `${focusPitch.isHome ? "vs" : "@"} ${focusPitch.opponent}`
      : "This game";

  if (gamePk) {
    const boxed = await lineFromBox(gamePk, id);
    if (boxed) {
      focusHit = boxed.hit;
      focusPitch = boxed.pitch;
      opponent = boxed.opponent;
      isHome = boxed.isHome;
      gameDate = boxed.date;
      gameLabel = `${isHome ? "vs" : "@"} ${opponent}`;
    }
  }

  const gameTakes = generateGameCrazyStats({
    name: player.name,
    nickname: player.nickname,
    opponent,
    isHome,
    date: gameDate,
    hit: focusHit,
    pitch: focusPitch,
    seasonHit: seasonHitUse,
    seasonPitch: seasonPitchUse,
  }).slice(0, 6);

  return {
    player: {
      ...player,
      bats: bat.description ? String(bat.description) : undefined,
      throws: throwH.description ? String(throwH.description) : undefined,
    },
    seasonHit: seasonHitUse,
    seasonPitch: seasonPitchUse,
    recentHit: {
      last7: recentHits.length ? packHit(recentHits, 7) : undefined,
      last15: recentHits.length ? packHit(recentHits, 15) : undefined,
      last30: recentHits.length ? packHit(recentHits, 30) : undefined,
    },
    lastHitGames: lastFive.map((g) => ({
      date: g.date,
      opponent: g.opponent,
      isHome: g.isHome,
      line: g.summary || `${g.hits}-${g.atBats}`,
    })),
    seasonTakes,
    gameTakes,
    gameLabel,
  };
}

function packHit(games: GameHit[], n: number) {
  const line = aggregateHits(mostRecent(games, n));
  return line.games > 0 ? line : undefined;
}
