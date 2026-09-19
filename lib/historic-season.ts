import hitCatalog from "../data/historic-season-facts-2026.json";
import pitchCatalog from "../data/historic-pitch-facts-2026.json";
import type { SeasonJoin } from "./historic-firsts";
import type { HitLine, PitchLine } from "./types";

export type SeasonLive = {
  hit?: HitLine;
  pitch?: PitchLine;
  lastYearHit?: { homeRuns: number; stolenBases: number };
};

type CatalogFact = (typeof hitCatalog.facts)[number] | (typeof pitchCatalog.facts)[number];

type EmitRule = {
  feat: string;
  priority: number;
  stamp: "CLUB FIRST" | "CLUB RECORD" | "FIRST SINCE";
  ok: (live: SeasonLive, fact: CatalogFact) => boolean;
  headline?: (fact: CatalogFact, live: SeasonLive) => string;
};

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  while (
    parts.length > 1 &&
    /^(jr|sr|ii|iii|iv|v)[.]?$/i.test(parts[parts.length - 1] ?? "")
  ) {
    parts.pop();
  }
  return (parts[parts.length - 1] || name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function xbh(hit?: HitLine): number {
  if (!hit) return 0;
  return hit.doubles + hit.triples + hit.homeRuns;
}

const RULES: EmitRule[] = [
  {
    feat: "Cubs LHB single-season HR record",
    priority: 20,
    stamp: "CLUB RECORD",
    ok: (live) => (live.hit?.homeRuns ?? 0) >= 43,
  },
  {
    feat: "Youngest Cub to 40 HR",
    priority: 30,
    stamp: "CLUB RECORD",
    ok: (live) => (live.hit?.homeRuns ?? 0) >= 40,
  },
  {
    feat: "Most HR by a Cub age 24 or younger (tie)",
    priority: 35,
    stamp: "CLUB RECORD",
    ok: (live) => (live.hit?.homeRuns ?? 0) >= 44,
    headline: (fact, live) =>
      (live.hit?.homeRuns ?? 0) > 44
        ? "Most HR by a Cub age 24 or younger"
        : fact.headline,
  },
  {
    feat: "Cubs LHB single-season extra-base hits record",
    priority: 40,
    stamp: "CLUB RECORD",
    ok: (live) => xbh(live.hit) >= 81,
  },
  {
    feat: "First consecutive 40-HR seasons for the Rays",
    priority: 10,
    stamp: "CLUB FIRST",
    ok: (live) => (live.hit?.homeRuns ?? 0) >= 40 && (live.lastYearHit?.homeRuns ?? 0) >= 40,
  },
  {
    feat: "Consecutive 40-HR seasons in age-22-or-younger seasons",
    priority: 25,
    stamp: "FIRST SINCE",
    ok: (live) => (live.hit?.homeRuns ?? 0) >= 40 && (live.lastYearHit?.homeRuns ?? 0) >= 40,
  },
  {
    feat: "Tied Phillies record for 40-HR seasons",
    priority: 20,
    stamp: "CLUB RECORD",
    ok: (live) => (live.hit?.homeRuns ?? 0) >= 40,
  },
  {
    feat: "franchise-era-record-qualified",
    priority: 10,
    stamp: "CLUB RECORD",
    ok: (live) =>
      (live.pitch?.innings ?? 0) >= 150 &&
      (live.pitch?.era ?? 99) > 0 &&
      (live.pitch?.era ?? 99) <= 2.36,
  },
  {
    feat: "mlb-fastest-to-200k",
    priority: 15,
    stamp: "FIRST SINCE",
    ok: (live) => (live.pitch?.strikeOuts ?? 0) >= 200,
  },
  {
    feat: "franchise-fastest-to-200k",
    priority: 18,
    stamp: "CLUB RECORD",
    ok: (live) => (live.pitch?.strikeOuts ?? 0) >= 200,
  },
  {
    feat: "franchise-whip-record",
    priority: 22,
    stamp: "CLUB RECORD",
    ok: (live) =>
      (live.pitch?.innings ?? 0) >= 150 &&
      (live.pitch?.whip ?? 99) > 0 &&
      (live.pitch?.whip ?? 99) <= 0.94,
  },
  {
    feat: "franchise-era-since",
    priority: 12,
    stamp: "FIRST SINCE",
    ok: (live, fact) => {
      const era = live.pitch?.era ?? 99;
      const ip = live.pitch?.innings ?? 0;
      if (ip < 150 || era <= 0) return false;
      if (fact.previousYear === 1995) return era < 2.2;
      return era < 2.46;
    },
  },
  {
    feat: "franchise-k-since",
    priority: 20,
    stamp: "FIRST SINCE",
    ok: (live) => (live.pitch?.strikeOuts ?? 0) >= 200,
  },
  {
    feat: "franchise-wins-since",
    priority: 16,
    stamp: "FIRST SINCE",
    ok: (live) => (live.pitch?.wins ?? 0) >= 17,
  },
  {
    feat: "franchise-reliever-k-record",
    priority: 14,
    stamp: "CLUB RECORD",
    ok: (live) =>
      (live.pitch?.strikeOuts ?? 0) >= 112 &&
      (live.pitch?.gamesStarted ?? 0) <= 2,
  },
];

function bodyFor(fact: CatalogFact): string {
  if (!fact.previousPlayer) return "";
  return fact.previousYear ? `${fact.previousPlayer} (${fact.previousYear}).` : `${fact.previousPlayer}.`;
}

/** Named 2026 franchise records / firsts, gated against the live line. */
export function joinHistoricSeason(name: string, live: SeasonLive): SeasonJoin[] {
  const who = lastName(name);
  const facts = [...hitCatalog.facts, ...pitchCatalog.facts].filter(
    (fact) => fact.confidence === "high" && lastName(fact.player) === who,
  );
  const hits: { fact: CatalogFact; rule: EmitRule }[] = [];
  for (const fact of facts) {
    const rule = RULES.find((row) => row.feat === fact.feat);
    if (!rule || !rule.ok(live, fact)) continue;
    hits.push({ fact, rule });
  }
  hits.sort(
    (a, b) =>
      a.rule.priority - b.rule.priority || a.fact.headline.localeCompare(b.fact.headline),
  );
  return hits.slice(0, 2).map((row, i) => {
    const headline = row.rule.headline?.(row.fact, live) ?? row.fact.headline;
    const prevYear = row.fact.previousYear;
    return {
      id: i === 0 ? "historic-season" : "historic-season-2",
      stamp: row.rule.stamp,
      headline,
      body: bodyFor(row.fact),
      receipts:
        prevYear != null
          ? [{ label: "Since", value: String(prevYear) }]
          : [],
    };
  });
}
