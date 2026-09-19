import type { PlayerRef } from "./types";

export function playerHref(player: Pick<PlayerRef, "id">): string {
  return `/player/${player.id}`;
}
