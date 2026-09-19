import catalog from "../data/historic-game-facts-2026.json";
import type { SeasonJoin } from "./historic-firsts";

type CatalogFact = (typeof catalog.facts)[number];

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

function prettyIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function rankFact(fact: CatalogFact): number {
  if (!fact.previous) return 0;
  const year = Number(String(fact.previous.date).slice(0, 4));
  return Number.isFinite(year) ? year : 9999;
}

/** High-confidence sourced first-since / franchise-first game facts for a live box. */
export function joinHistoricGame(name: string, date?: string): SeasonJoin[] {
  if (!date) return [];
  const who = lastName(name);
  const hits = catalog.facts.filter(
    (fact) => fact.confidence === "high" && fact.date === date && lastName(fact.player) === who,
  );
  hits.sort((a, b) => rankFact(a) - rankFact(b) || a.headline.localeCompare(b.headline));
  return hits.slice(0, 2).map((fact, i) => {
    const first = !fact.previous;
    const prev = fact.previous
      ? `${fact.previous.player}, ${prettyIso(fact.previous.date)}.`
      : "";
    return {
      id: i === 0 ? "historic-game" : "historic-game-2",
      stamp: first ? (fact.scope === "MLB" ? "FIRST EVER" : "CLUB FIRST") : "FIRST SINCE",
      headline: fact.headline,
      body: prev,
      receipts: first
        ? []
        : [{ label: "Since", value: String(fact.previous?.date).slice(0, 4) }],
    };
  });
}
