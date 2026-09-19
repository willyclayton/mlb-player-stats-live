"use client";

import { useMemo, useState } from "react";
import { Scoreboard } from "./Scoreboard";
import { TeamLabel } from "./TeamLabel";
import { uniqueTeams } from "@/lib/slate";
import type { SlateBlock } from "@/lib/types";

export function Slate({ blocks }: { blocks: SlateBlock[] }) {
  const [teamId, setTeamId] = useState<number | null>(null);
  const teams = useMemo(() => uniqueTeams(blocks), [blocks]);
  const shown = useMemo(
    () =>
      blocks
        .map((block) => ({
          ...block,
          games: teamId
            ? block.games.filter((game) => game.away.id === teamId || game.home.id === teamId)
            : block.games,
        }))
        .filter((block) => block.games.length),
    [blocks, teamId],
  );

  return (
    <>
      {teams.length > 2 ? (
        <div className="team-chips" role="tablist" aria-label="Filter by team">
          <button
            className={`team-chip${teamId == null ? " on" : ""}`}
            type="button"
            onClick={() => setTeamId(null)}
            aria-pressed={teamId == null}
          >
            All
          </button>
          {teams.map((team) => (
            <button
              className={`team-chip${teamId === team.id ? " on" : ""}`}
              key={team.id}
              type="button"
              onClick={() => setTeamId(team.id === teamId ? null : team.id)}
              aria-pressed={teamId === team.id}
            >
              <TeamLabel abbr={team.abbr} name={team.name} />
            </button>
          ))}
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p className="hint">No games for that team on this slate.</p>
      ) : (
        shown.map((block) => (
          <section className="section" key={block.label}>
            <h2>{block.label}</h2>
            <Scoreboard games={block.games} />
          </section>
        ))
      )}
    </>
  );
}
