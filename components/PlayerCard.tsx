import Link from "next/link";
import { Headshot } from "./Headshot";
import { TeamLabel } from "./TeamLabel";
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
          {player.topStat || (
            <>
              <TeamLabel abbr={player.teamAbbr} name={player.team} />
              {player.position ? ` · ${player.position}` : ""}
            </>
          )}
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
          <TeamLabel abbr={player.teamAbbr} name={player.team} />
          {player.position ? ` · ${player.position}` : ""}
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
        <div className="muted">
          <TeamLabel abbr={player.teamAbbr} name={player.team} />
        </div>
      </div>
    </Link>
  );
}
