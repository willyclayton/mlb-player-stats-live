import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateCrazyStats } from "./crazy-stats";
import { fmtAvg, parseInnings } from "./format";
import {
  aggregateHits,
  emptyHit,
  hittingStreak,
  iso,
  lastN,
} from "./stats";
import type { GameHit, HitLine, PitchLine } from "./types";

function hit(over: Partial<HitLine>): HitLine {
  return { ...emptyHit(), atBats: 400, games: 120, ...over };
}

function game(over: Partial<GameHit>): GameHit {
  return {
    ...emptyHit(),
    date: "2026-09-01",
    opponent: "Cubs",
    isHome: true,
    atBats: 4,
    ...over,
  };
}

describe("format helpers", () => {
  it("parses innings with outs", () => {
    assert.equal(parseInnings("85.2"), 85 + 2 / 3);
    assert.equal(parseInnings("6.1"), 6 + 1 / 3);
  });

  it("formats averages without a leading zero", () => {
    assert.equal(fmtAvg(0.277), ".277");
  });
});

describe("stat math", () => {
  it("aggregates last N games into a slash line", () => {
    const games = [
      game({ hits: 2, atBats: 4, totalBases: 5, walks: 0 }),
      game({ hits: 1, atBats: 3, totalBases: 1, walks: 1, hitByPitch: 0 }),
    ];
    const line = aggregateHits(games);
    assert.equal(line.hits, 3);
    assert.equal(line.atBats, 7);
    assert.equal(line.games, 2);
    assert.ok(Math.abs(line.avg - 3 / 7) < 1e-9);
  });

  it("counts a hitting streak from the most recent games", () => {
    const games = [
      game({ hits: 1, atBats: 4 }),
      game({ hits: 0, atBats: 3 }),
      game({ hits: 2, atBats: 4 }),
      game({ hits: 1, atBats: 3 }),
      game({ hits: 1, atBats: 4 }),
    ];
    assert.equal(hittingStreak(games), 3);
    assert.equal(lastN(games, 2).length, 2);
  });

  it("computes ISO from slugging minus average", () => {
    assert.ok(Math.abs(iso(hit({ avg: 0.27, slg: 0.52 })) - 0.25) < 1e-9);
  });
});

describe("crazy stat engine", () => {
  it("leads with the two-way stat when a player hits and pitches", () => {
    const crazy = generateCrazyStats({
      name: "Shohei Ohtani",
      nickname: "Showtime",
      position: "TWP",
      seasonHit: hit({
        avg: 0.277,
        obp: 0.38,
        slg: 0.522,
        ops: 0.902,
        homeRuns: 30,
        stolenBases: 11,
        rbi: 80,
        atBats: 502,
        games: 134,
      }),
      seasonPitch: {
        games: 14,
        gamesStarted: 14,
        wins: 8,
        losses: 2,
        saves: 0,
        innings: 85.7,
        hits: 55,
        runs: 21,
        earnedRuns: 17,
        homeRuns: 4,
        walks: 26,
        strikeOuts: 95,
        era: 1.79,
        whip: 0.95,
        kPer9: 9.98,
        bbPer9: 2.73,
        hrPer9: 0.42,
        kBb: 3.65,
        opponentAvg: 0.18,
      } satisfies PitchLine,
      hitGames: [],
      pitchGames: [],
    });
    assert.equal(crazy[0]?.id, "two-way");
    assert.match(crazy[0].body, /1\.79/);
    assert.match(crazy[0].body, /30 homers/);
  });

  it("flags a 30-30 season", () => {
    const crazy = generateCrazyStats({
      name: "Jazz Chisholm Jr.",
      seasonHit: hit({
        homeRuns: 32,
        stolenBases: 31,
        avg: 0.25,
        obp: 0.33,
        slg: 0.48,
        ops: 0.81,
        atBats: 500,
      }),
      hitGames: [],
      pitchGames: [],
    });
    assert.ok(crazy.some((s) => s.id === "club-20-20"));
    assert.match(crazy.find((s) => s.id === "club-20-20")!.stamp, /30-30/);
  });

  it("scores a last-15 heater above the season line", () => {
    const games: GameHit[] = Array.from({ length: 15 }, (_, i) =>
      game({
        date: `2026-09-${String(i + 1).padStart(2, "0")}`,
        hits: 2,
        atBats: 4,
        totalBases: 5,
        homeRuns: 1,
        plateAppearances: 4,
        rbi: 2,
      }),
    );
    const crazy = generateCrazyStats({
      name: "Juan Soto",
      seasonHit: hit({
        avg: 0.26,
        obp: 0.36,
        slg: 0.48,
        ops: 0.84,
        homeRuns: 22,
        atBats: 480,
        games: 140,
      }),
      hitGames: games,
      pitchGames: [],
    });
    assert.ok(crazy.some((s) => s.id === "heater-15"));
  });

  it("returns a thin-file fallback when there is no volume", () => {
    const crazy = generateCrazyStats({
      name: "Prospect Kid",
      hitGames: [],
      pitchGames: [],
    });
    assert.equal(crazy[0]?.id, "thin");
  });
});
