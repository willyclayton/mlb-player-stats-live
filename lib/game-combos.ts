import table from "../data/game-combos.json";
import type { SeasonJoin } from "./historic-firsts";
import type { HitLine } from "./types";

type NamedGame = {
  player: string;
  date: string;
  team: string;
};

export type GameCombo = (typeof table.combos)[number];

type ComboMatch = {
  homeRuns?: number;
  doubles?: number;
  triples?: number;
  stolenBases?: number;
  walks?: number;
  hits?: number;
  extraBaseHits?: number;
  rbi?: number;
  cycle?: boolean;
  walkOff?: boolean;
  sameInning?: boolean;
  grandSlam?: boolean;
};

export const GAME_COMBOS_AS_OF = table.asOf;
export const GAME_COMBOS: GameCombo[] = table.combos;
export const THREE_HR_GAMES_2026 = table.threeHrGames2026;

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

function extraBaseHits(hit: HitLine): number {
  return hit.doubles + hit.triples + hit.homeRuns;
}

function isCycle(hit: HitLine): boolean {
  const singles = hit.hits - hit.doubles - hit.triples - hit.homeRuns;
  return hit.doubles >= 1 && hit.triples >= 1 && hit.homeRuns >= 1 && singles >= 1;
}

export function hitMatchesCombo(hit: HitLine, combo: GameCombo): boolean {
  const need = combo.match as ComboMatch;
  if (need.walkOff || need.sameInning || need.grandSlam) return false;
  if ((need.homeRuns ?? 0) > 0 && hit.homeRuns < need.homeRuns!) return false;
  if ((need.doubles ?? 0) > 0 && hit.doubles < need.doubles!) return false;
  if ((need.triples ?? 0) > 0 && hit.triples < need.triples!) return false;
  if ((need.stolenBases ?? 0) > 0 && hit.stolenBases < need.stolenBases!) return false;
  if ((need.walks ?? 0) > 0 && hit.walks < need.walks!) return false;
  if ((need.hits ?? 0) > 0 && hit.hits < need.hits!) return false;
  if ((need.rbi ?? 0) > 0 && hit.rbi < need.rbi!) return false;
  if ((need.extraBaseHits ?? 0) > 0 && extraBaseHits(hit) < need.extraBaseHits!) return false;
  if (need.cycle && !isCycle(hit)) return false;
  return true;
}

function namedGames(combo: GameCombo): NamedGame[] {
  const rows: NamedGame[] = [];
  const seen = new Set<string>();
  const push = (row: NamedGame | undefined) => {
    if (!row?.date || row.date.length < 8) return;
    const key = `${row.date}|${row.player}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };
  for (const row of combo.matches2026 ?? []) {
    push({ player: row.player, date: row.date, team: row.team });
  }
  push({
    player: combo.lastPlayer,
    date: combo.lastDate,
    team: combo.lastTeam,
  });
  if (combo.previous) {
    push({
      player: combo.previous.player,
      date: combo.previous.date,
      team: combo.previous.team,
    });
  }
  for (const row of combo.occurrences ?? []) {
    if (typeof row.date === "string") {
      push({ player: row.player, date: row.date, team: row.team });
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

function priorGame(combo: GameCombo, date: string): NamedGame | null {
  const before = namedGames(combo).filter((row) => row.date < date);
  return before.at(-1) ?? null;
}

/** MLB first-since join for a live box that matches a rare combo. */
export function joinGameCombo(hit: HitLine, date?: string): SeasonJoin[] {
  if (!date) return [];
  const out: SeasonJoin[] = [];
  for (const combo of GAME_COMBOS) {
    if (!combo.autoJoin) continue;
    if (combo.confidence !== "high") continue;
    if (!hitMatchesCombo(hit, combo)) continue;
    const prior = priorGame(combo, date);
    const first = !prior;
    out.push({
      id: out.length === 0 ? "game-combo" : "game-combo-2",
      stamp: first ? "FIRST EVER" : "FIRST SINCE",
      headline: first ? `First ${combo.combo} in the modern era` : combo.combo,
      body: first
        ? ""
        : `First since ${prior.player}, ${prettyIso(prior.date)}.`,
      receipts: prior
        ? [{ label: "Since", value: prior.date.slice(0, 4) }]
        : [],
    });
  }
  return out.slice(0, 2);
}

export function comboById(id: string): GameCombo | undefined {
  return GAME_COMBOS.find((row) => row.id === id);
}
