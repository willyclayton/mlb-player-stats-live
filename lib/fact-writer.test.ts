import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { writeCareerFacts } from "./fact-writer";
import { rankFacts, rarity } from "./fact-ranker";
import { emptyHit, emptyPitch } from "./stats";
import type { HitLine, PitchLine, YearLine } from "./types";

function hit(over: Partial<HitLine>): HitLine {
  return { ...emptyHit(), atBats: 400, games: 140, ...over };
}

function year(n: number, over: Partial<HitLine>): YearLine {
  return { year: n, hit: hit({ games: 150, ...over }) };
}

describe("career fact writer", () => {
  it("writes most doubles of his career when this year is the high", () => {
    const facts = writeCareerFacts({
      seasonHit: hit({ doubles: 44, homeRuns: 22, games: 150 }),
      years: [
        year(2023, { doubles: 28, homeRuns: 18 }),
        year(2024, { doubles: 31, homeRuns: 20 }),
        year(2025, { doubles: 36, homeRuns: 19 }),
      ],
    });
    const doubles = facts.find((s) => s.id === "career-high-doubles");
    assert.ok(doubles);
    assert.match(doubles!.headline, /Most doubles of his career/);
    assert.match(doubles!.body, /44 this year/);
    assert.match(doubles!.body, /36 in 2025/);
  });

  it("writes 2nd-most home runs when a prior season is higher", () => {
    const facts = writeCareerFacts({
      seasonHit: hit({ homeRuns: 40, doubles: 33, rbi: 88, games: 154 }),
      years: [
        year(2023, { homeRuns: 54, doubles: 27, rbi: 139 }),
        year(2024, { homeRuns: 29, doubles: 37, rbi: 98 }),
        year(2025, { homeRuns: 29, doubles: 41, rbi: 95 }),
      ],
    });
    const second = facts.find((s) => s.id === "career-2nd-homeRuns");
    assert.ok(second);
    assert.match(second!.headline, /40 HR, 2nd-most of his career/);
    assert.match(second!.body, /54 in 2023/);
    assert.equal(facts.some((s) => s.id === "career-high-homeRuns"), false);
  });

  it("writes the first 30-home run season of a career", () => {
    const facts = writeCareerFacts({
      seasonHit: hit({ homeRuns: 31, games: 140 }),
      years: [year(2024, { homeRuns: 12 }), year(2025, { homeRuns: 18 })],
    });
    const first = facts.find((s) => s.id === "career-first-homeRuns");
    const high = facts.find((s) => s.id === "career-high-homeRuns");
    assert.ok(high);
    assert.equal(first, undefined);
    assert.match(high!.headline, /Most home runs of his career/);
    assert.match(high!.body, /18 in 2025/);
  });

  it("writes a first-threshold when the high is under the career-high floor", () => {
    const facts = writeCareerFacts({
      seasonHit: hit({ homeRuns: 21, games: 130 }),
      years: [year(2025, { homeRuns: 9, games: 80 })],
    });
    const first = facts.find((s) => s.id === "career-first-homeRuns");
    assert.ok(first);
    assert.match(first!.headline, /First 20-home run season/);
    assert.match(first!.body, /9 in 2025/);
  });

  it("writes a first 30-30 season of a career", () => {
    const facts = writeCareerFacts({
      seasonHit: hit({ homeRuns: 30, stolenBases: 30, games: 140 }),
      years: [year(2024, { homeRuns: 18, stolenBases: 22 }), year(2025, { homeRuns: 19, stolenBases: 28 })],
    });
    const first = facts.find((s) => s.id === "career-first-30-30");
    assert.ok(first);
    assert.equal(first!.headline, "First 30-30 season of his career");
    assert.equal(first!.body, "30 HR, 30 SB.");
  });

  it("skips first 30-30 when a prior year already hit it", () => {
    const facts = writeCareerFacts({
      seasonHit: hit({ homeRuns: 44, stolenBases: 37, games: 150 }),
      years: [year(2025, { homeRuns: 31, stolenBases: 32 })],
    });
    assert.equal(facts.some((s) => s.id === "career-first-30-30"), false);
  });

  it("writes a first 200-strikeout season of a career", () => {
    const facts = writeCareerFacts({
      seasonPitch: {
        ...emptyPitch(),
        innings: 166,
        era: 1.89,
        strikeOuts: 243,
      },
      years: [{ year: 2025, pitch: { ...emptyPitch(), innings: 47, era: 2.87, strikeOuts: 87 } }],
    });
    const first = facts.find((s) => s.id === "career-first-strikeOuts");
    assert.ok(first);
    assert.equal(first!.headline, "First 200-strikeout season of his career");
    assert.match(first!.body, /87 in 2025/);
  });

  it("writes a career-best ERA against prior seasons", () => {
    const pitch = {
      ...emptyPitch(),
      innings: 85.7,
      era: 1.79,
      strikeOuts: 95,
      wins: 8,
      losses: 2,
    } satisfies PitchLine;
    const facts = writeCareerFacts({
      seasonPitch: pitch,
      years: [
        { year: 2022, pitch: { ...emptyPitch(), innings: 166, era: 2.33, strikeOuts: 219 } },
        { year: 2023, pitch: { ...emptyPitch(), innings: 132, era: 3.14, strikeOuts: 167 } },
        { year: 2025, pitch: { ...emptyPitch(), innings: 47, era: 2.87, strikeOuts: 62 } },
      ],
    });
    const era = facts.find((s) => s.id === "career-best-era");
    assert.ok(era);
    assert.match(era!.headline, /Career-best 1\.79 ERA/);
    assert.match(era!.body, /2\.33 in 2022/);
  });
});

describe("rarity ranker", () => {
  it("puts a career-high ahead of a last-HR leftover", () => {
    const ranked = rankFacts([
      {
        id: "last-hr",
        score: 34,
        stamp: "LAST HR",
        headline: "Last HR Sep 18",
        body: "3-5",
        category: "power",
        receipts: [],
      },
      {
        id: "career-high-doubles",
        score: 0,
        stamp: "CAREER 2B",
        headline: "Most doubles of his career",
        body: "44 this year. Previous high: 36 in 2025.",
        category: "power",
        receipts: [{ label: "2B", value: "44" }],
      },
    ]);
    assert.equal(ranked[0]?.id, "career-high-doubles");
    assert.ok(rarity(ranked[0]!) > rarity(ranked[1]!));
  });

  it("ranks a career-best ERA above a two-way line that restates the box", () => {
    assert.ok(
      rarity({
        id: "career-best-era",
        score: 0,
        stamp: "CAREER ERA",
        headline: "",
        body: "",
        category: "pitching",
        receipts: [],
      }) >
        rarity({
          id: "two-way",
          score: 0,
          stamp: "TWO-WAY",
          headline: "",
          body: "",
          category: "two-way",
          receipts: [],
        }),
    );
  });
});
