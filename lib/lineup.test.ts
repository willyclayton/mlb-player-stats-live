import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appearanceIds, appearedIn } from "./lineup";

describe("game appearances", () => {
  it("keeps only batters and pitchers who were in the game", () => {
    const ids = appearanceIds({
      battingOrder: [1, 2, 3],
      batters: [1, 2, 3, 99],
      pitchers: [8],
    });
    assert.deepEqual(ids, [1, 2, 3, 99, 8]);
  });

  it("drops bench and bullpen ids that never appeared", () => {
    const ids = appearanceIds({
      battingOrder: [1, 2],
      batters: [1, 2],
      pitchers: [8],
    });
    assert.equal(ids.includes(50), false);
    assert.equal(appearedIn({ batters: [1, 2], pitchers: [8] }, 50), false);
    assert.equal(appearedIn({ batters: [1, 2], pitchers: [8] }, 8), true);
  });
});
