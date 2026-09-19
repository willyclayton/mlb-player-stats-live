import Link from "next/link";
import { Headshot } from "./Headshot";
import { playerHref } from "@/lib/href";
import type { Heater, PlayerRef } from "@/lib/types";

export function PlayerCard({
  player,
  gamePk,
}: {
  player: PlayerRef;
  gamePk?: number;
}) {
  return (
    <Link className="player-card" href={playerHref(player, gamePk)}>
      <Headshot id={player.id} name={player.name} />
      <div>
        <div className="name">{player.name}</div>
        <div className="sub">
          {[player.teamAbbr || player.team, player.position].filter(Boolean).join(" · ")}
        </div>
      </div>
    </Link>
  );
}

export function LeaderCard({ player }: { player: Heater }) {
  return (
    <Link className="leader" href={playerHref(player)}>
      <Headshot id={player.id} name={player.name} size={180} />
      <div>
        <div className="val">
          {player.value}
          {player.label ? ` ${player.label}` : ""}
        </div>
        <div className="name">{player.name}</div>
        <div className="muted">{player.teamAbbr || player.team}</div>
      </div>
    </Link>
  );
}
