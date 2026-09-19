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
  it("flags a cycle, a 5-hit game, 3 homers, and 12 K", () => {
    const cycle = rareGameFeat({
      hits: 4,
      atBats: 5,
      doubles: 1,
      triples: 1,
      homeRuns: 1,
    });
    assert.equal(cycle?.line, "Hit for the cycle");
    assert.equal(rareGameFeat({ hits: 5, atBats: 5 })?.line, "5-for-5");
    assert.equal(rareGameFeat({ hits: 3, homeRuns: 3, atBats: 5 })?.line, "3 home runs");
    assert.equal(rareGameFeat(undefined, { strikeOuts: 12, innings: 7 })?.line, "12 K");
  });

  it("ignores a good night that is not rare", () => {
    assert.equal(rareGameFeat({ hits: 4, atBats: 5, homeRuns: 0 }), null);
    assert.equal(rareGameFeat({ hits: 3, homeRuns: 2, atBats: 4 }), null);
    assert.equal(rareGameFeat({ hits: 3, stolenBases: 1, atBats: 4 }), null);
    assert.equal(rareGameFeat({ hits: 1, atBats: 4, rbi: 6 }), null);
    assert.equal(rareGameFeat(undefined, { strikeOuts: 10, innings: 7 }), null);
    assert.equal(rareGameFeat(undefined, { strikeOuts: 8, innings: 8, earnedRuns: 0 }), null);
  });

  it("treats 30-30, 40-40, MLB HR/OPS, and first 30-30 as top", () => {
    assert.equal(isTopTake(take({ id: "club-20-20", stamp: "30-30", score: 90 })), true);
    assert.equal(isTopTake(take({ id: "club-20-20", stamp: "40-40", score: 96 })), true);
    assert.equal(isTopTake(take({ id: "club-20-20", stamp: "20-20", score: 78 })), false);
    assert.equal(isTopTake(take({ id: "two-way", score: 98 })), false);
    assert.equal(isTopTake(take({ id: "mlb-lead-homeRuns", stamp: "MLB HR" })), true);
    assert.equal(isTopTake(take({ id: "mlb-lead-ops", stamp: "MLB OPS" })), true);
    assert.equal(isTopTake(take({ id: "career-first-30-30", stamp: "FIRST 30-30" })), true);
    assert.equal(isTopTake(take({ id: "franchise-first-30-30", stamp: "FIRST 30-30" })), true);
    assert.equal(isTopTake(take({ id: "franchise-since-30-30", stamp: "30-30" })), true);
    assert.equal(isTopTake(take({ id: "historic-game", stamp: "FIRST EVER" })), true);
    assert.equal(isTopTake(take({ id: "historic-season", stamp: "CLUB RECORD" })), true);
    assert.equal(isTopTake(take({ id: "game-combo", stamp: "FIRST SINCE" })), true);
  });

  it("does not flag a 2-homer or 4-hit take", () => {
    assert.equal(
      isTopTake(take({ id: "game-hr", stamp: "MULTI-HR", receipts: [{ label: "HR", value: "2" }] })),
      false,
    );
    assert.equal(isTopTake(take({ id: "game-hit-high", stamp: "4-HIT" })), false);
    assert.equal(isTopTake(take({ id: "game-hits-sb", stamp: "HITS + SB", score: 94 })), false);
    assert.equal(
      isTopTake(take({ id: "game-hr", stamp: "MULTI-HR", receipts: [{ label: "HR", value: "3" }] })),
      true,
    );
    assert.equal(isTopTake(take({ id: "game-hit-high", stamp: "5-HIT" })), true);
  });
});
