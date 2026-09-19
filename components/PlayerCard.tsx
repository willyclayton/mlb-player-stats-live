import Link from "next/link";
import { headshotUrl } from "@/lib/format";
import type { PlayerRef } from "@/lib/types";

function hrefFor(player: PlayerRef) {
  const params = new URLSearchParams();
  if (player.name) params.set("name", player.name);
  if (player.team) params.set("team", player.team);
  if (player.position) params.set("pos", player.position);
  const q = params.toString();
  return q ? `/player/${player.id}?${q}` : `/player/${player.id}`;
}

export function PlayerCard({
  player,
  value,
}: {
  player: PlayerRef;
  value?: string;
}) {
  return (
    <Link className="player-card" href={hrefFor(player)}>
      <img src={headshotUrl(player.id)} alt="" />
      <div>
        <div className="name">{player.name}</div>
        <div className="sub">
          {[player.teamAbbr || player.team, player.position].filter(Boolean).join(" · ")}
        </div>
        {value ? <div className="val" style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontSize: 20 }}>{value}</div> : null}
      </div>
    </Link>
  );
}

export function LeaderCard({
  player,
  value,
}: {
  player: PlayerRef & { value?: string };
  value?: string;
}) {
  return (
    <Link className="leader" href={hrefFor(player)}>
      <img src={headshotUrl(player.id, 180)} alt="" />
      <div>
        <div className="val">{value ?? player.value}</div>
        <div className="name" style={{ fontWeight: 700, fontSize: 13 }}>{player.name}</div>
        <div className="muted">{player.teamAbbr || player.team}</div>
      </div>
    </Link>
  );
}
