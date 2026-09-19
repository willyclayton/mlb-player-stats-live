import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { joinHistoricSeason } from "./historic-season";
import { emptyHit, emptyPitch } from "./stats";

describe("historic season catalog", () => {
  it("names PCA's Cubs lefty HR record vs Billy Williams, not a restated 30-30", () => {
    const joins = joinHistoricSeason("Pete Crow-Armstrong", {
      hit: {
        ...emptyHit(),
        homeRuns: 44,
        stolenBases: 37,
        doubles: 29,
        triples: 8,
      },
    });
    assert.equal(joins[0]?.id, "historic-season");
    assert.match(joins[0]!.headline, /Cubs lefty/);
    assert.match(joins[0]!.body, /Billy Williams \(1970\)/);
    assert.equal(joins[0]?.stamp, "CLUB RECORD");
    assert.ok(joins.some((j) => /Youngest Cub to 40/i.test(j.headline)));
  });

  it("names Caminero as the first Rays consecutive 40-HR seasons", () => {
    const joins = joinHistoricSeason("Junior Caminero", {
      hit: { ...emptyHit(), homeRuns: 41 },
      lastYearHit: { homeRuns: 45, stolenBases: 7 },
    });
    assert.match(joins[0]!.headline, /First consecutive 40-HR seasons for the Rays/);
    assert.equal(joins[0]?.stamp, "CLUB FIRST");
    assert.ok(joins.some((j) => /Eddie Mathews/i.test(j.body)));
  });

  it("does not emit Alvarez's 40-HR drought (already a franchise join)", () => {
    const joins = joinHistoricSeason("Yordan Alvarez", {
      hit: { ...emptyHit(), homeRuns: 40, ops: 1.031 },
    });
    assert.equal(joins.some((j) => /Bregman|40-HR season since/i.test(j.headline + j.body)), false);
  });

  it("names Misiorowski's Brewers ERA record and 2nd-fastest 200 K", () => {
    const joins = joinHistoricSeason("Jacob Misiorowski", {
      pitch: {
        ...emptyPitch(),
        innings: 166.1,
        era: 1.89,
        whip: 0.81,
        strikeOuts: 243,
      },
    });
    assert.match(joins[0]!.headline, /Lowest qualified Brewers ERA/);
    assert.match(joins[0]!.body, /Mike Caldwell \(1978\)/);
    assert.ok(joins.some((j) => /2nd-fastest to 200 K/i.test(j.headline)));
  });

  it("names Schlittler's Yankees ERA as first since Guidry 1978", () => {
    const joins = joinHistoricSeason("Cam Schlittler", {
      pitch: { ...emptyPitch(), innings: 184.2, era: 1.95, strikeOuts: 228 },
    });
    assert.match(joins[0]!.headline, /Guidry/);
    assert.match(joins[0]!.body, /1978/);
  });

  it("returns nothing for a quiet season line", () => {
    assert.deepEqual(
      joinHistoricSeason("Matt Olson", { hit: { ...emptyHit(), homeRuns: 40, stolenBases: 4 } }),
      [],
    );
  });
});
