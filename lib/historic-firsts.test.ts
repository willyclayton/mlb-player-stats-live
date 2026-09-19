import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLUB_30_30,
  CLUB_40_40,
  CLUB_50_HR,
  FIRST_40_HR,
  FIRST_CYCLE,
  LAST_3_HR,
  LAST_3_HR_WATCH,
  NEVER_3_HR,
  NEVER_30_30,
  NEVER_50_HR,
  RECENT_CYCLE_BEFORE_2026,
  franchise30_30,
  franchise40_40,
  franchise50Hr,
  franchiseCycle,
  franchiseFirst40Hr,
  join3Hr,
  joinCycle,
  joinSeasonLine,
  last3Hr,
  newFranchiseFirsts2026,
} from "./historic-firsts";

const THIRTY = [
  "AZ",
  "ATL",
  "BAL",
  "BOS",
  "CHC",
  "CWS",
  "CIN",
  "CLE",
  "COL",
  "DET",
  "HOU",
  "KC",
  "LAA",
  "LAD",
  "MIA",
  "MIL",
  "MIN",
  "NYM",
  "NYY",
  "ATH",
  "PHI",
  "PIT",
  "SD",
  "SF",
  "SEA",
  "STL",
  "TB",
  "TEX",
  "TOR",
  "WSH",
];

describe("historic franchise tables", () => {
  it("lists every 40-40 season and tags the first ever", () => {
    assert.equal(CLUB_40_40.length, 6);
    assert.equal(CLUB_40_40[0]?.player, "Jose Canseco");
    assert.match(CLUB_40_40[0]!.notes ?? "", /first ever/);
    assert.equal(franchise40_40("ATH").first?.year, 1988);
    assert.equal(franchise40_40("CHC").first, null);
  });

  it("has a 30-30 first and recent-before-2026 for each current club, or never", () => {
    for (const abbr of THIRTY) {
      const mark = franchise30_30(abbr);
      if (NEVER_30_30.includes(abbr as (typeof NEVER_30_30)[number])) {
        assert.equal(mark.first, null, abbr);
        continue;
      }
      assert.ok(mark.first, abbr);
      assert.ok(mark.recentBefore2026, abbr);
      assert.ok(mark.recentBefore2026!.year < 2026, abbr);
    }
    assert.equal(franchise30_30("WSH").first?.player, "Vladimir Guerrero");
    assert.equal(franchise30_30("WSH").recentBefore2026?.player, "Alfonso Soriano");
    assert.equal(franchise30_30("BAL").first?.year, 1922);
    assert.equal(franchise30_30("CHC").recentBefore2026?.year, 2025);
  });

  it("does not credit split 30-30 seasons to White Sox, Rangers, Royals, or Astros", () => {
    assert.equal(CLUB_30_30.some((r) => r.year === 1978), false);
    assert.equal(CLUB_30_30.some((r) => r.player.includes("Beltrán") && r.year === 2004), false);
    assert.equal(NEVER_30_30.includes("CWS"), true);
    assert.ok(franchise30_30("TEX").first);
    assert.equal(franchise30_30("HOU").first?.player, "Jeff Bagwell");
    assert.equal(franchise30_30("KC").first?.player, "Bobby Witt Jr.");
  });

  it("covers first plus recent 50-HR seasons, including never clubs", () => {
    for (const abbr of THIRTY) {
      const mark = franchise50Hr(abbr);
      if (NEVER_50_HR.includes(abbr as (typeof NEVER_50_HR)[number])) {
        assert.equal(mark.first, null, abbr);
        continue;
      }
      assert.ok(mark.first, abbr);
      assert.ok(mark.recentBefore2026, abbr);
    }
    assert.equal(franchise50Hr("NYY").first?.player, "Babe Ruth");
    assert.equal(franchise50Hr("NYY").recentBefore2026?.year, 2025);
    assert.equal(franchise50Hr("LAD").first?.year, 2024);
    assert.equal(CLUB_50_HR.some((r) => r.year === 1997 && r.hr === 58), false);
  });

  it("has a first 40-HR season for all 30 clubs", () => {
    assert.equal(FIRST_40_HR.length, 30);
    assert.deepEqual([...new Set(FIRST_40_HR.map((r) => r.teamAbbr))].sort(), [...THIRTY].sort());
    assert.equal(franchiseFirst40Hr("TEX")?.player, "Frank Howard");
    assert.equal(franchiseFirst40Hr("MIN")?.player, "Roy Sievers");
    assert.equal(franchiseFirst40Hr("PHI")?.player, "Cy Williams");
  });

  it("has first and recent-before-2026 cycles for all 30 clubs", () => {
    assert.equal(FIRST_CYCLE.length, 30);
    assert.equal(RECENT_CYCLE_BEFORE_2026.length, 30);
    assert.equal(franchiseCycle("MIL").first?.player, "Mike Hegan");
    assert.equal(franchiseCycle("MIA").first?.year, 2023);
    assert.equal(franchiseCycle("BOS").recentBefore2026?.player, "Mookie Betts");
    assert.equal(franchiseCycle("ATH").first?.player, "Harry Davis");
    assert.equal(franchiseCycle("ATH").first?.uncertain, true);
  });

  it("notes that every current franchise has had a 3-HR game", () => {
    assert.equal(NEVER_3_HR.length, 0);
    assert.equal(LAST_3_HR.length, 30);
    for (const abbr of LAST_3_HR_WATCH) {
      assert.ok(last3Hr(abbr), abbr);
    }
    assert.equal(last3Hr("NYM")?.player, "Francisco Lindor");
    assert.equal(last3Hr("CHC")?.player, "Alex Bregman");
    assert.equal(last3Hr("PHI")?.player, "Kyle Schwarber");
  });
});

