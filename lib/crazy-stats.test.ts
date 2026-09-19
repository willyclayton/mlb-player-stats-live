import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateCrazyStats, generateGameCrazyStats } from "./crazy-stats";
import { fmtAvg, parseInnings, shortTeamName, startEt } from "./format";
import {
  aggregateHits,
  emptyHit,
  emptyPitch,
  hittingStreak,
  iso,
  lastN,
  mostRecent,
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

  it("prints first pitch in Eastern time", () => {
    assert.equal(startEt("2026-09-19T17:10:00Z"), "1:10 PM");
  });

  it("shortens club names for the board", () => {
    assert.equal(shortTeamName("Pittsburgh Pirates"), "Pirates");
    assert.equal(shortTeamName("Chicago White Sox"), "White Sox");
    assert.equal(shortTeamName("Athletics"), "Athletics");
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

  it("takes the newest games even if the feed is out of order", () => {
    const games = [
      game({ date: "2026-09-10", hits: 0, atBats: 3 }),
      game({ date: "2026-09-18", hits: 3, atBats: 4 }),
      game({ date: "2026-04-01", hits: 1, atBats: 4 }),
    ];
    const recent = mostRecent(games, 2);
    assert.deepEqual(recent.map((g) => g.date), ["2026-09-10", "2026-09-18"]);
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
  it("does not emit a two-way line that restates the box", () => {
    const crazy = generateCrazyStats({
      name: "Shohei Ohtani",
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
        ...emptyPitch(),
        games: 14,
        gamesStarted: 14,
        wins: 8,
        losses: 2,
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
    assert.equal(crazy.some((s) => s.id === "two-way"), false);
    const line = crazy.find((s) => s.id === "pitch-line");
    assert.ok(line);
    assert.match(line!.headline, /1\.79 ERA/);
    assert.match(line!.headline, /0\.95 WHIP/);
    assert.equal(/official/i.test(line!.body), false);
  });

  it("flags a 30-30 season and only-on-team when the board is passed", () => {
    const crazy = generateCrazyStats({
      id: 1,
      name: "Jazz Chisholm Jr.",
      team: "New York Yankees",
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
      teamHitters: [
        { id: 1, name: "Jazz Chisholm Jr.", line: hit({ homeRuns: 32, stolenBases: 31 }) },
        { id: 2, name: "Aaron Judge", line: hit({ homeRuns: 48, stolenBases: 4 }) },
      ],
    });
    const club = crazy.find((s) => s.id === "club-20-20");
    assert.ok(club);
    assert.equal(club!.stamp, "30-30");
    assert.match(club!.body, /Only Yankees player/);
    assert.equal(crazy.some((s) => s.id === "team-lead"), false);
  });

  it("joins a Nationals 30-30 against the franchise last before 2026", () => {
    const crazy = generateCrazyStats({
      id: 1,
      name: "CJ Abrams",
      team: "Washington Nationals",
      seasonHit: hit({
        homeRuns: 30,
        stolenBases: 30,
        avg: 0.26,
        obp: 0.33,
        slg: 0.45,
        ops: 0.78,
        atBats: 520,
      }),
      hitGames: [],
      pitchGames: [],
    });
    const since = crazy.find((s) => s.id === "franchise-since-30-30");
    assert.ok(since);
    assert.match(since!.body, /Alfonso Soriano \(2006\)/);
    assert.equal(crazy.some((s) => s.id === "franchise-first-30-30"), false);
  });

  it("names the first Cubs 40-HR / 30-SB season and the 40-HR drought", () => {
    const crazy = generateCrazyStats({
      name: "Pete Crow-Armstrong",
      team: "Chicago Cubs",
      seasonHit: hit({
        homeRuns: 44,
        stolenBases: 37,
        avg: 0.28,
        obp: 0.37,
        slg: 0.57,
        ops: 0.94,
        atBats: 550,
        games: 154,
      }),
      years: [{ year: 2025, hit: hit({ homeRuns: 31, stolenBases: 35, games: 150 }) }],
      hitGames: [],
      pitchGames: [],
    });
    const mix = crazy.find((s) => s.id === "franchise-first-40-30");
    assert.ok(mix);
    assert.match(mix!.headline, /First 40-HR \/ 30-SB season for the Cubs/);
    assert.ok(crazy.some((s) => s.id === "franchise-since-40-hr"));
    assert.ok(crazy.some((s) => s.id === "franchise-first-consecutive-30-30"));
    assert.equal(crazy.some((s) => s.id === "franchise-since-30-30"), false);
  });

  it("does not emit a restated slash team-lead", () => {
    const crazy = generateCrazyStats({
      id: 1,
      name: "Matt Olson",
      team: "Atlanta Braves",
      seasonHit: hit({
        avg: 0.272,
        obp: 0.36,
        slg: 0.54,
        ops: 0.9,
        homeRuns: 40,
        rbi: 88,
        atBats: 500,
        games: 140,
      }),
      hitGames: [],
      pitchGames: [],
      teamHitters: [
        { id: 1, name: "Matt Olson", line: hit({ homeRuns: 40, rbi: 88 }) },
        { id: 2, name: "Michael Harris II", line: hit({ homeRuns: 26, rbi: 70 }) },
      ],
      years: [
        { year: 2023, hit: hit({ homeRuns: 54, games: 150 }) },
        { year: 2024, hit: hit({ homeRuns: 29, games: 150 }) },
        { year: 2025, hit: hit({ homeRuns: 29, games: 150 }) },
      ],
    });
    assert.equal(crazy.some((s) => s.id === "team-lead"), false);
    const second = crazy.find((s) => s.id === "career-2nd-homeRuns");
    assert.ok(second);
    assert.match(second!.headline, /40 HR, 2nd-most of his career/);
    assert.match(second!.body, /54 in 2023/);
    assert.equal(/II/.test(`${second!.headline} ${second!.body}`), false);
  });

  it("names an MLB home-run lead", () => {
    const crazy = generateCrazyStats({
      name: "Kyle Schwarber",
      seasonHit: hit({ homeRuns: 45, ops: 0.9, atBats: 500, games: 140 }),
      hitGames: [],
      pitchGames: [],
      league: { homeRuns: 45, stolenBases: 50, rbi: 120, triples: 16, avg: 0.33, ops: 1.03 },
    });
    const lead = crazy.find((s) => s.id === "mlb-lead-homeRuns");
    assert.ok(lead);
    assert.equal(lead!.headline, "45 HR, MLB lead");
  });

  it("names more home runs than last year", () => {
    const crazy = generateCrazyStats({
      name: "Pete Crow-Armstrong",
      seasonHit: hit({ homeRuns: 44, stolenBases: 20, games: 140 }),
      hitGames: [],
      pitchGames: [],
      years: [{ year: 2025, hit: hit({ homeRuns: 31, games: 150 }) }],
    });
    const yoy = crazy.find((s) => s.id === "year-delta-homeRuns");
    assert.ok(yoy);
    assert.equal(yoy!.headline, "13 more HR than last year");
    assert.match(yoy!.body, /31 in 2025/);
  });

  it("names consecutive 40-HR seasons", () => {
    const crazy = generateCrazyStats({
      name: "Junior Caminero",
      seasonHit: hit({ homeRuns: 41, games: 140 }),
      hitGames: [],
      pitchGames: [],
      years: [
        { year: 2025, hit: hit({ homeRuns: 45, games: 150 }) },
        { year: 2024, hit: hit({ homeRuns: 22, games: 150 }) },
      ],
    });
    const streak = crazy.find((s) => s.id === "consecutive-40-hr");
    assert.ok(streak);
    assert.equal(streak!.headline, "41 HR");
    assert.match(streak!.body, /2 straight 40-HR seasons/);
  });

  it("names a closer line", () => {
    const crazy = generateCrazyStats({
      name: "Mason Miller",
      seasonPitch: {
        ...emptyPitch(),
        saves: 37,
        era: 1.12,
        strikeOuts: 119,
        innings: 64 + 1 / 3,
        whip: 0.85,
        kPer9: 16.6,
      },
      hitGames: [],
      pitchGames: [],
    });
    const closer = crazy.find((s) => s.id === "closer-line");
    assert.ok(closer);
    assert.match(closer!.headline, /37 SV, 1\.12 ERA/);
    assert.match(closer!.body, /119 K/);
  });

  it("does not invent a 20-20 club", () => {
    const crazy = generateCrazyStats({
      name: "Role Player",
      team: "Atlanta Braves",
      seasonHit: hit({
        homeRuns: 22,
        stolenBases: 21,
        avg: 0.25,
        obp: 0.32,
        slg: 0.42,
        ops: 0.74,
        atBats: 480,
        games: 130,
      }),
      hitGames: [],
      pitchGames: [],
    });
    assert.equal(crazy.some((s) => s.stamp === "20-20"), false);
    assert.equal(crazy.some((s) => s.id === "club-20-20"), false);
  });

  it("states a last-15 OPS split against the season", () => {
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
    const heat = crazy.find((s) => s.id === "heater-15");
    assert.ok(heat);
    assert.match(heat!.headline, /Last 15/);
    assert.match(heat!.body, /vs season/);
    assert.equal(/official/i.test(heat!.body), false);
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

describe("game crazy stat engine", () => {
  function ohferHit(over: Partial<HitLine> = {}) {
    return {
      ...hit({
        atBats: 4,
        plateAppearances: 4,
        hits: 0,
        strikeOuts: 2,
        homeRuns: 0,
        rbi: 0,
        walks: 0,
        ...over,
      }),
      summary: over.atBats === 5 ? "0-5, 3 K" : "0-4, 2 K",
    };
  }

  it("footnotes last multi on a repeat 0-fer and skips last-HR leftover", () => {
    const crazy = generateGameCrazyStats({
      name: "Michael Harris II",
      team: "Atlanta Braves",
      opponent: "Houston Astros",
      isHome: false,
      date: "2026-09-18",
      hit: ohferHit(),
      hitGames: [
        game({
          date: "2026-09-11",
          opponent: "Phillies",
          isHome: true,
          hits: 3,
          atBats: 3,
          walks: 1,
          summary: "3-3 | BB",
        }),
        game({
          date: "2026-09-14",
          opponent: "Cubs",
          isHome: false,
          hits: 1,
          atBats: 1,
          homeRuns: 1,
          summary: "1-1 | HR, BB, 2 RBI",
        }),
        game({
          date: "2026-09-16",
          opponent: "Mets",
          isHome: true,
          hits: 0,
          atBats: 4,
        }),
      ],
    });
    const ids = crazy.map((s) => s.id);
    assert.equal(ids[0], "game-ohfer");
    assert.equal(ids.includes("game-last-hr"), false);
    assert.equal(ids.includes("game-ohfer-first"), false);
    assert.equal(ids.includes("game-line"), false);
    const ohfer = crazy.find((s) => s.id === "game-ohfer")!;
    assert.match(ohfer.headline, /0-for-4, 2 K @ Astros/);
    assert.equal(ohfer.body, "Last multi-hit Sep 11.");
    assert.equal(/Olson|Phillies|3-3/.test(`${ohfer.headline} ${ohfer.body}`), false);
  });

  it("does not frame a quiet night as first 0-for-4 in two weeks", () => {
    const crazy = generateGameCrazyStats({
      name: "Michael Harris II",
      team: "Atlanta Braves",
      opponent: "Houston Astros",
      isHome: false,
      date: "2026-09-18",
      hit: ohferHit(),
      hitGames: [
        game({
          date: "2026-09-14",
          opponent: "Cubs",
          isHome: false,
          hits: 1,
          homeRuns: 1,
          atBats: 1,
        }),
      ],
    });
    assert.equal(crazy.some((s) => s.id === "game-ohfer-first"), false);
    assert.equal(crazy.some((s) => s.id === "game-last-hr"), false);
    assert.equal(crazy[0]?.id, "game-ohfer");
    assert.match(crazy[0]!.headline, /0-for-4, 2 K @ Astros/);
  });

  it("keeps the teammate as its own take, not stacked on the 0-fer", () => {
    const crazy = generateGameCrazyStats({
      name: "Michael Harris II",
      team: "Atlanta Braves",
      opponent: "Houston Astros",
      isHome: false,
      date: "2026-09-18",
      hit: ohferHit(),
      mates: [
        {
          id: 2,
          name: "Matt Olson",
          hit: hit({ atBats: 5, plateAppearances: 5, hits: 3, homeRuns: 1, rbi: 2 }),
        },
      ],
      hitGames: [
        game({
          date: "2026-09-11",
          opponent: "Phillies",
          isHome: true,
          hits: 3,
          atBats: 3,
        }),
        game({
          date: "2026-09-16",
          opponent: "Mets",
          isHome: true,
          hits: 0,
          atBats: 4,
        }),
      ],
    });
    const mate = crazy.find((s) => s.id === "game-mate");
    const ohfer = crazy.find((s) => s.id === "game-ohfer");
    assert.ok(mate);
    assert.equal(mate!.headline, "Olson went 3-for-5");
    assert.equal(mate!.body, "");
    assert.ok(ohfer);
    assert.equal(/Olson/.test(ohfer!.body), false);
    assert.ok((mate!.score ?? 0) > (ohfer!.score ?? 0));
  });

  it("says nobody had a hit when the team is 0", () => {
    const crazy = generateGameCrazyStats({
      name: "Michael Harris II",
      team: "Atlanta Braves",
      opponent: "Houston Astros",
      isHome: false,
      date: "2026-09-18",
      hit: ohferHit(),
      mates: [{ id: 2, name: "Matt Olson", hit: hit({ atBats: 5, hits: 0 }) }],
      hitGames: [],
    });
    assert.equal(crazy[0]?.id, "game-nobody");
    assert.match(crazy[0]!.headline, /Nobody had a hit @ Astros/);
    assert.equal(crazy.some((s) => s.id === "game-ohfer"), false);
    assert.equal(crazy.some((s) => s.id === "game-mate"), false);
  });

  it("prefers last multi as the season leftover", () => {
    const crazy = generateCrazyStats({
      name: "Michael Harris II",
      team: "Atlanta Braves",
      hitGames: [
        game({
          date: "2026-09-11",
          opponent: "Phillies",
          isHome: true,
          hits: 3,
          atBats: 3,
          summary: "3-3 | BB",
        }),
        game({
          date: "2026-09-14",
          opponent: "Cubs",
          isHome: false,
          hits: 1,
          homeRuns: 1,
          atBats: 1,
          summary: "1-1 | HR",
        }),
      ],
      pitchGames: [],
    });
    assert.equal(crazy[0]?.id, "last-multi");
    assert.match(crazy[0]!.headline, /Last multi-hit Sep 11 vs Phillies/);
    assert.match(crazy[0]!.body, /3-3/);
    assert.equal(crazy.some((s) => s.id === "last-hr"), false);
  });

  it("names the reverse cycle as a Cubs first", () => {
    const crazy = generateGameCrazyStats({
      name: "Pete Crow-Armstrong",
      team: "Chicago Cubs",
      opponent: "Colorado Rockies",
      isHome: true,
      date: "2026-06-15",
      hit: hit({
        atBats: 4,
        plateAppearances: 4,
        hits: 4,
        doubles: 1,
        triples: 1,
        homeRuns: 1,
      }),
    });
    const hist = crazy.find((s) => s.id === "historic-game");
    assert.ok(hist);
    assert.match(hist!.headline, /reverse natural cycle/i);
    assert.equal(hist!.stamp, "CLUB FIRST");
    assert.equal(crazy[0]?.id, "historic-game");
  });

  it("names a multi-homer night and the last time it happened", () => {
    const crazy = generateGameCrazyStats({
      name: "Shohei Ohtani",
      team: "Los Angeles Dodgers",
      opponent: "Cubs",
      isHome: false,
      date: "2026-09-01",
      hit: {
        ...hit({
          atBats: 4,
          plateAppearances: 5,
          hits: 3,
          homeRuns: 2,
          rbi: 4,
          walks: 1,
          strikeOuts: 1,
        }),
        summary: "3-4, 2 HR, 4 RBI",
      },
      seasonHit: hit({ homeRuns: 30, games: 134, atBats: 502 }),
      hitGames: [
        game({
          date: "2026-06-11",
          opponent: "Giants",
          isHome: true,
          hits: 3,
          homeRuns: 2,
          atBats: 4,
          summary: "3-4 | 2 HR",
        }),
      ],
    });
    const hr = crazy.find((s) => s.id === "game-hr");
    assert.ok(hr);
    assert.equal(hr!.stamp, "MULTI-HR");
    assert.match(hr!.body, /First since/);
    assert.match(hr!.body, /Jun 11/);
    assert.equal(/vs |@ /.test(hr!.body), false);
    assert.equal(/Season HR/.test(hr!.body), false);
  });

  it("flags a 5-hit game with a steal and the previous one", () => {
    const crazy = generateGameCrazyStats({
      name: "Elly De La Cruz",
      team: "Cincinnati Reds",
      opponent: "Cubs",
      isHome: true,
      date: "2026-09-18",
      hit: {
        ...hit({
          atBats: 5,
          plateAppearances: 5,
          hits: 5,
          stolenBases: 1,
          homeRuns: 0,
        }),
        summary: "5-5 | SB",
      },
      hitGames: [
        game({
          date: "2025-07-04",
          opponent: "Pirates",
          isHome: false,
          hits: 5,
          stolenBases: 1,
          atBats: 5,
          summary: "5-5 | SB",
        }),
      ],
    });
    const feat = crazy.find((s) => s.id === "game-hits-sb");
    assert.ok(feat);
    assert.match(feat!.headline, /5 hits and 1 SB/);
    assert.match(feat!.body, /First since/);
    assert.match(feat!.body, /2025/);
  });

  it("names the last Cubs cycle when someone hits one", () => {
    const crazy = generateGameCrazyStats({
      name: "Pete Crow-Armstrong",
      team: "Chicago Cubs",
      opponent: "Rockies",
      isHome: true,
      date: "2026-06-15",
      hit: hit({
        atBats: 5,
        hits: 4,
        doubles: 1,
        triples: 1,
        homeRuns: 1,
      }),
    });
    const cycle = crazy.find((s) => s.id === "game-cycle");
    assert.ok(cycle);
    assert.match(cycle!.body, /Carson Kelly/);
  });

  it("names the last home run instead of restating the box", () => {
    const crazy = generateGameCrazyStats({
      name: "Matt Olson",
      team: "Atlanta Braves",
      opponent: "Detroit Tigers",
      isHome: true,
      date: "2026-09-18",
      hit: {
        ...hit({
          atBats: 5,
          plateAppearances: 5,
          hits: 3,
          homeRuns: 1,
          rbi: 2,
          runs: 2,
        }),
        summary: "3-5 | HR, 2 RBI, 2 R",
      },
      hitGames: [
        game({
          date: "2026-09-06",
          opponent: "Mets",
          isHome: false,
          hits: 1,
          homeRuns: 1,
          atBats: 4,
          summary: "1-4 | HR",
        }),
      ],
    });
    const hr = crazy.find((s) => s.id === "game-hr-since");
    assert.ok(hr);
    assert.match(hr!.body, /First since Sep 6/);
    assert.equal(/Phillies|3-5/.test(hr!.body), false);
    assert.match(hr!.headline, /^HR /);
    assert.equal(crazy.some((s) => s.id === "game-line"), false);
    assert.equal(crazy.some((s) => /official/i.test(`${s.headline} ${s.body}`)), false);
  });

  it("skips a tied hit lead", () => {
    const crazy = generateGameCrazyStats({
      name: "Matt Olson",
      team: "Atlanta Braves",
      opponent: "Houston Astros",
      isHome: false,
      date: "2026-09-18",
      hit: {
        ...hit({ atBats: 5, plateAppearances: 5, hits: 3, homeRuns: 1, rbi: 2 }),
        summary: "3-5 | HR, 2 RBI, 2 R",
      },
      mates: [
        { id: 2, name: "Michael Harris II", hit: hit({ atBats: 4, hits: 3, homeRuns: 0 }) },
        { id: 3, name: "Austin Riley", hit: hit({ atBats: 4, hits: 1, homeRuns: 1 }) },
      ],
      hitGames: [
        game({
          date: "2026-09-13",
          opponent: "Phillies",
          isHome: true,
          hits: 3,
          homeRuns: 1,
          atBats: 5,
          summary: "3-5 | HR, 3 RBI, R",
        }),
      ],
    });
    assert.equal(crazy.some((s) => s.id === "game-team-hits"), false);
    assert.equal(crazy.some((s) => /Tied with Harris/.test(s.body)), false);
    const hr = crazy.find((s) => s.id === "game-hr-since");
    assert.ok(hr);
  });

  it("names a unique team-high hit game", () => {
    const crazy = generateGameCrazyStats({
      name: "Wyatt Jenkins",
      team: "Milwaukee Brewers",
      opponent: "Los Angeles Angels",
      isHome: false,
      date: "2026-09-18",
      hit: {
        ...hit({ atBats: 4, plateAppearances: 4, hits: 3, homeRuns: 1 }),
        summary: "3-4 | HR",
      },
      mates: [{ id: 2, name: "Teammate", hit: hit({ atBats: 4, hits: 1 }) }],
    });
    const teamHits = crazy.find((s) => s.id === "game-team-hits");
    assert.ok(teamHits);
    assert.match(teamHits!.body, /Team-high 3 hits/);
    assert.equal(/Tied/.test(teamHits!.body), false);
  });

  it("names 2 HR and a triple", () => {
    const crazy = generateGameCrazyStats({
      name: "Pete Crow-Armstrong",
      team: "Chicago Cubs",
      opponent: "Rockies",
      isHome: true,
      date: "2026-06-15",
      hit: hit({
        atBats: 5,
        plateAppearances: 5,
        hits: 4,
        homeRuns: 2,
        triples: 1,
        doubles: 0,
      }),
    });
    const mix = crazy.find((s) => s.id === "game-hr-3b");
    assert.ok(mix);
    assert.match(mix!.headline, /2 HR and a triple vs Rockies/);
  });

  it("names 2 HR and 2 steals", () => {
    const crazy = generateGameCrazyStats({
      name: "Ronald Acuna Jr.",
      team: "Atlanta Braves",
      opponent: "Mets",
      isHome: true,
      date: "2026-08-01",
      hit: hit({
        atBats: 5,
        plateAppearances: 5,
        hits: 3,
        homeRuns: 2,
        stolenBases: 2,
      }),
    });
    const mix = crazy.find((s) => s.id === "game-hr-sb");
    assert.ok(mix);
    assert.match(mix!.headline, /2 HR and 2 SB vs Mets/);
  });

  it("names a reliever 3-strikeout outing", () => {
    const crazy = generateGameCrazyStats({
      name: "Raisel Iglesias",
      team: "Atlanta Braves",
      opponent: "Mets",
      isHome: true,
      date: "2026-09-18",
      pitch: {
        ...emptyPitch(),
        innings: 1,
        strikeOuts: 3,
        earnedRuns: 0,
        summary: "1 IP, 0 ER, 3 K",
      },
    });
    const gem = crazy.find((s) => s.id === "game-pitch");
    assert.ok(gem);
    assert.match(gem!.headline, /1 IP, 0 ER, 3 K vs Mets/);
    assert.match(gem!.body, /3-strikeout outing/);
  });

  it("returns a no-line fallback when they have not played", () => {
    const crazy = generateGameCrazyStats({
      name: "Bench Bat",
      opponent: "Mets",
      isHome: true,
    });
    assert.equal(crazy[0]?.id, "game-dnp");
    assert.match(crazy[0].headline, /Did not play/);
    assert.equal(/official/i.test(crazy[0].body), false);
  });
});
