import { shiftEt, shortTeamName, startEt, teamAbbrFromName, todayEt } from "./format";
import { appearanceIds, appearedIn } from "./lineup";
import { isLive, slateBlocks } from "./slate";
import { isTopTake, rareGameFeat } from "./top-stat";
import {
  generateCrazyStats,
  generateGameCrazyStats,
  type BoxMate,
  type TeamHitter,
} from "./crazy-stats";
import { aggregateHits, hitFromApi, mostRecent, pitchFromApi } from "./stats";
import type {
  GameHit,
  GamePayload,
  GamePitch,
  GameSide,
  HomeGame,
  HomePayload,
  PlayerPayload,
  PlayerRef,
  TeamSide,
  TopStatCard,
  YearLine,
} from "./types";

const MLB = "https://statsapi.mlb.com/api/v1";
const SEASON = 2026;

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
    topStat: extras.topStat,
  };
}

function featFromBoxRow(row: Record<string, unknown>): { feat: string; score: number } | null {
  const stats = rec(row.stats);
  const batting = rec(stats.batting);
  const pitching = rec(stats.pitching);
  const hit = Object.keys(batting).length ? hitFromApi(batting) : undefined;
  const pitch = Object.keys(pitching).length ? pitchFromApi(pitching) : undefined;
  const feat = rareGameFeat(hit, pitch);
  return feat ? { feat: feat.line, score: feat.score } : null;
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
    start: startEt(game.gameDate ? String(game.gameDate) : undefined),
    home: sideFromTeam(rec(homeSide.team), homeSide.score),
    away: sideFromTeam(rec(awaySide.team), awaySide.score),
  };
}

async function scheduleRange(start: string, end: string): Promise<{ date: string; games: HomeGame[] }[]> {
  const data = await mlb<{ dates?: { date?: string; games?: Record<string, unknown>[] }[] }>(
    `/schedule?sportId=1&startDate=${start}&endDate=${end}&hydrate=team`,
    30,
  );
  return (data.dates ?? []).map((day) => ({
    date: String(day.date ?? ""),
    games: (day.games ?? []).map(mapScheduleGame),
  }));
}

async function seasonRares(): Promise<TopStatCard[]> {
  const hydrate = encodeURIComponent(
    `currentTeam,stats(group=[hitting,pitching],type=[season],season=${SEASON})`,
  );
  const [board, twp] = await Promise.all([
    mlb<{ stats?: { splits?: Record<string, unknown>[] }[] }>(
      `/stats?stats=season&group=hitting&season=${SEASON}&sportIds=1&playerPool=qualified&limit=80`,
      300,
    ),
    mlb<{ people?: Record<string, unknown>[] }>(`/people/660271?hydrate=${hydrate}`, 300).catch(
      () => ({ people: [] }),
    ),
  ]);

  const out: TopStatCard[] = [];
  const seen = new Set<number>();

  for (const split of board.stats?.[0]?.splits ?? []) {
    const person = rec(split.player);
    const line = hitFromApi(rec(split.stat));
    const id = Number(person.id);
    if (!id || !line || line.homeRuns < 30 || line.stolenBases < 30) continue;
    const feat = line.homeRuns >= 40 && line.stolenBases >= 40 ? "40-40" : "30-30";
    const team = rec(split.team);
    seen.add(id);
    out.push({
      ...playerRef(person, {
        team: team.name ? String(team.name) : undefined,
        teamId: team.id ? Number(team.id) : undefined,
        teamAbbr: team.abbreviation ? String(team.abbreviation) : teamAbbrFromName(String(team.name ?? "")),
        topStat: feat,
      }),
      feat,
      scope: "season",
    });
  }

  const ohtani = twp.people?.[0];
  if (ohtani) {
    const player = playerRef(ohtani);
    let seasonHit;
    let seasonPitch;
    for (const raw of (ohtani.stats as unknown[] | undefined) ?? []) {
      const block = rec(raw);
      const group = String(rec(block.group).displayName ?? "").toLowerCase();
      const type = String(rec(block.type).displayName ?? "").toLowerCase();
      const splits = Array.isArray(block.splits) ? block.splits : [];
      if (type.includes("season") && group === "hitting") {
        seasonHit = hitFromApi(rec(rec(splits[0]).stat));
      } else if (type.includes("season") && group === "pitching") {
        seasonPitch = pitchFromApi(rec(rec(splits[0]).stat));
      }
    }
    if (
      !seen.has(player.id) &&
      seasonHit &&
      seasonPitch &&
      (player.position === "TWP" || (seasonHit.homeRuns >= 10 && seasonPitch.innings >= 20))
    ) {
      out.push({
        ...player,
        topStat: "Two-way",
        feat: "Two-way",
        scope: "season",
      });
    }
  }

  return out;
}

