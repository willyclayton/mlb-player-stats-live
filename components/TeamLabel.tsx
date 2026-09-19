import { shortTeamName, teamAbbrFromName } from "@/lib/format";
import type { TeamSide } from "@/lib/types";

export function TeamLabel({
  abbr,
  name,
  fallback = "MLB",
}: {
  abbr?: string;
  name?: string;
  fallback?: string;
}) {
  const short = shortTeamName(name);
  const code = abbr || (name ? teamAbbrFromName(name) : "");
  if (!code && !short) return <span>{fallback}</span>;
  return (
    <span className="team-label">
      {code ? <span className="team-abbr">{code}</span> : null}
      {short ? <span className="team-name">{short}</span> : null}
    </span>
  );
}

export function Matchup({
  away,
  home,
}: {
  away: Pick<TeamSide, "abbr" | "name">;
  home: Pick<TeamSide, "abbr" | "name">;
}) {
  return (
    <>
      <TeamLabel abbr={away.abbr} name={away.name} />
      <span className="at"> @ </span>
      <TeamLabel abbr={home.abbr} name={home.name} />
    </>
  );
}
