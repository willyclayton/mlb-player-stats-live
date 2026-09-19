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

  it("joins Báez's debut 3-HR as an MLB first", () => {
    const joins = joinHistoricGame("Joshua Báez", "2026-08-15");
    assert.ok(joins.length >= 1);
    assert.match(joins[0]!.headline, /3 homers in an MLB debut/i);
    assert.equal(joins[0]!.stamp, "CLUB FIRST");
  });

  it("joins O'Hearn's 10 RBI as a Pirates first since 1939", () => {
    const joins = joinHistoricGame("Ryan O'Hearn", "2026-07-07");
    assert.ok(joins.some((j) => /10 RBI|Johnny Rizzo|1939/i.test(`${j.headline} ${j.body}`)));
  });

  it("joins Tolle's immaculate first inning as a first since Pedro 2002", () => {
    const joins = joinHistoricGame("Payton Tolle", "2026-09-13");
    assert.ok(joins.some((j) => /immaculate|Pedro|2002/i.test(`${j.headline} ${j.body}`)));
  });

  it("returns nothing for a quiet night", () => {
    assert.deepEqual(joinHistoricGame("Matt Olson", "2026-09-18"), []);
  });

  it("joins Burleson's Yankee Stadium 3-HR game as an Interleague-era first", () => {
    const joins = joinHistoricGame("Alec Burleson", "2026-08-03");
    assert.ok(joins.some((j) => /Yankee Stadium|Interleague|1997/i.test(`${j.headline} ${j.body}`)));
  });

  it("joins Caminero's 3-HR game as first Rays since Paredes 2022", () => {
    const joins = joinHistoricGame("Junior Caminero", "2026-06-25");
    assert.ok(joins.some((j) => /Paredes|2022/i.test(`${j.headline} ${j.body}`)));
  });
});
