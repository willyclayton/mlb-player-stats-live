import type { PlayerRef } from "./types";

export function playerHref(player: Pick<PlayerRef, "id">, gamePk?: number): string {
  return gamePk ? `/player/${player.id}?game=${gamePk}` : `/player/${player.id}`;
}

export function gameHref(gamePk: number): string {
  return `/game/${gamePk}`;
}
