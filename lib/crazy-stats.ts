import { fmtAvg, fmtEra, fmtIp, slash, prettyDate } from "./format";
import { aggregateHits, hittingStreak, lastN } from "./stats";
import type { CrazyStat, GameHit, GamePitch, HitLine, PitchLine } from "./types";

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
  return `${isHome ? "vs" : "@"} ${opponent}`;
}

function factDate(iso?: string): string {
  if (!iso) return "";
  const label = prettyDate(iso);
  return iso.startsWith(String(SEASON)) ? label : `${label}, ${iso.slice(0, 4)}`;
}

function boxLine(hit: { summary?: string; hits: number; atBats: number }): string {
  return hit.summary || `${hit.hits}-${hit.atBats}`;
}

function gameNote(g: GameHit): string {
  return `${factDate(g.date)} ${vsOpp(g.isHome, g.opponent)} (${boxLine(g)})`;
}

function lastMatch(
  games: GameHit[],
  pred: (g: GameHit) => boolean,
  before?: string,
): GameHit | undefined {
  return [...games]
    .filter((g) => (!before || g.date < before) && pred(g))
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
}

function since(prev: GameHit | undefined, feat: string): string {
  if (!prev) return `No other ${feat} in the last two seasons.`;
  return `Last time: ${gameNote(prev)}.`;
}

function rankOnTeam(team: TeamHitter[], id: number, key: keyof HitLine) {
  const ordered = [...team].sort((a, b) => Number(b.line[key]) - Number(a.line[key]));
  const place = ordered.findIndex((p) => p.id === id);
  if (place < 0) return null;
  return { place: place + 1, next: ordered[place + 1] };
}

