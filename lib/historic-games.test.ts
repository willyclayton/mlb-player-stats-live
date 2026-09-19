import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { joinHistoricGame } from "./historic-games";

describe("historic game catalog", () => {
  it("joins PCA's reverse cycle as a Cubs first", () => {
    const joins = joinHistoricGame("Pete Crow-Armstrong", "2026-06-15");
    assert.ok(joins.length >= 1);
    assert.equal(joins[0]?.id, "historic-game");
    assert.match(joins[0]!.headline, /reverse natural cycle/i);
    assert.equal(joins[0]!.stamp, "CLUB FIRST");
  });

  it("joins Bleday's road cycle as a first since 1915", () => {
    const joins = joinHistoricGame("JJ Bleday", "2026-08-22");
    assert.ok(joins.some((j) => /1915|Heinie Groh|road cycle/i.test(`${j.headline} ${j.body}`)));
  });

  it("returns nothing for a quiet night", () => {
    assert.deepEqual(joinHistoricGame("Matt Olson", "2026-09-18"), []);
  });
});
