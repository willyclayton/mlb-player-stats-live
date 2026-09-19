import { fmtIp } from "./format";
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
    const sb = hit.stolenBases ?? 0;
    const rbi = hit.rbi ?? 0;
    if (hits >= 1 && (hit.doubles ?? 0) >= 1 && (hit.triples ?? 0) >= 1 && hr >= 1) {
      feats.push({ line: "Hit for the cycle", score: 99 });
    }
    if (hits >= 5) feats.push({ line: `${hits}-for-${ab}`, score: 96 });
    if (hr >= 3) feats.push({ line: `${hr} home runs`, score: 95 });
    if (hits >= 3 && sb >= 1) feats.push({ line: `${hits} hits, ${sb} SB`, score: 90 });
    if (hr >= 2) feats.push({ line: `${hr} home runs`, score: 88 });
    if (hits >= 4) feats.push({ line: `${hits}-for-${ab}`, score: 86 });
    if (rbi >= 6) feats.push({ line: `${rbi} RBI`, score: 84 });
  }

  if (pitch) {
    const k = pitch.strikeOuts ?? 0;
    const ip = pitch.innings ?? 0;
    if (k >= 12) feats.push({ line: `${k} K`, score: 90 });
    if (pitch.earnedRuns === 0 && ip >= 8) {
      feats.push({ line: `${fmtIp(ip)} IP, 0 ER`, score: 88 });
    }
    if (k >= 10) feats.push({ line: `${k} K`, score: 84 });
  }

  return feats.sort((a, b) => b.score - a.score)[0] ?? null;
}

export function isTopTake(stat: CrazyStat): boolean {
  if (stat.id === "club-20-20") return /30-30|40-40/.test(stat.stamp);
  if (stat.id === "two-way") return true;
  if (["game-hits-sb", "game-hr", "game-hit-high"].includes(stat.id)) return true;
  return stat.score >= 88;
}
