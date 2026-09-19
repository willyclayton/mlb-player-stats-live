function ids(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
}

export function appearanceIds(boxSide: {
  battingOrder?: unknown;
  batters?: unknown;
  pitchers?: unknown;
}): number[] {
  const appeared = new Set<number>([...ids(boxSide.batters), ...ids(boxSide.pitchers)]);
  const seen = new Set<number>();
  const out: number[] = [];
  const push = (id: number) => {
    if (!id || seen.has(id) || !appeared.has(id)) return;
    seen.add(id);
    out.push(id);
  };
  for (const id of ids(boxSide.battingOrder)) push(id);
  for (const id of ids(boxSide.batters)) push(id);
  for (const id of ids(boxSide.pitchers)) push(id);
  return out;
}

export function appearedIn(
  boxSide: { batters?: unknown; pitchers?: unknown },
  playerId: number,
): boolean {
  return ids(boxSide.batters).includes(playerId) || ids(boxSide.pitchers).includes(playerId);
}
