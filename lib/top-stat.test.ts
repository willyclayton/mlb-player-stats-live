import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTopTake, rareGameFeat } from "./top-stat";
import type { CrazyStat } from "./types";

function take(over: Partial<CrazyStat>): CrazyStat {
  return {
    id: "x",
    score: 50,
    stamp: "X",
    headline: "",
    body: "",
    category: "rare",
    receipts: [],
    ...over,
  };
}

describe("top stat", () => {
  it("flags a cycle and a 5-hit game", () => {
    const cycle = rareGameFeat({
      hits: 4,
      atBats: 5,
      doubles: 1,
      triples: 1,
      homeRuns: 1,
    });
    assert.equal(cycle?.line, "Hit for the cycle");
    assert.equal(rareGameFeat({ hits: 5, atBats: 5 })?.line, "5-for-5");
  });

  it("flags 2 homers and 3 hits with a steal", () => {
    assert.equal(rareGameFeat({ hits: 3, homeRuns: 2, atBats: 4 })?.line, "2 home runs");
    assert.equal(rareGameFeat({ hits: 3, stolenBases: 1, atBats: 4 })?.line, "3 hits, 1 SB");
  });

  it("ignores a normal 1-for-4", () => {
    assert.equal(rareGameFeat({ hits: 1, atBats: 4, homeRuns: 0 }), null);
  });

  it("treats 30-30 and two-way takes as top", () => {
    assert.equal(isTopTake(take({ id: "club-20-20", stamp: "30-30", score: 90 })), true);
    assert.equal(isTopTake(take({ id: "club-20-20", stamp: "20-20", score: 78 })), false);
    assert.equal(isTopTake(take({ id: "two-way", score: 98 })), true);
  });

  it("flags a 12-K or 8-inning shutout start", () => {
    assert.equal(rareGameFeat(undefined, { strikeOuts: 12, innings: 7 })?.line, "12 K");
    assert.equal(rareGameFeat(undefined, { strikeOuts: 8, innings: 8, earnedRuns: 0 })?.line, "8 IP, 0 ER");
  });

  it("flags a high-score take as top", () => {
    assert.equal(isTopTake(take({ id: "game-hr", score: 80 })), true);
    assert.equal(isTopTake(take({ id: "club-lead", score: 70 })), false);
  });
});
