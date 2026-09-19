import { writeCareerFacts } from "./fact-writer";
import { rankFacts } from "./fact-ranker";
import { fmtAvg, fmtEra, fmtIp, slash, prettyDate, shortTeamName } from "./format";
import { aggregateHits, hittingStreak, homerStreak, lastN } from "./stats";
import type { CrazyStat, GameHit, GamePitch, HitLine, PitchLine, YearLine } from "./types";

export type TeamHitter = { id: number; name: string; line: HitLine };
export type BoxMate = { id: number; name: string; hit?: HitLine };

const SEASON = 2026;

type Input = {
  id?: number;
  name: string;
  team?: string;
  position?: string;
  seasonHit?: HitLine;
  seasonPitch?: PitchLine;
  hitGames: GameHit[];
  pitchGames: GamePitch[];
  teamHitters?: TeamHitter[];
  years?: YearLine[];
};

type GameInput = {
  id?: number;
  name: string;
  team?: string;
  opponent: string;
  isHome: boolean;
  date?: string;
  hit?: HitLine & { summary?: string; leftOnBase?: number };
  pitch?: PitchLine & { summary?: string };
  seasonHit?: HitLine;
  seasonPitch?: PitchLine;
  hitGames?: GameHit[];
  pitchGames?: GamePitch[];
  mates?: BoxMate[];
};

function take(
  partial: Omit<CrazyStat, "score"> & { score: number },
): CrazyStat {
  return partial;
}

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  while (
    parts.length > 1 &&
    /^(jr|sr|ii|iii|iv|v)[.]?$/i.test(parts[parts.length - 1] ?? "")
  ) {
    parts.pop();
  }
  return parts[parts.length - 1] || name;
}

function club(team?: string): string {
  if (!team) return "the team";
  if (team.includes("White Sox")) return "White Sox";
  if (team.includes("Red Sox")) return "Red Sox";
  if (team.includes("Blue Jays")) return "Blue Jays";
  return team.split(" ").pop() || team;
}

function vsOpp(isHome: boolean, opponent: string): string {
  const name = shortTeamName(opponent) || opponent;
  return `${isHome ? "vs" : "@"} ${name}`;
}

function factDate(iso?: string): string {
  if (!iso) return "";
  const label = prettyDate(iso);
  return iso.startsWith(String(SEASON)) ? label : `${label}, ${iso.slice(0, 4)}`;
}

function boxLine(hit: { summary?: string; hits: number; atBats: number }): string {
  return hit.summary || `${hit.hits}-${hit.atBats}`;
}

function lastMatch<T extends { date: string }>(
  games: T[],
  pred: (g: T) => boolean,
  before?: string,
): T | undefined {
  return [...games]
    .filter((g) => (!before || g.date < before) && pred(g))
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
}

function since(prev: GameHit | undefined, feat: string): string {
  if (!prev) return `First ${feat} in the last two seasons.`;
  return `First since ${factDate(prev.date)}.`;
}

function sincePitch(prev: GamePitch | undefined, feat: string): string {
  if (!prev) return `First ${feat} in the last two seasons.`;
  return `First since ${factDate(prev.date)}.`;
}

function lastHrLine(g: GameHit): string {
  return `Last HR ${factDate(g.date)} ${vsOpp(g.isHome, g.opponent)}`;
}

function lastMultiLine(g: GameHit): string {
  return `Last multi-hit ${factDate(g.date)} ${vsOpp(g.isHome, g.opponent)}`;
}

function lastMultiFoot(g: GameHit): string {
  return `Last multi-hit ${factDate(g.date)}.`;
}

function isOhfer(g: { hits: number; atBats: number }, ab = 4): boolean {
  return g.hits === 0 && g.atBats >= ab;
}

function daysBetween(from?: string, to?: string): number {
  if (!from || !to) return 999;
  const ms = Date.parse(to) - Date.parse(from);
  if (!Number.isFinite(ms)) return 999;
  return Math.round(ms / 86_400_000);
}

