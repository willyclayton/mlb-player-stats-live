import { fmtAvg, fmtEra, fmtIp, fmtOps, slash } from "./format";
import {
  aggregateHits,
  aggregatePitches,
  hittingStreak,
  homerStreak,
  iso,
  isTwoWay,
  lastN,
  multiHitGames,
  scorelessStarts,
} from "./stats";
import type { CrazyStat, GameHit, GamePitch, HitLine, PitchLine } from "./types";

type Input = {
  name: string;
  nickname?: string;
  team?: string;
  position?: string;
  seasonHit?: HitLine;
  seasonPitch?: PitchLine;
  hitGames: GameHit[];
  pitchGames: GamePitch[];
};

function who(input: Input): string {
  return input.nickname || input.name.split(" ").pop() || input.name;
}

function push(list: CrazyStat[], stat: CrazyStat | null | undefined) {
  if (stat && stat.score >= 18) list.push(stat);
}

function take(
  partial: Omit<CrazyStat, "score"> & { score: number },
): CrazyStat {
  return partial;
}

export function generateCrazyStats(input: Input): CrazyStat[] {
  const stats: CrazyStat[] = [];
  const first = who(input);
  const full = input.name;
  const hit = input.seasonHit;
  const pitch = input.seasonPitch;
  const last7 = input.hitGames.length ? aggregateHits(lastN(input.hitGames, 7)) : undefined;
  const last15 = input.hitGames.length ? aggregateHits(lastN(input.hitGames, 15)) : undefined;
  const last30 = input.hitGames.length ? aggregateHits(lastN(input.hitGames, 30)) : undefined;
  const last3p = input.pitchGames.length
    ? aggregatePitches(lastN(input.pitchGames, 3))
    : undefined;
  const last5p = input.pitchGames.length
    ? aggregatePitches(lastN(input.pitchGames, 5))
    : undefined;

  if (isTwoWay(input.position, hit, pitch) && hit && pitch && pitch.innings >= 10) {
    push(
      stats,
      take({
        id: "two-way",
        score: 98,
        stamp: "NOT A REAL PERSON",
        category: "two-way",
        headline: `${full} is doing both jobs`,
        body: `${full} is slashing ${slash(hit)} with ${hit.homeRuns} homers — and also owns a ${fmtEra(pitch.era)} ERA over ${fmtIp(pitch.innings)} innings with ${pitch.strikeOuts} punchouts. Position players pitch as a gag. This is a rotation arm who also bats third.`,
        receipts: [
          { label: "Slash", value: slash(hit) },
          { label: "HR", value: String(hit.homeRuns) },
          { label: "ERA", value: fmtEra(pitch.era) },
          { label: "K", value: String(pitch.strikeOuts) },
          { label: "IP", value: fmtIp(pitch.innings) },
        ],
      }),
    );
  }

  if (hit && hit.homeRuns >= 20 && hit.stolenBases >= 20) {
    const club = hit.homeRuns >= 40 && hit.stolenBases >= 40
      ? "40-40"
      : hit.homeRuns >= 30 && hit.stolenBases >= 30
        ? "30-30"
        : "20-20";
    push(
      stats,
      take({
        id: "club-20-20",
        score: club === "40-40" ? 96 : club === "30-30" ? 90 : 78,
        stamp: `${club} CLUB`,
        category: "rare",
        headline: `${first} is living in the ${club}`,
        body: `${full} has ${hit.homeRuns} home runs and ${hit.stolenBases} stolen bases. That is a ${club} season. Most hitters pick a lane. ${first} took both ramps and did not signal.`,
        receipts: [
          { label: "HR", value: String(hit.homeRuns) },
          { label: "SB", value: String(hit.stolenBases) },
          { label: "OPS", value: fmtOps(hit.ops) },
        ],
      }),
    );
  }

  if (hit && last15 && last15.atBats >= 25 && last15.ops - hit.ops >= 0.15) {
    const delta = last15.ops - hit.ops;
    push(
      stats,
      take({
        id: "heater-15",
        score: Math.min(94, 55 + Math.round(delta * 120)),
        stamp: "FLIPPED A SWITCH",
        category: "heater",
        headline: `${first} is a different hitter right now`,
        body: `Over the last ${last15.games} games, ${full} is slashing ${slash(last15)} — a ${fmtOps(last15.ops)} OPS, ${Math.round(delta * 1000)} points hotter than the season line (${fmtOps(hit.ops)}). Somebody left the stove on.`,
        receipts: [
          { label: "L15 OPS", value: fmtOps(last15.ops) },
          { label: "Season OPS", value: fmtOps(hit.ops) },
          { label: "L15 HR", value: String(last15.homeRuns) },
          { label: "L15 AVG", value: fmtAvg(last15.avg) },
        ],
      }),
    );
  }

  if (last7 && last7.atBats >= 12 && last7.ops >= 1.05) {
    push(
      stats,
      take({
        id: "nuclear-7",
        score: Math.min(93, 60 + Math.round((last7.ops - 1) * 80) + last7.homeRuns * 4),
        stamp: "NUCLEAR WEEK",
        category: "heater",
        headline: `${first} just went nuclear`,
        body: `Last ${last7.games} games: ${last7.hits}-for-${last7.atBats}, ${last7.homeRuns} homers, ${last7.rbi} RBI, ${fmtOps(last7.ops)} OPS. Pitchers have been serving batting practice and ${first} did not send a thank-you note.`,
        receipts: [
          { label: "L7", value: `${last7.hits}-${last7.atBats}` },
          { label: "HR", value: String(last7.homeRuns) },
          { label: "RBI", value: String(last7.rbi) },
          { label: "OPS", value: fmtOps(last7.ops) },
        ],
      }),
    );
  }

  const streak = hittingStreak(input.hitGames);
  if (streak >= 8) {
    push(
      stats,
      take({
        id: "hit-streak",
        score: Math.min(92, 40 + streak * 4),
        stamp: `${streak}-GAME STREAK`,
        category: "streak",
        headline: `${first} will not make an out before a hit`,
        body: `${full} has a hit in ${streak} straight games. Streaks like this are less "hot" and more "the baseball is legally obligated to find grass."`,
        receipts: [
          { label: "Streak", value: `${streak} G` },
          { label: "L15 AVG", value: last15 ? fmtAvg(last15.avg) : "—" },
        ],
      }),
    );
  }

  const hrStreak = homerStreak(input.hitGames);
  if (hrStreak >= 3) {
    push(
      stats,
      take({
        id: "hr-streak",
        score: 70 + hrStreak * 6,
        stamp: "GOING DEEP",
        category: "power",
        headline: `${first} is treating baseballs like golf balls`,
        body: `Home runs in ${hrStreak} consecutive games. The ballpark dimensions are becoming a suggestion.`,
        receipts: [{ label: "HR streak", value: `${hrStreak} G` }],
      }),
    );
  }

  if (hit && hit.homeRuns >= 30 && hit.ops >= 0.85) {
    push(
      stats,
      take({
        id: "middle-order-menace",
        score: 72 + Math.min(20, hit.homeRuns - 30),
        stamp: "MIDDLE-ORDER MENACE",
        category: "power",
        headline: `${hit.homeRuns} bombs and they still have to pitch to ${first}`,
        body: `${full} has ${hit.homeRuns} home runs, ${hit.rbi} RBI, and a ${fmtOps(hit.ops)} OPS. That is not a supporting actor. That is the plot.`,
        receipts: [
          { label: "HR", value: String(hit.homeRuns) },
          { label: "RBI", value: String(hit.rbi) },
          { label: "OPS", value: fmtOps(hit.ops) },
          { label: "AB/HR", value: hit.homeRuns ? (hit.atBats / hit.homeRuns).toFixed(1) : "—" },
        ],
      }),
    );
  }

  if (hit && hit.stolenBases >= 25) {
    const rate =
      hit.stolenBases + hit.caughtStealing > 0
        ? hit.stolenBases / (hit.stolenBases + hit.caughtStealing)
        : 0;
    push(
      stats,
      take({
        id: "burner",
        score: 60 + hit.stolenBases,
        stamp: "BURNER",
        category: "speed",
        headline: `${first} is a stolen-base problem`,
        body: `${hit.stolenBases} steals${hit.caughtStealing ? ` against ${hit.caughtStealing} caught` : ""}${rate >= 0.8 ? ` — a ${(rate * 100).toFixed(0)}% success rate` : ""}. Catchers are throwing things. The things are not arriving.`,
        receipts: [
          { label: "SB", value: String(hit.stolenBases) },
          { label: "CS", value: String(hit.caughtStealing) },
          { label: "SB%", value: rate ? `${Math.round(rate * 100)}%` : "—" },
        ],
      }),
    );
  }

  if (hit && hit.atBats >= 150 && hit.walks >= hit.strikeOuts && hit.walks >= 40) {
    push(
      stats,
      take({
        id: "eye",
        score: 74,
        stamp: "THE EYE",
        category: "rare",
        headline: `${first} walks more than they whiff`,
        body: `${hit.walks} walks. ${hit.strikeOuts} strikeouts. In 2026 that split is a collector's item. ${full} is treating the zone like a lease agreement.`,
        receipts: [
          { label: "BB", value: String(hit.walks) },
          { label: "SO", value: String(hit.strikeOuts) },
          { label: "OBP", value: fmtAvg(hit.obp) },
        ],
      }),
    );
  }

  if (hit && hit.atBats >= 200) {
    const power = iso(hit);
    if (power >= 0.22) {
      push(
        stats,
        take({
          id: "iso",
          score: 58 + Math.round(power * 80),
          stamp: "EXTRA BASES ONLY",
          category: "power",
          headline: `${first}'s singles are a rounding error`,
          body: `ISO of ${fmtAvg(power)}. That's slugging ${fmtAvg(hit.slg)} on a ${fmtAvg(hit.avg)} average — ${hit.doubles} doubles, ${hit.triples} triples, ${hit.homeRuns} homers. Contact is happening in the cheap seats.`,
          receipts: [
            { label: "ISO", value: fmtAvg(power) },
            { label: "2B", value: String(hit.doubles) },
            { label: "3B", value: String(hit.triples) },
            { label: "HR", value: String(hit.homeRuns) },
          ],
        }),
      );
    }
  }

  if (last30 && last30.games >= 20) {
    const multi = multiHitGames(lastN(input.hitGames, 30));
    if (multi >= 10) {
      push(
        stats,
        take({
          id: "multi-hit",
          score: 50 + multi * 3,
          stamp: "BARREL MACHINE",
          category: "heater",
          headline: `${first} is collecting hits in bunches`,
          body: `${multi} multi-hit games in the last ${last30.games} played. That's not a heater. That's a subscription.`,
          receipts: [
            { label: "Multi-hit", value: `${multi}/${last30.games}` },
            { label: "L30 AVG", value: fmtAvg(last30.avg) },
          ],
        }),
      );
    }
  }

  const latestHit = input.hitGames[input.hitGames.length - 1];
  if (latestHit && (latestHit.homeRuns >= 2 || latestHit.hits >= 4 || (latestHit.hits >= 3 && latestHit.homeRuns >= 1))) {
    push(
      stats,
      take({
        id: "last-game",
        score: 64 + latestHit.homeRuns * 8 + latestHit.hits * 2,
        stamp: "LAST TIME OUT",
        category: "heater",
        headline: `${first} just posted a video-game line`,
        body: `${latestHit.date}: ${latestHit.hits}-for-${latestHit.atBats}, ${latestHit.homeRuns} HR, ${latestHit.rbi} RBI${latestHit.summary ? ` (${latestHit.summary})` : ""} against ${latestHit.opponent}. The box score looks photoshopped.`,
        receipts: [
          { label: "Line", value: latestHit.summary || `${latestHit.hits}-${latestHit.atBats}` },
          { label: "Opp", value: latestHit.opponent },
        ],
      }),
    );
  }

  if (hit && hit.babip != null && hit.babip >= 0.36 && hit.atBats >= 200) {
    push(
      stats,
      take({
        id: "babip",
        score: 52,
        stamp: "EVERY BALL FINDS GRASS",
        category: "rare",
        headline: `${first}'s BABIP is in cartoon territory`,
        body: `A ${fmtAvg(hit.babip)} BABIP on ${hit.hits} hits. Some of that is skill. Some of that is the infielders aging in dog years.`,
        receipts: [
          { label: "BABIP", value: fmtAvg(hit.babip) },
          { label: "AVG", value: fmtAvg(hit.avg) },
        ],
      }),
    );
  }

  if (hit && last15 && last15.atBats >= 20 && hit.ops - last15.ops >= 0.2 && last15.ops <= 0.65) {
    push(
      stats,
      take({
        id: "ice-cold",
        score: 48,
        stamp: "SEARCHING",
        category: "split",
        headline: `${first} is due — or haunted`,
        body: `Season OPS ${fmtOps(hit.ops)}, last ${last15.games} games ${fmtOps(last15.ops)}. The live data says the bat went quiet. The crazy stat is how loud the season still looks around it.`,
        receipts: [
          { label: "Season OPS", value: fmtOps(hit.ops) },
          { label: "L15 OPS", value: fmtOps(last15.ops) },
        ],
      }),
    );
  }

  if (pitch && pitch.innings >= 40 && pitch.era <= 2.5) {
    push(
      stats,
      take({
        id: "ace-era",
        score: Math.min(95, 70 + Math.round((2.5 - pitch.era) * 18)),
        stamp: "UNFAIR",
        category: "pitching",
        headline: `${fmtEra(pitch.era)} ERA. That is bullying.`,
        body: `${full} has thrown ${fmtIp(pitch.innings)} innings with a ${fmtEra(pitch.era)} ERA and a ${pitch.whip.toFixed(2)} WHIP. League-average offense came to the park. It did not get to swing in peace.`,
        receipts: [
          { label: "ERA", value: fmtEra(pitch.era) },
          { label: "WHIP", value: pitch.whip.toFixed(2) },
          { label: "IP", value: fmtIp(pitch.innings) },
          { label: "K", value: String(pitch.strikeOuts) },
        ],
      }),
    );
  }

  if (pitch && pitch.innings >= 20 && pitch.kPer9 >= 11) {
    push(
      stats,
      take({
        id: "k9",
        score: 68 + Math.round((pitch.kPer9 - 11) * 6),
        stamp: "WHIFF FACTORY",
        category: "pitching",
        headline: `${first} is allergic to contact`,
        body: `${pitch.kPer9.toFixed(1)} K/9 and ${pitch.strikeOuts} strikeouts. Hitters are paying admission to fan. That's a business model.`,
        receipts: [
          { label: "K/9", value: pitch.kPer9.toFixed(1) },
          { label: "K", value: String(pitch.strikeOuts) },
          { label: "K/BB", value: pitch.kBb.toFixed(2) },
        ],
      }),
    );
  }

  if (pitch && pitch.innings >= 30 && pitch.whip <= 0.95) {
    push(
      stats,
      take({
        id: "whip",
        score: 80,
        stamp: "NOBODY ON BASE",
        category: "pitching",
        headline: `${first}'s WHIP is a rounding error`,
        body: `${pitch.whip.toFixed(2)} WHIP across ${fmtIp(pitch.innings)} innings. Traffic is a rumor. The infield could bring a crossword.`,
        receipts: [
          { label: "WHIP", value: pitch.whip.toFixed(2) },
          { label: "H", value: String(pitch.hits) },
          { label: "BB", value: String(pitch.walks) },
        ],
      }),
    );
  }

  const quiet = scorelessStarts(input.pitchGames);
  if (quiet >= 2 && last3p) {
    push(
      stats,
      take({
        id: "scoreless",
        score: 58 + quiet * 8,
        stamp: "ZEROS",
        category: "pitching",
        headline: `${first} keeps hanging zeros`,
        body: `${quiet} straight outings with no earned runs. Last ${last3p.games}: ${fmtIp(last3p.innings)} IP, ${last3p.earnedRuns} ER, ${last3p.strikeOuts} K.`,
        receipts: [
          { label: "Scoreless", value: `${quiet} GS` },
          { label: "L3 ERA", value: fmtEra(last3p.era) },
        ],
      }),
    );
  }

  if (last3p && last3p.innings >= 12 && last5p && pitch && last3p.era + 1.2 <= pitch.era) {
    push(
      stats,
      take({
        id: "pitcher-heater",
        score: 70,
        stamp: "LOCKED IN",
        category: "pitching",
        headline: `${first} just found another gear`,
        body: `Last 3 outings: ${fmtEra(last3p.era)} ERA, ${last3p.strikeOuts} K, ${last3p.walks} BB. Season ERA sits at ${fmtEra(pitch.era)}. The live data says the stuff is playing up.`,
        receipts: [
          { label: "L3 ERA", value: fmtEra(last3p.era) },
          { label: "Season ERA", value: fmtEra(pitch.era) },
          { label: "L3 K", value: String(last3p.strikeOuts) },
        ],
      }),
    );
  }

  if (stats.length === 0 && hit && hit.games >= 10) {
    push(
      stats,
      take({
        id: "baseline-hit",
        score: 30,
        stamp: "THE LIVE LINE",
        category: "split",
        headline: `${full}'s 2026, pulled live`,
        body: `${slash(hit)}, ${hit.homeRuns} HR, ${hit.stolenBases} SB, ${hit.rbi} RBI over ${hit.games} games. Not every line is cartoonish. This one is just stubbornly real.`,
        receipts: [
          { label: "Slash", value: slash(hit) },
          { label: "HR", value: String(hit.homeRuns) },
          { label: "SB", value: String(hit.stolenBases) },
        ],
      }),
    );
  }

  if (stats.length === 0 && pitch && pitch.games >= 3) {
    push(
      stats,
      take({
        id: "baseline-pitch",
        score: 30,
        stamp: "THE LIVE LINE",
        category: "pitching",
        headline: `${full} on the mound, live`,
        body: `${fmtEra(pitch.era)} ERA, ${pitch.whip.toFixed(2)} WHIP, ${pitch.strikeOuts} K in ${fmtIp(pitch.innings)} innings. The feed is current. The zeros (or the traffic) are earned.`,
        receipts: [
          { label: "ERA", value: fmtEra(pitch.era) },
          { label: "WHIP", value: pitch.whip.toFixed(2) },
          { label: "K", value: String(pitch.strikeOuts) },
        ],
      }),
    );
  }

  if (stats.length === 0) {
    stats.push(
      take({
        id: "thin",
        score: 10,
        stamp: "THIN FILE",
        category: "rare",
        headline: `Live data came back quiet on ${full}`,
        body: `The MLB feed does not have enough 2026 volume yet to invent a myth. Tap back after they play — crazy stats need at-bats (or outs) to chew on.`,
        receipts: [],
      }),
    );
  }

  return stats.sort((a, b) => b.score - a.score);
}