export async function getHome(): Promise<HomePayload> {
  const today = todayEt();
  const yesterday = shiftEt(-1);
  const tomorrow = shiftEt(1);
  const [days, seasonTop] = await Promise.all([
    scheduleRange(yesterday, tomorrow),
    seasonRares(),
  ]);
  const byDate = new Map(days.map((day) => [day.date, day.games]));
  const blocks = slateBlocks({
    yesterday: byDate.get(yesterday) ?? [],
    today: byDate.get(today) ?? [],
    tomorrow: byDate.get(tomorrow) ?? [],
  });
  const marked = await markTopOnBoard(blocks.flatMap((block) => block.games));
  const byPk = new Map(marked.games.map((game) => [game.gamePk, game]));

  return {
    asOf: today,
    blocks: blocks.map((block) => ({
      ...block,
      games: block.games.map((game) => byPk.get(game.gamePk) ?? game),
    })),
    top: [...marked.top, ...seasonTop],
  };
}

export async function searchPlayers(query: string, gamePk?: number): Promise<PlayerRef[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (gamePk) {
    const game = await getGame(gamePk);
    const needle = q.toLowerCase();
    return [...game.away.players, ...game.home.players]
      .filter((player) => player.name.toLowerCase().includes(needle))
      .slice(0, 8);
  }
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
  const out: PlayerRef[] = [];

  for (const id of appearanceIds(boxSide)) {
    const row = rec(dict[`ID${id}`] ?? dict[String(id)]);
    const person = rec(row.person);
    if (!person.id) continue;
    const found = featFromBoxRow(row);
    const pitcher = Array.isArray(boxSide.pitchers) && boxSide.pitchers.map(Number).includes(id);
    out.push(
      playerRef(person, {
        team: team.name,
        teamId: team.id,
        teamAbbr: team.abbr,
        position: String(rec(row.position).abbreviation ?? (pitcher ? "P" : "")),
        number: row.jerseyNumber ? String(row.jerseyNumber) : undefined,
        topStat: found?.feat,
      }),
    );
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
      const awayBox = boxTeams.away ? playersFromBox(boxTeams.away, awayBase) : [];
      const homeBox = boxTeams.home ? playersFromBox(boxTeams.home, homeBase) : [];
      if (awayBox.length) awayPlayers = awayBox;
      if (homeBox.length) homePlayers = homeBox;
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

function matesFromBox(
  boxSide: Record<string, unknown>,
  skipId: number,
): BoxMate[] {
  const dict = rec(boxSide.players);
  const out: BoxMate[] = [];
  for (const id of appearanceIds(boxSide)) {
    if (id === skipId) continue;
    const row = rec(dict[`ID${id}`] ?? dict[String(id)]);
    const person = rec(row.person);
    if (!person.id) continue;
    const batting = rec(rec(row.stats).batting);
    const hit = Object.keys(batting).length ? hitFromApi(batting) : undefined;
    if (hit) out.push({ id, name: String(person.fullName ?? person.name ?? ""), hit });
  }
  return out;
}

async function getTeamHitters(teamId: number): Promise<TeamHitter[]> {
  const data = await mlb<{ stats?: { splits?: Record<string, unknown>[] }[] }>(
    `/stats?stats=season&group=hitting&season=${SEASON}&teamId=${teamId}&sportIds=1&playerPool=all&limit=40`,
    180,
  );
  const out: TeamHitter[] = [];
  for (const split of data.stats?.[0]?.splits ?? []) {
    const person = rec(split.player);
    const line = hitFromApi(rec(split.stat));
    if (!person.id || !line) continue;
    out.push({
      id: Number(person.id),
      name: String(person.fullName ?? ""),
      line,
    });
  }
  return out;
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
  mates: BoxMate[];
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
    if (!appearedIn(boxSide, playerId)) continue;
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
      mates: matesFromBox(boxSide, playerId),
    };
  }
  return null;
}