function dayReceipt(prev: { date: string } | undefined, date?: string) {
  if (!prev || !date) return [] as { label: string; value: string }[];
  return [{ label: "Days", value: String(daysBetween(prev.date, date)) }];
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function rankOnTeam(team: TeamHitter[], id: number, key: keyof HitLine) {
  const ordered = [...team].sort((a, b) => Number(b.line[key]) - Number(a.line[key]));
  const place = ordered.findIndex((p) => p.id === id);
  if (place < 0) return null;
  return { place: place + 1, next: ordered[place + 1], lead: ordered[0] };
}

function gapBack(name: string, gap: number, label: string): string {
  if (gap <= 0) return `${name} is tied in ${label}.`;
  return `${name} is ${gap} back in ${label}.`;
}

export function generateCrazyStats(input: Input): CrazyStat[] {
  const stats: CrazyStat[] = [];
  const team = club(input.team);
  const hit = input.seasonHit;
  const pitch = input.seasonPitch;
  const seasonGames = input.hitGames
    .filter((g) => g.date.startsWith(String(SEASON)))
    .sort((a, b) => a.date.localeCompare(b.date));
  const last15 = seasonGames.length ? aggregateHits(lastN(seasonGames, 15)) : undefined;
  const teamHitters = input.teamHitters ?? [];
  const id = input.id ?? 0;

  if (hit && pitch && (input.position === "TWP" || (hit.homeRuns >= 10 && pitch.innings >= 20))) {
    stats.push(
      take({
        id: "two-way",
        score: 98,
        stamp: "TWO-WAY",
        category: "two-way",
        headline: `${slash(hit)}, ${hit.homeRuns} HR and a ${fmtEra(pitch.era)} ERA`,
        body: `${hit.homeRuns} HR and ${fmtIp(pitch.innings)} IP, ${pitch.strikeOuts} K.`,
        receipts: [
          { label: "Slash", value: slash(hit) },
          { label: "HR", value: String(hit.homeRuns) },
          { label: "ERA", value: fmtEra(pitch.era) },
          { label: "IP", value: fmtIp(pitch.innings) },
        ],
      }),
    );
  }

  if (hit && hit.homeRuns >= 30 && hit.stolenBases >= 30) {
    const clubLabel = hit.homeRuns >= 40 && hit.stolenBases >= 40 ? "40-40" : "30-30";
    const bar = clubLabel === "40-40" ? 40 : 30;
    const same = teamHitters.filter(
      (p) => p.line.homeRuns >= bar && p.line.stolenBases >= bar,
    );
    const others = same.filter((p) => p.id !== id);
    const body = others.length
      ? `Also ${others
          .map((p) => `${lastName(p.name)} (${p.line.homeRuns} HR, ${p.line.stolenBases} SB)`)
          .join("; ")}.`
      : teamHitters.length
        ? `Only ${team} player in a ${clubLabel} season.`
        : `${clubLabel} season.`;
    stats.push(
      take({
        id: "club-20-20",
        score: clubLabel === "40-40" ? 96 : 90,
        stamp: clubLabel,
        category: "rare",
        headline: `${hit.homeRuns} HR and ${hit.stolenBases} SB this season`,
        body,
        receipts: [
          { label: "HR", value: String(hit.homeRuns) },
          { label: "SB", value: String(hit.stolenBases) },
          { label: "OPS", value: hit.ops.toFixed(3).replace(/^0/, "") },
        ],
      }),
    );
  }

  if (hit && id && teamHitters.length) {
    const hr = rankOnTeam(teamHitters, id, "homeRuns");
    const sb = rankOnTeam(teamHitters, id, "stolenBases");
    const rbi = rankOnTeam(teamHitters, id, "rbi");
    const leadsHr = Boolean(
      hr?.place === 1 && hit.homeRuns >= 1 && (!hr.next || hit.homeRuns > hr.next.line.homeRuns),
    );
    const leadsSb = Boolean(
      sb?.place === 1 &&
        hit.stolenBases >= 1 &&
        (!sb.next || hit.stolenBases > sb.next.line.stolenBases),
    );
    const leadsRbi = Boolean(
      rbi?.place === 1 && hit.rbi >= 1 && (!rbi.next || hit.rbi > rbi.next.line.rbi),
    );
    const leads = [
      leadsHr ? "HR" : null,
      leadsSb ? "SB" : null,
      leadsRbi ? "RBI" : null,
    ].filter(Boolean) as string[];
    if (leads.length) {
      const gaps = [
        leadsHr && hr?.next
          ? { name: lastName(hr.next.name), gap: hit.homeRuns - hr.next.line.homeRuns, label: "HR" }
          : null,
        leadsSb && sb?.next
          ? {
              name: lastName(sb.next.name),
              gap: hit.stolenBases - sb.next.line.stolenBases,
              label: "SB",
            }
          : null,
        leadsRbi && rbi?.next
          ? { name: lastName(rbi.next.name), gap: hit.rbi - rbi.next.line.rbi, label: "RBI" }
          : null,
      ].filter(Boolean) as { name: string; gap: number; label: string }[];
      const pick =
        gaps.find((g) => g.label === "HR") ??
        gaps.find((g) => g.label === "SB") ??
        gaps[0];
      const next = pick ? gapBack(pick.name, pick.gap, pick.label) : "";
      stats.push(
        take({
          id: "team-lead",
          score: 70 + leads.length * 8,
          stamp: slash(hit),
          category: "rare",
          headline: `${slash(hit)}, ${hit.homeRuns} HR, ${hit.rbi} RBI`,
          body: next || `Leads the ${team} in ${joinList(leads)}.`,
          receipts: [
            { label: "AVG", value: fmtAvg(hit.avg) },
            { label: "HR", value: String(hit.homeRuns) },
            { label: "RBI", value: String(hit.rbi) },
            { label: "Leads", value: String(leads.length) },
          ],
        }),
      );
    }

    const chase =
      hr?.place === 2 && hit.homeRuns >= 15 && hr.lead && hr.lead.id !== id
        ? {
            label: "HR",
            place: hr.place,
            lead: hr.lead,
            gap: hr.lead.line.homeRuns - hit.homeRuns,
            mine: hit.homeRuns,
          }
        : sb?.place === 2 && hit.stolenBases >= 15 && sb.lead && sb.lead.id !== id
          ? {
              label: "SB",
              place: sb.place,
              lead: sb.lead,
              gap: sb.lead.line.stolenBases - hit.stolenBases,
              mine: hit.stolenBases,
            }
          : rbi?.place === 2 && hit.rbi >= 50 && rbi.lead && rbi.lead.id !== id
            ? {
                label: "RBI",
                place: rbi.place,
                lead: rbi.lead,
                gap: rbi.lead.line.rbi - hit.rbi,
                mine: hit.rbi,
              }
            : null;
    if (chase && chase.gap > 0) {
      stats.push(
        take({
          id: "team-chase",
          score: 58,
          stamp: `2ND ${chase.label}`,
          category: "rare",
          headline: `${chase.mine} ${chase.label}, 2nd on the ${team}`,
          body: `${lastName(chase.lead.name)} is ${chase.gap} ahead.`,
          receipts: [{ label: chase.label, value: String(chase.mine) }],
        }),
      );
    }
  }

  const streak = hittingStreak(seasonGames);
  if (streak >= 8) {
    const start = seasonGames.slice(-streak)[0];
    stats.push(
      take({
        id: "hit-streak",
        score: 40 + streak * 4,
        stamp: `${streak}-GAME STREAK`,
        category: "streak",
        headline: `Hit in ${streak} straight games`,
        body: start
          ? `Since ${factDate(start.date)} ${vsOpp(start.isHome, start.opponent)}.`
          : `Hit in each of the last ${streak} games.`,
        receipts: [{ label: "Streak", value: `${streak} G` }],
      }),
    );
  }

  const hrStreak = homerStreak(seasonGames);
  if (hrStreak >= 2) {
    stats.push(
      take({
        id: "hr-streak",
        score: 62 + hrStreak * 6,
        stamp: `${hrStreak}-HR STREAK`,
        category: "power",
        headline: `HR in ${hrStreak} straight games`,
        body: `${hrStreak} games in a row with a home run.`,
        receipts: [{ label: "Streak", value: `${hrStreak} G` }],
      }),
    );
  }

  if (hit && last15 && last15.atBats >= 25) {
    const delta = last15.ops - hit.ops;
    if (Math.abs(delta) >= 0.12) {
      const pts = Math.round(delta * 1000);
      stats.push(
        take({
          id: "heater-15",
          score: 50 + Math.round(Math.abs(delta) * 80),
          stamp: "LAST 15",
          category: "split",
          headline: `Last 15: ${slash(last15)}`,
          body: `OPS ${last15.ops.toFixed(3)} vs season ${hit.ops.toFixed(3)} (${pts >= 0 ? "+" : ""}${pts}).`,
          receipts: [
            { label: "L15 OPS", value: last15.ops.toFixed(3) },
            { label: "Season", value: hit.ops.toFixed(3) },
            { label: "L15 HR", value: String(last15.homeRuns) },
          ],
        }),
      );
    }
  }

  const multiHr = seasonGames.filter((g) => g.homeRuns >= 2);
  if (multiHr.length >= 2) {
    const last = multiHr.at(-1);
    stats.push(
      take({
        id: "multi-hr-season",
        score: 54 + multiHr.length * 4,
        stamp: "MULTI-HR",
        category: "power",
        headline: `${multiHr.length} multi-homer games this season`,
        body: last ? `Last: ${factDate(last.date)} ${vsOpp(last.isHome, last.opponent)}.` : "",
        receipts: [{ label: "Games", value: String(multiHr.length) }],
      }),
    );
  }

  const lastHr = lastMatch(input.hitGames, (g) => g.homeRuns >= 1);
  const lastMulti = lastMatch(input.hitGames, (g) => g.hits >= 2);

  if (pitch && pitch.innings >= 20) {
    const hotEra = pitch.era > 0 && pitch.era <= 3;
    const punch = pitch.kPer9 >= 10 || pitch.strikeOuts >= 150;
    const tight = pitch.whip > 0 && pitch.whip <= 1.05;
    if (hotEra || punch || tight) {
      stats.push(
        take({
          id: "pitch-line",
          score: hotEra ? 84 : 62,
          stamp: "PITCHING",
          category: "pitching",
          headline: `${fmtEra(pitch.era)} ERA, ${pitch.whip.toFixed(2)} WHIP in ${fmtIp(pitch.innings)} IP`,
          body: punch
            ? `${pitch.kPer9.toFixed(1)} K/9, ${pitch.strikeOuts} K, ${pitch.wins}-${pitch.losses}.`
            : `${pitch.strikeOuts} K, ${pitch.walks} BB, ${pitch.wins}-${pitch.losses}.`,
          receipts: [
            { label: "ERA", value: fmtEra(pitch.era) },
            { label: "K", value: String(pitch.strikeOuts) },
            { label: "IP", value: fmtIp(pitch.innings) },
          ],
        }),
      );
    }
  }

  stats.push(...writeCareerFacts({
    seasonHit: hit,
    seasonPitch: pitch,
    years: input.years,
  }));

  if (stats.length === 0) {
    if (lastMulti) {
      stats.push(
        take({
          id: "last-multi",
          score: 20,
          stamp: "LAST MULTI",
          category: "heater",
          headline: lastMultiLine(lastMulti),
          body: boxLine(lastMulti),
          receipts: [],
        }),
      );
    } else if (lastHr) {
      stats.push(
        take({
          id: "last-hr",
          score: 18,
          stamp: "LAST HR",
          category: "power",
          headline: lastHrLine(lastHr),
          body: "",
          receipts: [],
        }),
      );
    } else if (hit && hit.games >= 1) {
      stats.push(
        take({
          id: "thin",
          score: 12,
          stamp: "2026",
          category: "split",
          headline: `${slash(hit)}, ${hit.games} G`,
          body: `${hit.homeRuns} HR, ${hit.stolenBases} SB, ${hit.rbi} RBI.`,
          receipts: [],
        }),
      );
    } else {
      stats.push(
        take({
          id: "thin",
          score: 10,
          stamp: "NO VOLUME",
          category: "rare",
          headline: `No 2026 line yet`,
          body: "Not enough games to rank.",
          receipts: [],
        }),
      );
    }
  }

  return rankFacts(stats);
}

export function generateGameCrazyStats(input: GameInput): CrazyStat[] {
  const stats: CrazyStat[] = [];
  const full = input.name;
  const team = club(input.team);
  const vs = vsOpp(input.isHome, input.opponent);
  const hit = input.hit;
  const pitch = input.pitch;
  const logs = input.hitGames ?? [];
  const pitchLogs = input.pitchGames ?? [];
  const mates = input.mates ?? [];
  const played = Boolean(
    (hit && (hit.plateAppearances > 0 || hit.atBats > 0)) ||
      (pitch && pitch.innings > 0),
  );

  if (
    hit &&
    hit.hits >= 1 &&
    hit.doubles >= 1 &&
    hit.triples >= 1 &&
    hit.homeRuns >= 1
  ) {
    const prev = lastMatch(
      logs,
      (g) => g.hits >= 1 && g.doubles >= 1 && g.triples >= 1 && g.homeRuns >= 1,
      input.date,
    );
    stats.push(
      take({
        id: "game-cycle",
        score: 99,
        stamp: "CYCLE",
        category: "rare",
        headline: `Hit for the cycle ${vs}`,
        body: since(prev, "cycle"),
        receipts: [{ label: "H", value: String(hit.hits) }, ...dayReceipt(prev, input.date)],
      }),
    );
  }

  if (hit && hit.hits >= 3 && hit.stolenBases >= 1) {
    const prev = lastMatch(
      logs,
      (g) => g.hits >= hit.hits && g.stolenBases >= 1,
      input.date,
    );
    stats.push(
      take({
        id: "game-hits-sb",
        score: 88 + hit.hits * 2,
        stamp: "HITS + SB",
        category: "rare",
        headline: `${hit.hits} hits and ${hit.stolenBases} SB ${vs}`,
        body: since(prev, `${hit.hits}-hit game with a steal`),
        receipts: [
          { label: "H", value: String(hit.hits) },
          { label: "SB", value: String(hit.stolenBases) },
          ...dayReceipt(prev, input.date),
        ],
      }),
    );
  }

  if (hit && hit.hits >= 3) {
    const prev = lastMatch(logs, (g) => g.hits >= hit.hits, input.date);
    const prior = logs.filter((g) => !input.date || g.date < input.date);
    const maxHits = Math.max(0, ...prior.map((g) => g.hits));
    const seasonHigh = hit.hits >= maxHits;
    const distant = !prev || daysBetween(prev.date, input.date) >= 10;
    if (hit.hits >= 4 || distant) {
      const high = hit.hits >= 5 ? "5-hit" : hit.hits >= 4 ? "4-hit" : "3-hit";
      stats.push(
        take({
          id: "game-hit-high",
          score: 80 + hit.hits * 4,
          stamp: high.toUpperCase(),
          category: "heater",
          headline: `${hit.hits} hits ${vs}`,
          body: since(prev, `${high} game`),
          receipts: [{ label: "H", value: String(hit.hits) }, ...dayReceipt(prev, input.date)],
        }),
      );
    } else if (seasonHigh) {
      stats.push(
        take({
          id: "game-season-high",
          score: 72 + hit.hits,
          stamp: "SEASON HIGH",
          category: "heater",
          headline: `Season-high ${hit.hits} hits ${vs}`,
          body:
            maxHits === 0
              ? `First game this year with ${hit.hits} hits.`
              : `Tied or passed his previous high (${maxHits}).`,
          receipts: [{ label: "H", value: String(hit.hits) }],
        }),
      );
    }
  }

  if (hit && hit.homeRuns >= 2) {
    const prev = lastMatch(logs, (g) => g.homeRuns >= 2, input.date);
    stats.push(
      take({
        id: "game-hr",
        score: 86 + hit.homeRuns * 6,
        stamp: "MULTI-HR",
        category: "power",
        headline: `${hit.homeRuns} home runs ${vs}`,
        body: since(prev, "multi-homer game"),
        receipts: [
          { label: "HR", value: String(hit.homeRuns) },
          { label: "RBI", value: String(hit.rbi) },
          ...dayReceipt(prev, input.date),
        ],
      }),
    );
  }

  const bag = hit
    ? [{ name: full, hit }, ...mates.map((m) => ({ name: m.name, hit: m.hit }))]
    : [];
  const withHits = bag.filter((p) => (p.hit?.hits ?? 0) > 0);
  const topHits = Math.max(0, ...bag.map((p) => p.hit?.hits ?? 0));
  const withSb = bag.filter((p) => (p.hit?.stolenBases ?? 0) > 0);
  const withHr = bag.filter((p) => (p.hit?.homeRuns ?? 0) > 0);
  const onlyHr = Boolean(hit && hit.homeRuns >= 1 && mates.length && withHr.length === 1);

  if (hit && hit.homeRuns === 1 && !onlyHr) {
    const prev = lastMatch(logs, (g) => g.homeRuns >= 1, input.date);
    stats.push(
      take({
        id: "game-hr-since",
        score: 76,
        stamp: "HR",
        category: "power",
        headline: `HR ${vs}`,
        body: since(prev, "home run"),
        receipts: [{ label: "HR", value: "1" }, ...dayReceipt(prev, input.date)],
      }),
    );
  }

  if (hit && mates.length) {
    if (hit.hits >= 2 && hit.hits === topHits) {
      const next = bag
        .filter((p) => p.name !== full)
        .sort((a, b) => (b.hit?.hits ?? 0) - (a.hit?.hits ?? 0))[0];
      const nextHits = next?.hit?.hits ?? 0;
      stats.push(
        take({
          id: "game-team-hits",
          score: 60 + hit.hits * 4,
          stamp: "BOX",
          category: "heater",
          headline: boxLine(hit),
          body:
            next && nextHits === hit.hits
              ? `Tied with ${lastName(next.name)} for the ${team} hit lead.`
              : next && nextHits > 0
                ? `Team-high hits. ${lastName(next.name)} had ${nextHits}.`
                : `Team-high ${hit.hits} hits for the ${team}.`,
          receipts: [{ label: "H", value: String(hit.hits) }],
        }),
      );
    }

    if (hit.stolenBases >= 1 && withSb.length === 1) {
      const prev = lastMatch(logs, (g) => g.stolenBases >= 1, input.date);
      stats.push(
        take({
          id: "game-only-sb",
          score: 64,
          stamp: "ONLY STEAL",
          category: "speed",
          headline: `Only ${team} steal ${vs}`,
          body: since(prev, "stolen base"),
          receipts: [
            { label: "SB", value: String(hit.stolenBases) },
            ...dayReceipt(prev, input.date),
          ],
        }),
      );
    }

    if (onlyHr && hit.homeRuns === 1) {
      const prev = lastMatch(logs, (g) => g.homeRuns >= 1, input.date);
      stats.push(
        take({
          id: "game-only-hr",
          score: 78,
          stamp: "ONLY HR",
          category: "power",
          headline: `Only ${team} home run ${vs}`,
          body: since(prev, "home run"),
          receipts: [
            { label: "HR", value: String(hit.homeRuns) },
            ...dayReceipt(prev, input.date),
          ],
        }),
      );
    }
  }

  if (pitch && pitch.innings > 0) {
    const gem = pitch.innings >= 6 && pitch.earnedRuns <= 2;
    const punch = pitch.strikeOuts >= 8;
    if (gem || punch) {
      const prev = punch
        ? lastMatch(pitchLogs, (g) => g.strikeOuts >= pitch.strikeOuts, input.date)
        : lastMatch(
            pitchLogs,
            (g) => g.innings >= 6 && g.earnedRuns <= pitch.earnedRuns,
            input.date,
          );
      const line = pitch.summary || `${fmtIp(pitch.innings)} IP, ${pitch.earnedRuns} ER`;
      stats.push(
        take({
          id: "game-pitch",
          score: 55 + pitch.strikeOuts * 4 - pitch.earnedRuns * 6,
          stamp: "PITCHING",
          category: "pitching",
          headline: `${line} ${vs}`,
          body: punch
            ? sincePitch(prev, `${pitch.strikeOuts}-strikeout game`)
            : sincePitch(prev, "start of 6+ IP with 2 ER or fewer"),
          receipts: [
            { label: "IP", value: fmtIp(pitch.innings) },
            { label: "ER", value: String(pitch.earnedRuns) },
            { label: "K", value: String(pitch.strikeOuts) },
            ...dayReceipt(prev, input.date),
          ],
        }),
      );
    }
  }

  const quiet = Boolean(hit && isOhfer(hit));
  if (quiet && hit) {
    const prevOhfer = lastMatch(logs, (g) => isOhfer(g, hit.atBats), input.date);
    const firstWindow = !prevOhfer || daysBetween(prevOhfer.date, input.date) >= 14;
    const teamShut = mates.length > 0 && withHits.length === 0;
    const prevMulti = lastMatch(logs, (g) => g.hits >= 2, input.date);
    const bestMate = [...mates]
      .filter((m) => (m.hit?.hits ?? 0) >= 2)
      .sort((a, b) => (b.hit?.hits ?? 0) - (a.hit?.hits ?? 0))[0];

    if (teamShut) {
      stats.push(
        take({
          id: "game-nobody",
          score: 46,
          stamp: "NO HITS",
          category: "split",
          headline: `Nobody had a hit ${vs}`,
          body: "",
          receipts: [{ label: "H", value: "0" }],
        }),
      );
    } else if (firstWindow) {
      stats.push(
        take({
          id: "game-ohfer-first",
          score: 44,
          stamp: "0-FER",
          category: "split",
          headline: `First 0-for-${hit.atBats} in the last two weeks`,
          body: "",
          receipts: [
            { label: "AB", value: String(hit.atBats) },
            { label: "K", value: String(hit.strikeOuts) },
            ...dayReceipt(prevOhfer, input.date),
          ],
        }),
      );
    } else {
      stats.push(
        take({
          id: "game-ohfer",
          score: 24,
          stamp: "0-FER",
          category: "split",
          headline: `0-for-${hit.atBats}${hit.strikeOuts ? `, ${hit.strikeOuts} K` : ""} ${vs}`,
          body: prevMulti ? lastMultiFoot(prevMulti) : "",
          receipts: [
            { label: "AB", value: String(hit.atBats) },
            { label: "K", value: String(hit.strikeOuts) },
          ],
        }),
      );
    }

    if (bestMate?.hit && !teamShut) {
      stats.push(
        take({
          id: "game-mate",
          score: 34,
          stamp: "BOX",
          category: "heater",
          headline: `${lastName(bestMate.name)} went ${bestMate.hit.hits}-for-${bestMate.hit.atBats}`,
          body: "",
          receipts: [{ label: "H", value: String(bestMate.hit.hits) }],
        }),
      );
    }
  }

  const feat = stats.some(
    (s) =>
      s.id === "game-cycle" ||
      s.id === "game-hits-sb" ||
      s.id === "game-hit-high" ||
      s.id === "game-hr" ||
      s.id === "game-hr-since" ||
      s.id === "game-team-hits" ||
      s.id === "game-only-sb" ||
      s.id === "game-only-hr" ||
      s.id === "game-pitch" ||
      s.id === "game-season-high",
  );
  if (played && hit && (!feat || quiet)) {
    const prevHr = lastMatch(logs, (g) => g.homeRuns >= 1, input.date);
    const prevMulti = lastMatch(logs, (g) => g.hits >= 2, input.date);
    const footnotedMulti = stats.some((s) => s.id === "game-ohfer");
    if (prevHr) {
      stats.push(
        take({
          id: "game-last-hr",
          score: 36,
          stamp: "LAST HR",
          category: "power",
          headline: lastHrLine(prevHr),
          body: "",
          receipts: [],
        }),
      );
    } else if (prevMulti && !footnotedMulti) {
      stats.push(
        take({
          id: "game-last-multi",
          score: 32,
          stamp: "LAST MULTI",
          category: "heater",
          headline: lastMultiLine(prevMulti),
          body: boxLine(prevMulti),
          receipts: [],
        }),
      );
    } else if (!stats.length) {
      stats.push(
        take({
          id: "game-first",
          score: 24,
          stamp: "BOX",
          category: "heater",
          headline: boxLine(hit),
          body: `First game in the last two seasons.`,
          receipts: [],
        }),
      );
    }
  }

  if (!played) {
    stats.push(
      take({
        id: "game-dnp",
        score: 8,
        stamp: "NO BOX",
        category: "rare",
        headline: "Did not play",
        body: `Not in the box ${vs}.`,
        receipts: [],
      }),
    );
  }

  return rankFacts(stats);
}
