import { fmtEra } from "./format";
import type { CrazyStat, HitLine, PitchLine, YearLine } from "./types";

const SEASON = 2026;

export type CareerInput = {
  seasonHit?: HitLine;
  seasonPitch?: PitchLine;
  years?: YearLine[];
};

function take(
  partial: Omit<CrazyStat, "score"> & { score?: number },
): CrazyStat {
  return { score: 0, ...partial };
}

function priorHitYears(years: YearLine[], minGames = 10): { year: number; line: HitLine }[] {
  return years
    .filter((y) => y.year < SEASON && y.hit && y.hit.games >= minGames)
    .map((y) => ({ year: y.year, line: y.hit! }));
}

function priorPitchYears(years: YearLine[], minIp = 20): { year: number; line: PitchLine }[] {
  return years
    .filter((y) => y.year < SEASON && y.pitch && y.pitch.innings >= minIp)
    .map((y) => ({ year: y.year, line: y.pitch! }));
}

function bestOf(
  prior: { year: number; line: HitLine }[],
  key: keyof HitLine,
): { year: number; value: number } | null {
  if (!prior.length) return null;
  return prior.reduce(
    (best, row) => {
      const value = Number(row.line[key]);
      return value > best.value ? { year: row.year, value } : best;
    },
    { year: prior[0]!.year, value: Number(prior[0]!.line[key]) },
  );
}

type CountStat = {
  key: keyof HitLine;
  noun: string;
  stamp: string;
  minHigh: number;
  minSecond: number;
  firstBars: number[];
  firstLabel: (n: number) => string;
};

const COUNT_STATS: CountStat[] = [
  {
    key: "homeRuns",
    noun: "home runs",
    stamp: "HR",
    minHigh: 12,
    minSecond: 25,
    firstBars: [20, 30, 40, 50],
    firstLabel: (n) => `${n}-home run`,
  },
  {
    key: "doubles",
    noun: "doubles",
    stamp: "2B",
    minHigh: 20,
    minSecond: 30,
    firstBars: [30, 40],
    firstLabel: (n) => `${n}-double`,
  },
  {
    key: "triples",
    noun: "triples",
    stamp: "3B",
    minHigh: 6,
    minSecond: 8,
    firstBars: [8],
    firstLabel: (n) => `${n}-triple`,
  },
  {
    key: "stolenBases",
    noun: "stolen bases",
    stamp: "SB",
    minHigh: 12,
    minSecond: 20,
    firstBars: [20, 30, 40],
    firstLabel: (n) => `${n}-stolen base`,
  },
  {
    key: "rbi",
    noun: "RBI",
    stamp: "RBI",
    minHigh: 60,
    minSecond: 80,
    firstBars: [100],
    firstLabel: (n) => `${n}-RBI`,
  },
  {
    key: "hits",
    noun: "hits",
    stamp: "H",
    minHigh: 120,
    minSecond: 150,
    firstBars: [150, 200],
    firstLabel: (n) => `${n}-hit`,
  },
];