describe("live season joins", () => {
  it("flags Abrams as first Nationals 30-30 since 2006, not a franchise first", () => {
    const joins = joinSeasonLine("WSH", 30, 30);
    assert.ok(joins.some((j) => j.id === "franchise-since-30-30"));
    assert.equal(joins.some((j) => j.id === "franchise-first-30-30"), false);
    assert.match(joins[0]!.body, /Alfonso Soriano \(2006\)/);
  });

  it("names consecutive 30-30 as a Cubs first when last year was also 30-30", () => {
    const joins = joinSeasonLine("CHC", 44, 37, {
      club: "Cubs",
      lastYear: { homeRuns: 31, stolenBases: 35 },
    });
    const streak = joins.find((j) => j.id === "franchise-first-consecutive-30-30");
    assert.ok(streak);
    assert.match(streak!.headline, /First consecutive 30-30 seasons for the Cubs/);
  });

  it("does not restate a Cubs 30-30 one year after PCA, but names 40-30 and the 40-HR drought", () => {
    const joins = joinSeasonLine("CHC", 44, 37, { club: "Cubs" });
    assert.equal(joins.some((j) => j.id === "franchise-since-30-30"), false);
    const mix = joins.find((j) => j.id === "franchise-first-40-30");
    assert.ok(mix);
    assert.match(mix!.headline, /First 40-HR \/ 30-SB season for the Cubs/);
    const drought = joins.find((j) => j.id === "franchise-since-40-hr");
    assert.ok(drought);
    assert.match(drought!.body, /Derrek Lee \(2005\)/);
  });

  it("would name a White Sox 30-30 as a franchise first", () => {
    const joins = joinSeasonLine("CWS", 31, 31);
    assert.equal(joins[0]?.id, "franchise-first-30-30");
  });

  it("would name a Rockies 50-HR season as a franchise first", () => {
    const joins = joinSeasonLine("COL", 50, 2);
    assert.ok(joins.some((j) => j.id === "franchise-first-50-hr"));
  });

  it("does not treat Caminero 41 HR as the Rays' first 40", () => {
    assert.equal(joinSeasonLine("TB", 41, 3).some((j) => j.id === "franchise-first-40-hr"), false);
  });

  it("finds the Cubs 40-30 first on the live 2026 board", () => {
    const live = [
      { teamAbbr: "CHC", hr: 44, sb: 37 },
      { teamAbbr: "WSH", hr: 30, sb: 30 },
      { teamAbbr: "PHI", hr: 45, sb: 3 },
      { teamAbbr: "TB", hr: 41, sb: 3 },
      { teamAbbr: "HOU", hr: 40, sb: 1 },
      { teamAbbr: "ATL", hr: 40, sb: 4 },
    ];
    assert.deepEqual(newFranchiseFirsts2026(live), [
      "CHC: First 40-HR / 30-SB season for the franchise (44 HR, 37 SB)",
    ]);
  });

  it("names the last Cubs cycle before a 2026 cycle", () => {
    const join = joinCycle("CHC");
    assert.ok(join);
    assert.match(join!.body, /Carson Kelly/);
    assert.match(join!.body, /2025/);
  });

  it("names the Mets' last 3-HR game", () => {
    const join = join3Hr("NYM");
    assert.ok(join);
    assert.match(join!.body, /Francisco Lindor/);
    assert.match(join!.body, /2021/);
  });
});
