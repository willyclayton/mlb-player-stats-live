import type { GameHit, GamePitch, HitLine, PitchLine } from "./types";
import { num, parseInnings, parseRate } from "./format";

export function emptyHit(): HitLine {
  return {
    games: 0,
    plateAppearances: 0,
    atBats: 0,
    runs: 0,
    hits: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    rbi: 0,
    stolenBases: 0,
    caughtStealing: 0,
    walks: 0,
    strikeOuts: 0,
    avg: 0,
    obp: 0,
    slg: 0,
    ops: 0,
    totalBases: 0,
    hitByPitch: 0,
  };
}

export function emptyPitch(): PitchLine {
  return {
    games: 0,
    gamesStarted: 0,
    wins: 0,
    losses: 0,
    saves: 0,
    innings: 0,
    hits: 0,
    runs: 0,
    earnedRuns: 0,
    homeRuns: 0,
    walks: 0,
    strikeOuts: 0,
    era: 0,
    whip: 0,
    kPer9: 0,
    bbPer9: 0,
    hrPer9: 0,
    kBb: 0,
    opponentAvg: 0,
  };
}

export function hitFromApi(stat: Record<string, unknown> | undefined): HitLine | undefined {
  if (!stat) return undefined;
  const games = num(stat.gamesPlayed);
  const atBats = num(stat.atBats);
  if (games === 0 && atBats === 0 && num(stat.plateAppearances) === 0) return undefined;
  const avg = parseRate(stat.avg);
  const obp = parseRate(stat.obp);
  const slg = parseRate(stat.slg);
  const ops = parseRate(stat.ops) || avg + (obp && slg ? 0 : 0) || obp + slg;
  return {
    games,
    plateAppearances: num(stat.plateAppearances),
    atBats,
    runs: num(stat.runs),
    hits: num(stat.hits),
    doubles: num(stat.doubles),
    triples: num(stat.triples),
    homeRuns: num(stat.homeRuns),
    rbi: num(stat.rbi),
    stolenBases: num(stat.stolenBases),
    caughtStealing: num(stat.caughtStealing),
    walks: num(stat.baseOnBalls),
    strikeOuts: num(stat.strikeOuts),
    avg,
    obp,
    slg,
    ops: parseRate(stat.ops) || obp + slg,
    babip: stat.babip != null ? parseRate(stat.babip) : undefined,
    totalBases: num(stat.totalBases),
    hitByPitch: num(stat.hitByPitch),
  };
}

export function pitchFromApi(stat: Record<string, unknown> | undefined): PitchLine | undefined {
  if (!stat) return undefined;
  const innings = parseInnings(stat.inningsPitched);
  const games = num(stat.gamesPitched ?? stat.gamesPlayed);
  if (games === 0 && innings === 0) return undefined;
  const walks = num(stat.baseOnBalls);
  const strikeOuts = num(stat.strikeOuts);
  return {
    games,
    gamesStarted: num(stat.gamesStarted),
    wins: num(stat.wins),
    losses: num(stat.losses),
    saves: num(stat.saves),
    innings,
    hits: num(stat.hits),
    runs: num(stat.runs),
    earnedRuns: num(stat.earnedRuns),
    homeRuns: num(stat.homeRuns),
    walks,
    strikeOuts,
    era: parseRate(stat.era),
    whip: parseRate(stat.whip),
    kPer9: parseRate(stat.strikeoutsPer9Inn),
    bbPer9: parseRate(stat.walksPer9Inn),
    hrPer9: parseRate(stat.homeRunsPer9),
    kBb: parseRate(stat.strikeoutWalkRatio) || (walks > 0 ? strikeOuts / walks : strikeOuts),
    opponentAvg: parseRate(stat.avg),
  };
}

function finishHit(line: HitLine): HitLine {
  const ab = line.atBats;
  const pa = line.plateAppearances || ab + line.walks + line.hitByPitch;
  const avg = ab > 0 ? line.hits / ab : 0;
  const onBase = line.hits + line.walks + line.hitByPitch;
  const obp = pa > 0 ? onBase / pa : 0;
  const slg = ab > 0 ? line.totalBases / ab : 0;
  return { ...line, plateAppearances: pa, avg, obp, slg, ops: obp + slg };
}

