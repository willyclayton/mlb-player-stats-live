import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nearTie, rarity } from "./scoring-playbook";
import type { CrazyStat } from "./types";

function stat(id: string, over: Partial<CrazyStat> = {}): CrazyStat {
  return {
    id,
    score: 0,
    stamp: "",
    headline: "",
    body: "",
    category: "rare",
    receipts: [],
    ...over,
  };
}

describe("Will's A/B playbook", () => {
  it("1B team lead with a named gap beats 2nd-most, and it was close", () => {
    const a = stat("career-2nd-homeRuns", { headline: "40 HR, 2nd-most of his career" });
    const b = stat("team-lead", {
      body: "Harris is 14 back in HR.",
      receipts: [{ label: "Leads", value: "2" }],
    });
    assert.ok(rarity(b) > rarity(a));
    assert.ok(nearTie(a, b));
  });

  it("2A career-best ERA beats a two-way line that restates the box", () => {
    const a = stat("career-best-era");
    const b = stat("two-way");
    assert.ok(rarity(a) > rarity(b));
    assert.equal(nearTie(a, b), false);
  });

  it("3B career 2nd-most beats a 5-day first-since", () => {
    const a = stat("game-hr-since", {
      body: "First since Sep 13 vs Phillies (3-5 | HR).",
      receipts: [
        { label: "HR", value: "1" },
        { label: "Days", value: "5" },
      ],
    });
    const b = stat("career-2nd-homeRuns");
    assert.ok(rarity(b) > rarity(a));
    assert.equal(nearTie(a, b), false);
  });

  it("4B first 20-HR season of a career beats a 2-HR first-since", () => {
    const a = stat("game-hr", {
      receipts: [
        { label: "HR", value: "2" },
        { label: "Days", value: "60" },
      ],
    });
    const b = stat("career-first-homeRuns", { receipts: [{ label: "Bar", value: "20" }] });
    assert.ok(rarity(b) > rarity(a));
  });

  it("5B career-high HR beats career-high doubles, and it was close", () => {
    const a = stat("career-high-doubles");
    const b = stat("career-high-homeRuns");
    assert.ok(rarity(b) > rarity(a));
    assert.ok(nearTie(a, b));
  });

  it("6B cycle beats 5-hit plus a steal", () => {
    const a = stat("game-hits-sb", { receipts: [{ label: "H", value: "5" }] });
    const b = stat("game-cycle");
    assert.ok(rarity(b) > rarity(a));
  });

  it("7B a named hit-lead tie beats only-steal, and it was close", () => {
    const a = stat("game-only-sb");
    const b = stat("game-team-hits");
    assert.ok(rarity(b) > rarity(a));
    assert.ok(nearTie(a, b));
  });

  it("8B an 11-game streak beats a last-15 heater, and it was close", () => {
    const a = stat("heater-15", {
      receipts: [
        { label: "L15 OPS", value: "1.186" },
        { label: "Season", value: "0.766" },
      ],
    });
    const b = stat("hit-streak", { receipts: [{ label: "Streak", value: "11 G" }] });
    assert.ok(rarity(b) > rarity(a));
    assert.ok(nearTie(a, b));
  });

  it("9B last HR beats an 0-fer", () => {
    const a = stat("game-ohfer");
    const b = stat("game-last-hr");
    assert.ok(rarity(b) > rarity(a));
    assert.equal(nearTie(a, b), false);
  });

  it("season leftover last multi beats last HR; game leftover last HR beats last multi", () => {
    assert.ok(rarity(stat("last-multi")) > rarity(stat("last-hr")));
    assert.ok(rarity(stat("game-last-hr")) > rarity(stat("game-last-multi")));
  });

  it("first 0-for-4 in two weeks and nobody-had-a-hit beat leftover last HR", () => {
    assert.ok(rarity(stat("game-ohfer-first")) > rarity(stat("game-last-hr")));
    assert.ok(rarity(stat("game-nobody")) > rarity(stat("game-ohfer")));
    assert.ok(rarity(stat("game-mate")) > rarity(stat("game-ohfer")));
  });

  it("10B career-best ERA beats a club-only 30-30, and it was close", () => {
    const a = stat("club-20-20", { stamp: "30-30" });
    const b = stat("career-best-era");
    assert.ok(rarity(b) > rarity(a));
    assert.ok(nearTie(a, b));
  });

  it("keep/skip: MLB HR lead and first 30-30 outrank a restated two-way line", () => {
    assert.ok(rarity(stat("mlb-lead-homeRuns")) > rarity(stat("two-way")));
    assert.ok(rarity(stat("career-first-30-30")) > rarity(stat("club-20-20", { stamp: "30-30" })));
    assert.ok(rarity(stat("game-hr-sb")) > rarity(stat("game-hr", { receipts: [{ label: "HR", value: "2" }] })));
    assert.ok(rarity(stat("game-ohfer")) > rarity(stat("game-dnp")));
    assert.ok(rarity(stat("mlb-lead-avg")) > rarity(stat("career-high-triples")));
    assert.ok(rarity(stat("mlb-lead-rbi")) > rarity(stat("career-high-homeRuns")));
  });
});