function yearFromSplits(
  blocks: { group?: { displayName?: string }; splits?: Record<string, unknown>[] }[] | undefined,
): YearLine[] {
  const byYear = new Map<number, YearLine>();
  for (const block of blocks ?? []) {
    const group = String(block.group?.displayName ?? "").toLowerCase();
    for (const split of block.splits ?? []) {
      const year = Number(rec(split).season);
      if (!Number.isFinite(year) || year < 1900) continue;
      const combined = Number(rec(split).numTeams) >= 2 || !rec(split).team;
      const existing = byYear.get(year) ?? { year };
      if (group === "hitting") {
        if (existing.hit && !combined) continue;
        const line = hitFromApi(rec(rec(split).stat));
        if (line) existing.hit = line;
      } else if (group === "pitching") {
        if (existing.pitch && !combined) continue;
        const line = pitchFromApi(rec(rec(split).stat));
        if (line) existing.pitch = line;
      }
      byYear.set(year, existing);
    }
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

async function getYearLines(id: number): Promise<YearLine[]> {
  const data = await mlb<{
    stats?: { group?: { displayName?: string }; splits?: Record<string, unknown>[] }[];
  }>(`/people/${id}/stats?stats=yearByYear&group=hitting,pitching`, 300);
  return yearFromSplits(data.stats);
}

async function getHitLog(id: number, season: number): Promise<GameHit[]> {
  const data = await mlb<{ stats?: { splits?: Record<string, unknown>[] }[] }>(
    `/people/${id}/stats?stats=gameLog&group=hitting&season=${season}&gameType=R`,
    120,
  );
  const out: GameHit[] = [];
  for (const split of data.stats?.[0]?.splits ?? []) {
    const g = mapHitGame(rec(split));
    if (g) out.push(g);
  }
  return out;
}

export async function getPlayer(id: number, gamePk?: number): Promise<PlayerPayload> {
  const hydrate = `currentTeam,stats(group=[hitting,pitching],type=[season,gameLog],season=${SEASON})`;
  const [data, priorHits, boxedEarly, years] = await Promise.all([
    mlb<{ people?: Record<string, unknown>[] }>(
      `/people/${id}?hydrate=${encodeURIComponent(hydrate)}`,
      45,
    ),
    getHitLog(id, SEASON - 1).catch(() => [] as GameHit[]),
    gamePk ? lineFromBox(gamePk, id) : Promise.resolve(null),
    getYearLines(id).catch(() => [] as YearLine[]),
  ]);
  const person = data.people?.[0];
  if (!person) throw new Error(`Player ${id} not found`);

  const player = playerRef(person);
  const bat = rec(person.batSide);
  const throwH = rec(person.pitchHand);
  const teamHitters = player.teamId ? await getTeamHitters(player.teamId).catch(() => [] as TeamHitter[]) : [];
  const boxed = boxedEarly;

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
  for (const g of priorHits) hitGames.push(g);

  const seasonHits = hitGames.filter((g) => g.date.startsWith(String(SEASON)));
  const recentHits = mostRecent(seasonHits, 40);
  const recentPitches = mostRecent(pitchGames, 10);
  const seasonHitUse = usableHit(player.position, seasonHit);
  const seasonPitchUse = usablePitch(player.position, seasonPitch);

  const seasonTakes = generateCrazyStats({
    id: player.id,
    name: player.name,
    team: player.team,
    position: player.position,
    seasonHit: seasonHitUse,
    seasonPitch: seasonPitchUse,
    hitGames,
    pitchGames: recentPitches,
    teamHitters,
    years,
  }).slice(0, 6);

  const lastHit = recentHits[recentHits.length - 1];
  const lastPitch = recentPitches[recentPitches.length - 1];
  const lastFive = mostRecent(recentHits, 5).reverse();

  const latestDate = [lastHit?.date, lastPitch?.date].filter(Boolean).sort().at(-1);
  let focusHit = lastHit && lastHit.date === latestDate ? lastHit : undefined;
  let focusPitch = lastPitch && lastPitch.date === latestDate ? lastPitch : undefined;
  let opponent = focusHit?.opponent ?? focusPitch?.opponent ?? "Opp";
  let isHome = focusHit?.isHome ?? focusPitch?.isHome ?? true;
  let gameDate = latestDate;
  const vsLabel = (home: boolean, opp: string) =>
    `${home ? "vs" : "@"} ${shortTeamName(opp) || opp}`;
  let gameLabel = focusHit
    ? vsLabel(focusHit.isHome, focusHit.opponent)
    : focusPitch
      ? vsLabel(focusPitch.isHome, focusPitch.opponent)
      : "This game";

  let mates: BoxMate[] = [];
  if (boxed) {
    focusHit = boxed.hit;
    focusPitch = boxed.pitch;
    opponent = boxed.opponent;
    isHome = boxed.isHome;
    gameDate = boxed.date;
    gameLabel = vsLabel(isHome, opponent);
    mates = boxed.mates;
  }

  const gameTakes = generateGameCrazyStats({
    id: player.id,
    name: player.name,
    team: player.team,
    opponent,
    isHome,
    date: gameDate,
    hit: focusHit,
    pitch: focusPitch,
    seasonHit: seasonHitUse,
    seasonPitch: seasonPitchUse,
    hitGames,
    pitchGames: recentPitches,
    mates,
  }).slice(0, 6);

  const boxedFeat = rareGameFeat(focusHit, focusPitch);
  const topTake = [...gameTakes, ...seasonTakes].find(isTopTake);

  return {
    player: {
      ...player,
      bats: bat.description ? String(bat.description) : undefined,
      throws: throwH.description ? String(throwH.description) : undefined,
      topStat: boxedFeat?.line ?? topTake?.stamp,
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

async function markTopOnBoard(games: HomeGame[]): Promise<{
  top: TopStatCard[];
  games: HomeGame[];
}> {
  const playable = games.filter((game) => isLive(game) || game.abstractState === "Final");
  const live = playable.filter(isLive);
  const rest = playable.filter((game) => !isLive(game));
  const scan = [...live, ...rest];
  if (!scan.length) return { top: [], games };

  const boxes = await Promise.all(
    scan.map(async (game) => {
      try {
        const box = await mlb<{
          teams?: { home?: Record<string, unknown>; away?: Record<string, unknown> };
        }>(`/game/${game.gamePk}/boxscore`, 30);
        return { game, box };
      } catch {
        return { game, box: null };
      }
    }),
  );

  const cards: { card: TopStatCard; score: number }[] = [];
  const namesByGame = new Map<number, string[]>();

  for (const { game, box } of boxes) {
    if (!box?.teams) continue;
    for (const [sideKey, team] of [
      ["away", game.away],
      ["home", game.home],
    ] as const) {
      const boxSide = box.teams[sideKey];
      if (!boxSide) continue;
      for (const raw of Object.values(rec(boxSide.players))) {
        const row = rec(raw);
        const person = rec(row.person);
        if (!person.id) continue;
        const found = featFromBoxRow(row);
        if (!found) continue;
        const card: TopStatCard = {
          ...playerRef(person, {
            team: team.name,
            teamId: team.id,
            teamAbbr: team.abbr,
            topStat: found.feat,
          }),
          feat: found.feat,
          gamePk: game.gamePk,
          scope: "game",
        };
        cards.push({ card, score: found.score });
        const names = namesByGame.get(game.gamePk) ?? [];
        names.push(card.name);
        namesByGame.set(game.gamePk, names);
      }
    }
  }

  cards.sort((a, b) => b.score - a.score);

  return {
    top: cards.map((row) => row.card),
    games: games.map((game) =>
      namesByGame.has(game.gamePk)
        ? { ...game, topPlayer: namesByGame.get(game.gamePk)?.join(", ") }
        : game,
    ),
  };
}