function finishPitch(line: PitchLine): PitchLine {
  const ip = line.innings;
  return {
    ...line,
    era: ip > 0 ? (line.earnedRuns * 9) / ip : 0,
    whip: ip > 0 ? (line.hits + line.walks) / ip : 0,
    kPer9: ip > 0 ? (line.strikeOuts * 9) / ip : 0,
    bbPer9: ip > 0 ? (line.walks * 9) / ip : 0,
    hrPer9: ip > 0 ? (line.homeRuns * 9) / ip : 0,
    kBb: line.walks > 0 ? line.strikeOuts / line.walks : line.strikeOuts,
    opponentAvg: 0,
  };
}

export function aggregateHits(games: GameHit[]): HitLine {
  const line = emptyHit();
  for (const g of games) {
    if (g.atBats + g.plateAppearances + g.walks === 0 && g.hits === 0) continue;
    line.games += 1;
    line.plateAppearances += g.plateAppearances;
    line.atBats += g.atBats;
    line.runs += g.runs;
    line.hits += g.hits;
    line.doubles += g.doubles;
    line.triples += g.triples;
    line.homeRuns += g.homeRuns;
    line.rbi += g.rbi;
    line.stolenBases += g.stolenBases;
    line.caughtStealing += g.caughtStealing;
    line.walks += g.walks;
    line.strikeOuts += g.strikeOuts;
    line.totalBases += g.totalBases || g.hits + g.doubles + 2 * g.triples + 3 * g.homeRuns;
    line.hitByPitch += g.hitByPitch;
  }
  return finishHit(line);
}

export function aggregatePitches(games: GamePitch[]): PitchLine {
  const line = emptyPitch();
  for (const g of games) {
    if (g.innings === 0 && g.games === 0) continue;
    line.games += 1;
    line.gamesStarted += g.gamesStarted > 0 ? 1 : 0;
    line.wins += g.wins;
    line.losses += g.losses;
    line.saves += g.saves;
    line.innings += g.innings;
    line.hits += g.hits;
    line.runs += g.runs;
    line.earnedRuns += g.earnedRuns;
    line.homeRuns += g.homeRuns;
    line.walks += g.walks;
    line.strikeOuts += g.strikeOuts;
  }
  return finishPitch(line);
}

export function lastN<T>(items: T[], n: number): T[] {
  if (n <= 0) return [];
  return items.slice(-n);
}

export function hittingStreak(games: GameHit[]): number {
  let streak = 0;
  for (let i = games.length - 1; i >= 0; i--) {
    const g = games[i];
    if (g.atBats <= 0 && g.plateAppearances <= 0) continue;
    if (g.hits > 0) streak += 1;
    else break;
  }
  return streak;
}

export function homerStreak(games: GameHit[]): number {
  let streak = 0;
  for (let i = games.length - 1; i >= 0; i--) {
    const g = games[i];
    if (g.atBats <= 0 && g.plateAppearances <= 0) continue;
    if (g.homeRuns > 0) streak += 1;
    else break;
  }
  return streak;
}

export function scorelessStarts(games: GamePitch[]): number {
  let streak = 0;
  for (let i = games.length - 1; i >= 0; i--) {
    const g = games[i];
    if (g.innings <= 0) continue;
    if (g.earnedRuns === 0) streak += 1;
    else break;
  }
  return streak;
}

export function multiHitGames(games: GameHit[]): number {
  return games.filter((g) => g.hits >= 2).length;
}

export function iso(line: HitLine): number {
  return Math.max(0, line.slg - line.avg);
}

export function isPitcherPos(position?: string): boolean {
  if (!position) return false;
  return ["P", "SP", "RP", "LHP", "RHP"].includes(position);
}

export function isTwoWay(position?: string, hit?: HitLine, pitch?: PitchLine): boolean {
  if (position === "TWP") return true;
  const bats = (hit?.plateAppearances ?? 0) >= 40 || (hit?.homeRuns ?? 0) >= 3;
  const throws = (pitch?.innings ?? 0) >= 10;
  return bats && throws;
}
