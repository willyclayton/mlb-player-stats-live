import type { CrazyStat } from "./types";

/**
 * Scoring playbook — from Will's A/B picks (1B 2A 3B 4B 5B 6B 7B 8B 9B 10B).
 *
 * Look for
 * 1. First or best: career high, first 20/30/40 season, career-best ERA, cycle.
 * 2. A named comparison: Harris is 14 back, previous best 2.33 in 2022.
 * 3. A long window: months or years, not five days.
 * 4. Feat rarity: cycle > 3 HR > 5-hit > 2 HR > only steal.
 * 5. A positive event, not an 0-fer.
 * 6. Prestige: HR and ERA beat doubles, steals, and OPS splits.
 *
 * Discount
 * 1. Restates the slash / box (two-way line with no comparison).
 * 2. First-since under 14 days.
 * 3. 2nd-most unless the number is big (40+ HR still counts).
 * 4. Absence: 0-fer, DNP.
 * 5. Cheap club-uniques (only steal).
 * 6. Rate splits (last 15 OPS) — a streak beats a heater.
 *
 * Near-ties (hard picks): team lead vs 2nd-most, HR vs doubles career high,
 * hit-lead tie vs only steal, streak vs last-15, 30-30 vs career-best ERA.
 * Keep those within 6 points. Clear picks get 8+.
 */

export const LOOK_FOR = [
  "first-or-best",
  "named-comparison",
  "long-window",
  "feat-rarity",
  "positive-event",
  "prestige-stat",
] as const;

export const DISCOUNT = [
  "restates-the-line",
  "short-window",
  "second-best",
  "absence",
  "cheap-unique",
  "rate-split",
] as const;

const NEAR = 6;

function numReceipt(stat: CrazyStat, label: string): number {
  const raw = stat.receipts.find((row) => row.label === label)?.value;
  const n = parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function windowPenalty(stat: CrazyStat): number {
  const days = numReceipt(stat, "Days");
  if (days <= 0) return 0;
  if (days < 14) return 18;
  if (days < 45) return 8;
  return 0;
}

export function rarity(stat: CrazyStat): number {
  let score = 0;
  switch (stat.id) {
    case "game-cycle":
      score = 99;
      break;
    case "club-20-20":
      score = stat.stamp === "40-40" ? 95 : 86;
      break;
    case "career-best-era":
      score = 92;
      break;
    case "career-high-homeRuns":
      score = 88;
      break;
    case "career-first-homeRuns":
      score = numReceipt(stat, "Bar") >= 40 ? 90 : numReceipt(stat, "Bar") >= 30 ? 86 : 84;
      break;
    case "career-first-stolenBases":
      score = numReceipt(stat, "Bar") >= 30 ? 85 : 81;
      break;
    case "game-hit-high":
      score = /[5-9]-HIT/.test(stat.stamp) ? 91 : 80;
      break;
    case "game-hits-sb":
      score = 88 + Math.min(4, numReceipt(stat, "H"));
      break;
    case "game-hr":
      score = numReceipt(stat, "HR") >= 3 ? 94 : 80;
      break;
    case "career-high-stolenBases":
      score = 84;
      break;
    case "career-high-doubles":
      score = 83;
      break;
    case "career-high-triples":
      score = 84;
      break;
    case "career-high-strikeOuts":
      score = 81;
      break;
    case "career-high-hits":
      score = 80;
      break;
    case "career-high-rbi":
      score = 79;
      break;
    case "two-way":
      score = 78;
      break;
    case "career-first-doubles":
      score = 76;
      break;
    case "career-first-rbi":
      score = 77;
      break;
    case "career-first-hits":
      score = 75;
      break;
    case "career-first-triples":
      score = 78;
      break;
    case "career-2nd-homeRuns":
      score = 76;
      break;
    case "career-2nd-stolenBases":
      score = 70;
      break;
    case "career-2nd-doubles":
      score = 68;
      break;
    case "career-2nd-triples":
      score = 69;
      break;
    case "career-2nd-rbi":
      score = 67;
      break;
    case "career-2nd-hits":
      score = 66;
      break;
    case "team-lead": {
      const cats = new Set(stat.body.match(/\b(HR|SB|RBI)\b/g) ?? []).size;
      score = 76 + Math.min(2, Math.max(0, cats - 1)) * 4;
      break;
    }
    case "hit-streak":
      score = 58 + Math.min(14, numReceipt(stat, "Streak"));
      break;
    case "hr-streak":
      score = 68;
      break;
    case "heater-15":
      score = 64;
      break;
    case "pitch-line":
      score = 70;
      break;
    case "team-chase":
      score = 58;
      break;
    case "multi-hr-season":
      score = 60;
      break;
    case "game-only-hr":
      score = 78;
      break;
    case "game-hr-since":
      score = 70;
      break;
    case "game-season-high":
      score = 64;
      break;
    case "game-team-hits":
      score = 64;
      break;
    case "game-only-sb":
      score = 58;
      break;
    case "game-pitch":
      score = 60 + Math.min(16, numReceipt(stat, "K"));
      break;
    case "last-hr":
    case "game-last-hr":
      score = 38;
      break;
    case "last-multi":
    case "game-last-multi":
      score = 28;
      break;
    case "game-ohfer":
      score = 24;
      break;
    case "game-first":
      score = 20;
      break;
    case "thin":
      score = 10;
      break;
    case "game-dnp":
      score = 8;
      break;
    default:
      score = stat.score;
  }

  if (
    stat.id.startsWith("game-") &&
    (stat.body.startsWith("First ") || stat.id === "game-hr-since" || stat.id === "game-only-sb")
  ) {
    score -= windowPenalty(stat);
  }
  return score;
}

export function rankFacts(stats: CrazyStat[]): CrazyStat[] {
  return stats
    .map((stat) => ({ ...stat, score: rarity(stat) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function nearTie(a: CrazyStat, b: CrazyStat): boolean {
  return Math.abs(rarity(a) - rarity(b)) <= NEAR;
}
