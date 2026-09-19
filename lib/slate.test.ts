import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isLive, slateBlocks } from "./slate";
import type { HomeGame } from "./types";

function game(over: Partial<HomeGame> & { abstractState: string }): HomeGame {
  return {
    gamePk: over.gamePk ?? 1,
    status: over.status ?? over.abstractState,
    abstractState: over.abstractState,
    home: over.home ?? { id: 1, name: "Cubs", abbr: "CHC" },
    away: over.away ?? { id: 2, name: "Reds", abbr: "CIN" },
  };
}

describe("home slate", () => {
  it("keeps last night up when today is only scheduled", () => {
    const blocks = slateBlocks({
      yesterday: [game({ gamePk: 18, abstractState: "Final" })],
      today: [game({ gamePk: 19, abstractState: "Preview", status: "Scheduled" })],
      tomorrow: [game({ gamePk: 20, abstractState: "Preview" })],
    });
    assert.deepEqual(
      blocks.map((b) => [b.label, b.games.map((g) => g.gamePk)]),
      [
        ["Last night", [18]],
        ["Today", [19]],
      ],
    );
  });

  it("shows only today once a game has started", () => {
    const blocks = slateBlocks({
      yesterday: [game({ gamePk: 18, abstractState: "Final" })],
      today: [
        game({ gamePk: 19, abstractState: "Live" }),
        game({ gamePk: 21, abstractState: "Preview" }),
      ],
      tomorrow: [],
    });
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.label, "Live");
    assert.deepEqual(
      blocks[0]?.games.map((g) => g.abstractState),
      ["Live", "Preview"],
    );
  });

  it("treats In Progress as live even without the Live state", () => {
    assert.equal(isLive(game({ abstractState: "Preview", status: "In Progress" })), true);
    assert.equal(isLive(game({ abstractState: "Final", status: "Final" })), false);
  });

  it("falls forward to tomorrow on an empty weeknight", () => {
    const blocks = slateBlocks({
      yesterday: [],
      today: [],
      tomorrow: [game({ gamePk: 20, abstractState: "Preview" })],
    });
    assert.equal(blocks[0]?.label, "Tomorrow");
  });
});
