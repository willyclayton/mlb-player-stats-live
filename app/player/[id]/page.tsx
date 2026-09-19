import { PlayerClient } from "@/components/PlayerClient";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string; team?: string; pos?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <PlayerClient
      id={Number(id)}
      hintName={query.name}
      hintTeam={query.team}
      hintPos={query.pos}
    />
  );
}
