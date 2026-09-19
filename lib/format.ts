export function parseRate(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/^\./, "0."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function parseInnings(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value) return 0;
  const [whole, rest] = value.split(".");
  const outs = rest ? Number(rest[0] ?? 0) : 0;
  return Number(whole || 0) + outs / 3;
}

export function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function fmtAvg(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ".000";
  return value.toFixed(3).replace(/^0/, "");
}

export function fmtOps(value: number): string {
  if (!Number.isFinite(value)) return ".000";
  return value < 1 ? value.toFixed(3).replace(/^0/, "") : value.toFixed(3);
}

export function fmtEra(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

export function fmtIp(value: number): string {
  const whole = Math.floor(value + 1e-9);
  const outs = Math.round((value - whole) * 3);
  return outs === 0 ? String(whole) : `${whole}.${outs}`;
}

export function slash(line: { avg: number; obp: number; slg: number }): string {
  return `${fmtAvg(line.avg)}/${fmtAvg(line.obp)}/${fmtAvg(line.slg)}`;
}

export function teamAbbrFromName(name?: string): string {
  if (!name) return "MLB";
  const map: Record<string, string> = {
    "Arizona Diamondbacks": "AZ",
    "Atlanta Braves": "ATL",
    "Baltimore Orioles": "BAL",
    "Boston Red Sox": "BOS",
    "Chicago Cubs": "CHC",
    "Chicago White Sox": "CWS",
    "Cincinnati Reds": "CIN",
    "Cleveland Guardians": "CLE",
    "Colorado Rockies": "COL",
    "Detroit Tigers": "DET",
    "Houston Astros": "HOU",
    "Kansas City Royals": "KC",
    "Los Angeles Angels": "LAA",
    "Los Angeles Dodgers": "LAD",
    "Miami Marlins": "MIA",
    "Milwaukee Brewers": "MIL",
    "Minnesota Twins": "MIN",
    "New York Mets": "NYM",
    "New York Yankees": "NYY",
    "Athletics": "ATH",
    "Oakland Athletics": "ATH",
    "Philadelphia Phillies": "PHI",
    "Pittsburgh Pirates": "PIT",
    "San Diego Padres": "SD",
    "San Francisco Giants": "SF",
    "Seattle Mariners": "SEA",
    "St. Louis Cardinals": "STL",
    "Tampa Bay Rays": "TB",
    "Texas Rangers": "TEX",
    "Toronto Blue Jays": "TOR",
    "Washington Nationals": "WSH",
  };
  return map[name] ?? name.split(" ").pop()?.slice(0, 3).toUpperCase() ?? "MLB";
}

export function headshotUrl(id: number, size = 213): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_${size},q_auto:best/v1/people/${id}/headshot/silo/current`;
}

export function teamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

export function todayEt(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shiftEt(days: number, from = new Date()): string {
  const [y, m, d] = todayEt(from).split("-").map(Number);
  const next = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days));
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
