import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GAME_COMBOS,
  THREE_HR_GAMES_2026,
  comboById,
  joinGameCombo,
} from "./game-combos";
import { emptyHit } from "./stats";
import type { HitLine } from "./types";

function hit(over: Partial<HitLine>): HitLine {
  return { ...emptyHit(), atBats: 5, ...over };
}

describe("rare game combo tables", () => {
  it("records that 3 HR + 2 doubles last happened in 2024, not 1918", () => {
    const row = comboById("3hr-2doubles");
    assert.ok(row);
    assert.equal(row!.lastPlayer, "Shohei Ohtani");
    assert.equal(row!.lastDate, "2024-09-19");
    assert.equal(row!.countEver, 5);
    assert.equal(row!.any2026, false);
    assert.equal(row!.matches2026.length, 0);
    assert.match(row!.notes, /Not 'first since 1918'/);
  });

  it("scans every 2026 3-HR box as 0 doubles, 0 triples, 0 steals", () => {
    assert.equal(THREE_HR_GAMES_2026.length, 15);
    assert.equal(new Set(THREE_HR_GAMES_2026.map((g) => g.player)).size, 13);
    for (const game of THREE_HR_GAMES_2026) {
      assert.equal(game.doubles, 0, game.player);
      assert.equal(game.triples, 0, game.player);
      assert.equal(game.sb, 0, game.player);
    }
    const twoWalks = THREE_HR_GAMES_2026.filter((g) => g.bb >= 2);
    assert.equal(twoWalks.length, 1);
    assert.equal(twoWalks[0]?.player, "Alex Bregman");
    assert.ok(!THREE_HR_GAMES_2026.some((g) => g.player.includes("Alvarez")));
  });

  it("joins a live 3 HR + 2 doubles box as first since Ohtani 2024", () => {
    const joins = joinGameCombo(
      hit({
        hits: 5,
        doubles: 2,
        homeRuns: 3,
        totalBases: 16,
        rbi: 6,
      }),
      "2026-09-19",
    );
    assert.ok(joins.some((j) => j.id === "game-combo"));
    const mix = joins.find((j) => /3 HR and 2\+ doubles/.test(j.headline));
    assert.ok(mix);
    assert.equal(mix!.stamp, "FIRST SINCE");
    assert.match(mix!.body, /Shohei Ohtani/);
    assert.match(mix!.body, /Sep 19, 2024/);
  });

  it("joins 3 HR + a steal as first since Ohtani, and a cycle + steal as first since Elly", () => {
    const steal = joinGameCombo(
      hit({ hits: 3, homeRuns: 3, stolenBases: 1 }),
      "2026-09-19",
    );
    assert.match(steal[0]!.body, /Shohei Ohtani/);
    const cycle = joinGameCombo(
      hit({
        hits: 4,
        doubles: 1,
        triples: 1,
        homeRuns: 1,
        stolenBases: 1,
      }),
      "2026-09-19",
    );
    assert.ok(cycle.some((j) => /Elly De La Cruz/.test(j.body)));
    assert.ok(cycle.some((j) => /2023/.test(j.body)));
  });

  it("does not auto-join reverse cycles, walk-offs, or same-inning slams from totals", () => {
    assert.equal(comboById("reverse-cycle")?.autoJoin, false);
    assert.equal(comboById("3hr-walkoff")?.autoJoin, false);
    assert.equal(comboById("2hr-inning-slam")?.autoJoin, false);
    const quiet = joinGameCombo(hit({ hits: 3, homeRuns: 3 }), "2026-09-19");
    assert.equal(quiet.some((j) => /walk-off|reverse|slam/i.test(j.headline)), false);
  });

  it("keeps last-occurrence pointers for 4 HR, 6 hits, and 5 extra-base hits", () => {
    assert.equal(comboById("4hr")?.lastPlayer, "Kyle Schwarber");
    assert.equal(comboById("4hr")?.lastDate, "2025-08-28");
    assert.equal(comboById("4hr")?.any2026, false);
    assert.equal(comboById("6hits")?.lastPlayer, "Nick Kurtz");
    assert.equal(comboById("5xbh")?.lastPlayer, "Nick Kurtz");
    assert.equal(comboById("5xbh")?.any2026, false);
  });

  it("lists every high-confidence combo", () => {
    assert.equal(GAME_COMBOS.length, 13);
    for (const row of GAME_COMBOS) {
      assert.equal(row.confidence, "high");
      assert.ok(row.lastPlayer);
      assert.ok(row.lastDate);
    }
  });
});