export function generateCrazyStats(input: Input): CrazyStat[] {
  const stats: CrazyStat[] = [];
  const full = input.name;
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
        body: `${full} has ${hit.homeRuns} home runs and ${fmtIp(pitch.innings)} innings, ${pitch.strikeOuts} strikeouts. Official 2026 hitting and pitching lines.`,
        receipts: [
          { label: "Slash", value: slash(hit) },
          { label: "HR", value: String(hit.homeRuns) },
          { label: "ERA", value: fmtEra(pitch.era) },
          { label: "IP", value: fmtIp(pitch.innings) },
        ],
      }),
    );
  }

  if (hit && hit.homeRuns >= 20 && hit.stolenBases >= 20) {
    const clubLabel =
      hit.homeRuns >= 40 && hit.stolenBases >= 40
        ? "40-40"
        : hit.homeRuns >= 30 && hit.stolenBases >= 30
          ? "30-30"
          : "20-20";
    const same = teamHitters.filter(
      (p) =>
        p.line.homeRuns >= (clubLabel === "20-20" ? 20 : clubLabel === "30-30" ? 30 : 40) &&
        p.line.stolenBases >= (clubLabel === "20-20" ? 20 : clubLabel === "30-30" ? 30 : 40),
    );
    const only = same.length <= 1;
    stats.push(
      take({
        id: "club-20-20",
        score: clubLabel === "40-40" ? 96 : clubLabel === "30-30" ? 90 : 78,
        stamp: clubLabel,
        category: "rare",
        headline: `${hit.homeRuns} HR and ${hit.stolenBases} SB this season`,
        body: only && teamHitters.length
          ? `Only ${team} player in a ${clubLabel} season this year.`
          : `${full} is on a ${clubLabel} season.`,
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
    const leads = [
      hr?.place === 1 ? `HR (${hit.homeRuns})` : null,
      sb?.place === 1 ? `SB (${hit.stolenBases})` : null,
      rbi?.place === 1 ? `RBI (${hit.rbi})` : null,
    ].filter(Boolean) as string[];
    if (leads.length) {
      const list =
        leads.length === 1
          ? leads[0]
          : leads.length === 2
            ? `${leads[0]} and ${leads[1]}`
            : `${leads.slice(0, -1).join(", ")}, and ${leads[leads.length - 1]}`;
      const next =
        hr?.place === 1 && hr.next
          ? `${lastName(hr.next.name)} is next in HR with ${hr.next.line.homeRuns}.`
          : sb?.place === 1 && sb.next
            ? `${lastName(sb.next.name)} is next in SB with ${sb.next.line.stolenBases}.`
            : "";
      stats.push(
        take({
          id: "team-lead",
          score: 70 + leads.length * 8,
          stamp: slash(hit),
          category: "rare",
          headline: `${slash(hit)}, ${hit.homeRuns} HR, ${hit.rbi} RBI`,
          body: next
            ? `Leads the ${team} in ${list}. ${next}`
            : `Leads the ${team} in ${list}.`,
          receipts: [
            { label: "AVG", value: fmtAvg(hit.avg) },
            { label: "HR", value: String(hit.homeRuns) },
            { label: "RBI", value: String(hit.rbi) },
          ],
        }),
      );
    }
  }

  const streak = hittingStreak(seasonGames);
  if (streak >= 8) {
    stats.push(
      take({
        id: "hit-streak",
        score: 40 + streak * 4,
        stamp: `${streak}-GAME STREAK`,
        category: "streak",
        headline: `Hit in ${streak} straight games`,
        body: `${full} has at least one hit in each of the last ${streak} games he played.`,
        receipts: [{ label: "Streak", value: `${streak} G` }],
      }),
    );
  }

  if (hit && last15 && last15.atBats >= 25) {
    const delta = last15.ops - hit.ops;
    if (Math.abs(delta) >= 0.12) {
      stats.push(
        take({
          id: "heater-15",
          score: 50 + Math.round(Math.abs(delta) * 80),
          stamp: "LAST 15",
          category: "split",
          headline: `Last 15 games: ${slash(last15)}`,
          body: `OPS ${last15.ops.toFixed(3)} over ${last15.games} games. Season OPS is ${hit.ops.toFixed(3)} (${delta >= 0 ? "+" : ""}${Math.round(delta * 1000)} points).`,
          receipts: [
            { label: "L15 OPS", value: last15.ops.toFixed(3) },
            { label: "Season", value: hit.ops.toFixed(3) },
            { label: "L15 HR", value: String(last15.homeRuns) },
          ],
        }),
      );
    }
  }

  if (pitch && pitch.innings >= 20) {
    stats.push(
      take({
        id: "pitch-line",
        score: pitch.era <= 2.5 ? 84 : 40,
        stamp: "PITCHING",
        category: "pitching",
        headline: `${fmtEra(pitch.era)} ERA, ${pitch.whip.toFixed(2)} WHIP in ${fmtIp(pitch.innings)} IP`,
        body: `${pitch.strikeOuts} strikeouts, ${pitch.walks} walks, ${pitch.wins}-${pitch.losses} record. Official 2026 pitching line.`,
        receipts: [
          { label: "ERA", value: fmtEra(pitch.era) },
          { label: "K", value: String(pitch.strikeOuts) },
          { label: "IP", value: fmtIp(pitch.innings) },
        ],
      }),
    );
  }

  if (hit && hit.games >= 10) {
    stats.push(
      take({
        id: "baseline-hit",
        score: 28,
        stamp: "2026 LINE",
        category: "split",
        headline: `${slash(hit)}, ${hit.homeRuns} HR, ${hit.stolenBases} SB`,
        body: `${hit.rbi} RBI in ${hit.games} games. Official MLB season line.`,
        receipts: [
          { label: "AVG", value: fmtAvg(hit.avg) },
          { label: "HR", value: String(hit.homeRuns) },
          { label: "SB", value: String(hit.stolenBases) },
        ],
      }),
    );
  }

  if (stats.length === 0) {
    stats.push(
      take({
        id: "thin",
        score: 10,
        stamp: "NO VOLUME",
        category: "rare",
        headline: `No 2026 line yet for ${full}`,
        body: "The official file does not have enough games to rank this player.",
        receipts: [],
      }),
    );
  }

  return stats.sort((a, b) => b.score - a.score);
}

export function generateGameCrazyStats(input: GameInput): CrazyStat[] {
  const stats: CrazyStat[] = [];
  const full = input.name;
  const team = club(input.team);
  const vs = vsOpp(input.isHome, input.opponent);
  const hit = input.hit;
  const pitch = input.pitch;
  const logs = input.hitGames ?? [];
  const mates = input.mates ?? [];
  const played = Boolean(
    (hit && (hit.plateAppearances > 0 || hit.atBats > 0)) ||
      (pitch && pitch.innings > 0),
  );

  if (hit && hit.atBats + hit.walks + hit.plateAppearances > 0) {
    stats.push(
      take({
        id: "game-line",
        score: 74 + hit.hits * 4 + hit.homeRuns * 8,
        stamp: "BOX",
        category: "heater",
        headline: boxLine(hit),
        body: `${hit.hits}-for-${hit.atBats}, ${hit.homeRuns} HR, ${hit.rbi} RBI ${vs}.`,
        receipts: [
          { label: "H-AB", value: `${hit.hits}-${hit.atBats}` },
          { label: "HR", value: String(hit.homeRuns) },
          { label: "K", value: String(hit.strikeOuts) },
        ],
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
        ],
      }),
    );
  }

  if (hit && hit.hits >= 4) {
    const prev = lastMatch(logs, (g) => g.hits >= hit.hits, input.date);
    const high = hit.hits >= 5 ? "5-hit" : "4-hit";
    stats.push(
      take({
        id: "game-hit-high",
        score: 80 + hit.hits * 4,
        stamp: high.toUpperCase(),
        category: "heater",
        headline: `${hit.hits} hits ${vs}`,
        body: since(prev, `${high} game`),
        receipts: [{ label: "H", value: String(hit.hits) }],
      }),
    );
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
        body: `${since(prev, "multi-homer game")}${
          input.seasonHit ? ` Season HR: ${input.seasonHit.homeRuns}.` : ""
        }`,
        receipts: [
          { label: "HR", value: String(hit.homeRuns) },
          { label: "RBI", value: String(hit.rbi) },
        ],
      }),
    );
  }

  if (hit && hit.hits >= 1) {
    const prior = logs.filter((g) => !input.date || g.date < input.date);
    const maxHits = Math.max(0, ...prior.map((g) => g.hits));
    if (hit.hits >= 3 && hit.hits >= maxHits) {
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

  if (hit && mates.length) {
    const bag = [{ name: full, hit }, ...mates.map((m) => ({ name: m.name, hit: m.hit }))];
    const withHits = bag.filter((p) => (p.hit?.hits ?? 0) > 0);
    const topHits = Math.max(0, ...bag.map((p) => p.hit?.hits ?? 0));
    const withSb = bag.filter((p) => (p.hit?.stolenBases ?? 0) > 0);
    const withHr = bag.filter((p) => (p.hit?.homeRuns ?? 0) > 0);

    if (hit.hits >= 2 && hit.hits === topHits) {
      stats.push(
        take({
          id: "game-team-hits",
          score: 60 + hit.hits * 4,
          stamp: "BOX",
          category: "heater",
          headline: boxLine(hit),
          body: `Team-high ${hit.hits} hits for the ${team} ${vs}.`,
          receipts: [{ label: "H", value: String(hit.hits) }],
        }),
      );
    }

    if (hit.stolenBases >= 1 && withSb.length === 1) {
      stats.push(
        take({
          id: "game-only-sb",
          score: 64,
          stamp: "ONLY STEAL",
          category: "speed",
          headline: `Only ${team} steal ${vs}`,
          body: `${full} had the club's only stolen base tonight.`,
          receipts: [{ label: "SB", value: String(hit.stolenBases) }],
        }),
      );
    }

    if (hit.homeRuns >= 1 && withHr.length === 1) {
      stats.push(
        take({
          id: "game-only-hr",
          score: 68,
          stamp: "ONLY HR",
          category: "power",
          headline: `Only ${team} home run ${vs}`,
          body: `${full} hit the club's only homer tonight.`,
          receipts: [{ label: "HR", value: String(hit.homeRuns) }],
        }),
      );
    }

    if (hit.hits === 0 && hit.atBats >= 4 && withHits.length) {
      const best = withHits.sort((a, b) => (b.hit?.hits ?? 0) - (a.hit?.hits ?? 0))[0];
      stats.push(
        take({
          id: "game-ohfer",
          score: 48 + hit.strikeOuts * 3,
          stamp: "0-FER",
          category: "split",
          headline: `0-for-${hit.atBats}${hit.strikeOuts ? `, ${hit.strikeOuts} K` : ""} ${vs}`,
          body: `${team} hits were elsewhere — ${lastName(best.name)} went ${best.hit?.hits}-for-${best.hit?.atBats}.`,
          receipts: [
            { label: "AB", value: String(hit.atBats) },
            { label: "K", value: String(hit.strikeOuts) },
          ],
        }),
      );
    }
  } else if (hit && hit.hits === 0 && hit.atBats >= 4) {
    const prev = lastMatch(logs, (g) => g.hits >= 2, input.date);
    stats.push(
      take({
        id: "game-ohfer",
        score: 48 + hit.strikeOuts * 3,
        stamp: "0-FER",
        category: "split",
        headline: `0-for-${hit.atBats}${hit.strikeOuts ? `, ${hit.strikeOuts} K` : ""} ${vs}`,
        body: prev ? `Last multi-hit game: ${gameNote(prev)}.` : `No hit in ${hit.atBats} at-bats.`,
        receipts: [
          { label: "AB", value: String(hit.atBats) },
          { label: "K", value: String(hit.strikeOuts) },
        ],
      }),
    );
  }

  if (pitch && pitch.innings > 0) {
    const line = pitch.summary || `${fmtIp(pitch.innings)} IP, ${pitch.earnedRuns} ER`;
    stats.push(
      take({
        id: "game-pitch",
        score: 55 + pitch.strikeOuts * 4 - pitch.earnedRuns * 6,
        stamp: "PITCHING",
        category: "pitching",
        headline: `${line} ${vs}`,
        body: `${fmtIp(pitch.innings)} IP, ${pitch.earnedRuns} ER, ${pitch.strikeOuts} K, ${pitch.walks} BB.`,
        receipts: [
          { label: "IP", value: fmtIp(pitch.innings) },
          { label: "ER", value: String(pitch.earnedRuns) },
          { label: "K", value: String(pitch.strikeOuts) },
        ],
      }),
    );
  }

  if (!played) {
    stats.push(
      take({
        id: "game-dnp",
        score: 8,
        stamp: "NO BOX",
        category: "rare",
        headline: `No plate appearance ${vs}`,
        body: `${full} is not in the official batting or pitching file for this game.`,
        receipts: [],
      }),
    );
  }

  return stats.sort((a, b) => b.score - a.score);
}
