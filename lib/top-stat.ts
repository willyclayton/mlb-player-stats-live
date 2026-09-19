import type { CrazyStat, HitLine, PitchLine } from "./types";

export type TopFeat = {
  line: string;
  score: number;
};

export function rareGameFeat(
  hit?: Partial<HitLine> & { summary?: string },
  pitch?: Partial<PitchLine>,
): TopFeat | null {
  const feats: TopFeat[] = [];

  if (hit) {
    const hits = hit.hits ?? 0;
    const ab = hit.atBats ?? 0;
    const hr = hit.homeRuns ?? 0;
    if (hits >= 1 && (hit.doubles ?? 0) >= 1 && (hit.triples ?? 0) >= 1 && hr >= 1) {
      feats.push({ line: "Hit for the cycle", score: 99 });
    }
    if (hits >= 5) feats.push({ line: `${hits}-for-${ab}`, score: 96 });
    if (hr >= 3) feats.push({ line: `${hr} home runs`, score: 95 });
  }

  if (pitch) {
    const k = pitch.strikeOuts ?? 0;
    if (k >= 12) feats.push({ line: `${k} K`, score: 90 });
  }

  return feats.sort((a, b) => b.score - a.score)[0] ?? null;
}

export function isTopTake(stat: CrazyStat): boolean {
  if (stat.id === "club-20-20") return /30-30|40-40/.test(stat.stamp);
  if (stat.id === "career-first-30-30") return true;
  if (stat.id.startsWith("franchise-first-") || stat.id.startsWith("franchise-since-")) return true;
  if (stat.id === "historic-game" && stat.stamp === "CLUB FIRST") return true;
  if (stat.id === "mlb-lead-homeRuns" || stat.id === "mlb-lead-ops") return true;
  if (stat.id === "game-hit-high") return /[5-9]-HIT/.test(stat.stamp);
  if (stat.id === "game-hr") {
    const hr = Number(stat.receipts.find((row) => row.label === "HR")?.value ?? 0);
    return hr >= 3;
  }
  return false;
}