/** Writer: career-season facts only. Ranker assigns rarity. */
export function writeCareerFacts(input: CareerInput): CrazyStat[] {
  const years = input.years ?? [];
  const hit = input.seasonHit;
  const pitch = input.seasonPitch;
  const priorHit = priorHitYears(years);
  const stats: CrazyStat[] = [];

  if (hit && priorHit.length >= 2) {
    for (const spec of COUNT_STATS) {
      const current = Number(hit[spec.key]);
      const best = bestOf(priorHit, spec.key);
      if (!best) continue;

      if (current >= spec.minHigh && current > best.value) {
        stats.push(
          take({
            id: `career-high-${spec.key}`,
            stamp: `CAREER ${spec.stamp}`,
            category: spec.key === "stolenBases" ? "speed" : spec.key === "hits" ? "heater" : "power",
            headline: `Most ${spec.noun} of his career`,
            body: `${current} this year. Previous high: ${best.value} in ${best.year}.`,
            receipts: [
              { label: spec.stamp, value: String(current) },
              { label: "Prev", value: `${best.value} ${best.year}` },
            ],
          }),
        );
        continue;
      }

      if (current >= spec.minSecond && current < best.value) {
        const place =
          [...priorHit, { year: SEASON, line: hit }]
            .sort((a, b) => Number(b.line[spec.key]) - Number(a.line[spec.key]))
            .findIndex((row) => row.year === SEASON) + 1;
        if (place === 2) {
          stats.push(
            take({
              id: `career-2nd-${spec.key}`,
              stamp: `2ND ${spec.stamp}`,
              category: "rare",
              headline: `${current} ${spec.stamp}, 2nd-most of his career`,
              body: `${best.value} in ${best.year}.`,
              receipts: [
                { label: spec.stamp, value: String(current) },
                { label: "Best", value: `${best.value} ${best.year}` },
              ],
            }),
          );
        }
      }
    }
  }

  if (hit && priorHit.length >= 1) {
    const highKeys = new Set(stats.filter((s) => s.id.startsWith("career-high-")).map((s) => s.id));
    for (const spec of COUNT_STATS) {
      if (highKeys.has(`career-high-${spec.key}`)) continue;
      const current = Number(hit[spec.key]);
      const best = bestOf(priorHit, spec.key);
      const priorMax = best?.value ?? 0;
      const crossed = spec.firstBars.filter((bar) => current >= bar && priorMax < bar).at(-1);
      if (crossed == null) continue;
      stats.push(
        take({
          id: `career-first-${spec.key}`,
          stamp: `FIRST ${spec.stamp}`,
          category: "rare",
          headline: `First ${spec.firstLabel(crossed)} season of his career`,
          body: best
            ? `Previous high: ${best.value} in ${best.year}.`
            : `First season with ${crossed}+ ${spec.noun}.`,
          receipts: [
            { label: spec.stamp, value: String(current) },
            { label: "Bar", value: String(crossed) },
          ],
        }),
      );
    }
  }

  if (hit && hit.homeRuns >= 30 && hit.stolenBases >= 30 && priorHit.length >= 1) {
    const had = priorHit.some((row) => row.line.homeRuns >= 30 && row.line.stolenBases >= 30);
    if (!had) {
      stats.push(
        take({
          id: "career-first-30-30",
          stamp: "FIRST 30-30",
          category: "rare",
          headline: `First 30-30 season of his career`,
          body: `${hit.homeRuns} HR, ${hit.stolenBases} SB.`,
          receipts: [
            { label: "HR", value: String(hit.homeRuns) },
            { label: "SB", value: String(hit.stolenBases) },
          ],
        }),
      );
    }
  }

  const priorPitch = priorPitchYears(years);
  if (pitch && pitch.strikeOuts >= 200 && priorPitch.length >= 1) {
    const bestK = priorPitch.reduce(
      (top, row) => (row.line.strikeOuts > top.line.strikeOuts ? row : top),
      priorPitch[0]!,
    );
    if (bestK.line.strikeOuts < 200) {
      stats.push(
        take({
          id: "career-first-strikeOuts",
          stamp: "FIRST K",
          category: "pitching",
          headline: `First 200-strikeout season of his career`,
          body: `${bestK.line.strikeOuts} in ${bestK.year}.`,
          receipts: [
            { label: "K", value: String(pitch.strikeOuts) },
            { label: "Prev", value: `${bestK.line.strikeOuts} ${bestK.year}` },
            { label: "Bar", value: "200" },
          ],
        }),
      );
    }
  }

  if (pitch && pitch.innings >= 40 && priorPitch.length >= 2) {
    const best = priorPitch.reduce(
      (top, row) => (row.line.era > 0 && row.line.era < top.line.era ? row : top),
      priorPitch[0]!,
    );
    if (pitch.era > 0 && pitch.era < best.line.era) {
      stats.push(
        take({
          id: "career-best-era",
          stamp: "CAREER ERA",
          category: "pitching",
          headline: `Career-best ${fmtEra(pitch.era)} ERA`,
          body: `${fmtEra(best.line.era)} in ${best.year}.`,
          receipts: [
            { label: "ERA", value: fmtEra(pitch.era) },
            { label: "Prev", value: `${fmtEra(best.line.era)} ${best.year}` },
          ],
        }),
      );
    }

    const bestK = priorPitch.reduce(
      (top, row) => (row.line.strikeOuts > top.line.strikeOuts ? row : top),
      priorPitch[0]!,
    );
    if (pitch.strikeOuts >= 120 && pitch.strikeOuts > bestK.line.strikeOuts) {
      stats.push(
        take({
          id: "career-high-strikeOuts",
          stamp: "CAREER K",
          category: "pitching",
          headline: `Most strikeouts of his career`,
          body: `${pitch.strikeOuts} this year. Previous high: ${bestK.line.strikeOuts} in ${bestK.year}.`,
          receipts: [
            { label: "K", value: String(pitch.strikeOuts) },
            { label: "Prev", value: `${bestK.line.strikeOuts} ${bestK.year}` },
          ],
        }),
      );
    }
  }

  return stats;
}
