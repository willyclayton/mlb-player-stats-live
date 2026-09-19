import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GAME_STATS, JUDGE_ITEMS, SEASON_STATS } from "./judge-pairs";

describe("judge catalog", () => {
  it("has 25 unique season stats and 25 unique game stats", () => {
    assert.equal(SEASON_STATS.length, 25);
    assert.equal(GAME_STATS.length, 25);
    assert.equal(JUDGE_ITEMS.length, 50);
    assert.deepEqual(
      SEASON_STATS.map((s) => s.id),
      Array.from({ length: 25 }, (_, i) => `S${i + 1}`),
    );
    assert.deepEqual(
      GAME_STATS.map((s) => s.id),
      Array.from({ length: 25 }, (_, i) => `G${i + 1}`),
    );
  });

  it("keeps each fact unique", () => {
    const season = SEASON_STATS.map((s) => `${s.who}|${s.fact}`);
    const game = GAME_STATS.map((s) => `${s.who}|${s.fact}`);
    assert.equal(new Set(season).size, 25);
    assert.equal(new Set(game).size, 25);
  });
});
