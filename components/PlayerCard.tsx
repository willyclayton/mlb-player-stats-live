import Link from "next/link";
import { Headshot } from "./Headshot";
import { playerHref } from "@/lib/href";
import type { Heater, PlayerRef, TopStatCard } from "@/lib/types";

export function PlayerCard({
  player,
  gamePk,
}: {
  player: PlayerRef;
  gamePk?: number;
}) {
  return (
    <Link className={`player-card${player.topStat ? " top" : ""}`} href={playerHref(player, gamePk)}>
      <Headshot id={player.id} name={player.name} />
      <div>
        {player.topStat ? <div className="top-tag">Top stat</div> : null}
        <div className="name">{player.name}</div>
        <div className="sub">
          {player.topStat || [player.teamAbbr || player.team, player.position].filter(Boolean).join(" · ")}
        </div>
      </div>
    </Link>
  );
}

export function TopCard({ player }: { player: TopStatCard }) {
  return (
    <Link className="top-card" href={playerHref(player, player.gamePk)}>
      <Headshot id={player.id} name={player.name} size={180} />
      <div>
        <div className="top-tag">Top stat</div>
        <div className="name">{player.name}</div>
        <div className="feat">{player.feat}</div>
        <div className="muted">
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
