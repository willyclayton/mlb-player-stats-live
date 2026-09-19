import type { CrazyStat } from "./types";

function numReceipt(stat: CrazyStat, label: string): number {
  const raw = stat.receipts.find((row) => row.label === label)?.value;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Ranker: rarity only. Writer does not decide order. */
export function rarity(stat: CrazyStat): number {
  switch (stat.id) {
    case "two-way":
      return 98;
    case "club-20-20":
      return stat.stamp === "40-40" ? 96 : 90;
    case "game-cycle":
      return 99;
    case "game-hits-sb":
      return 88 + Math.min(10, numReceipt(stat, "H") * 2);
    case "game-hit-high":
      return /[5-9]-HIT/.test(stat.stamp) ? 96 : 84;
    case "game-hr":
      return 86 + Math.min(12, numReceipt(stat, "HR") * 6);
    case "career-high-homeRuns":
      return 88;
    case "career-best-era":
      return 87;
    case "career-high-stolenBases":
      return 84;
    case "career-high-doubles":
      return 82;
    case "career-high-triples":
      return 83;
    case "career-high-hits":
      return 80;
    case "career-high-rbi":
      return 79;
    case "career-high-strikeOuts":
      return 81;
    case "career-first-homeRuns":
      return numReceipt(stat, "Bar") >= 40 ? 86 : 80;
    case "career-first-stolenBases":
      return 80;
    case "career-first-doubles":
      return 76;
    case "career-first-rbi":
      return 77;
    case "career-first-hits":
      return 75;
    case "career-first-triples":
      return 78;
    case "career-2nd-homeRuns":
      return 74;
    case "career-2nd-doubles":
      return 68;
    case "career-2nd-stolenBases":
      return 70;
    case "career-2nd-rbi":
      return 67;
    case "career-2nd-hits":
      return 66;
    case "career-2nd-triples":
      return 69;
    case "team-lead": {
      const cats = new Set(stat.body.match(/\b(HR|SB|RBI)\b/g) ?? []).size;
      return 70 + Math.min(3, cats) * 6;
    }
    case "team-chase":
      return 58;
    case "hr-streak":
      return 68;
    case "hit-streak":
      return 56;
    case "multi-hr-season":
      return 60;
    case "heater-15": {
      const l15 = Number(stat.receipts.find((r) => r.label === "L15 OPS")?.value);
      const season = Number(stat.receipts.find((r) => r.label === "Season")?.value);
      if (!Number.isFinite(l15) || !Number.isFinite(season)) return 52;
      return 50 + Math.min(28, Math.round(Math.abs(l15 - season) * 80));
    }
    case "pitch-line":
      return 70;
    case "game-only-hr":
      return 78;
    case "game-hr-since":
      return 76;
    case "game-season-high":
      return 64;
    case "game-only-sb":
      return 64;
    case "game-team-hits":
      return 62;
    case "game-pitch":
      return 60 + Math.min(20, numReceipt(stat, "K") * 2);
    case "game-ohfer":
      return 48;
    case "last-hr":
    case "game-last-hr":
      return 30;
    case "last-multi":
    case "game-last-multi":
      return 26;
    case "game-first":
      return 22;
    case "game-dnp":
      return 8;
    case "thin":
      return 10;
    default:
      return stat.score;
  }
}

export function rankFacts(stats: CrazyStat[]): CrazyStat[] {
  return stats
    .map((stat) => ({ ...stat, score: rarity(stat) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
