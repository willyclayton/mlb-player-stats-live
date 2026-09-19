export type PlayerRef = {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  team?: string;
  teamId?: number;
  teamAbbr?: string;
  position?: string;
  number?: string;
};

export type HitLine = {
  games: number;
  plateAppearances: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  caughtStealing: number;
  walks: number;
  strikeOuts: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  babip?: number;
  totalBases: number;
  hitByPitch: number;
};

export type PitchLine = {
  games: number;
  gamesStarted: number;
  wins: number;
  losses: number;
  saves: number;
  innings: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  homeRuns: number;
  walks: number;
  strikeOuts: number;
  era: number;
  whip: number;
  kPer9: number;
  bbPer9: number;
  hrPer9: number;
  kBb: number;
  opponentAvg: number;
};

export type GameHit = HitLine & {
  date: string;
  opponent: string;
  opponentId?: number;
  isHome: boolean;
  isWin?: boolean;
  summary?: string;
};

export type GamePitch = PitchLine & {
  date: string;
  opponent: string;
  opponentId?: number;
  isHome: boolean;
  isWin?: boolean;
  summary?: string;
};

export type CrazyStat = {
  id: string;
  score: number;
  stamp: string;
  headline: string;
  body: string;
  category: "heater" | "power" | "speed" | "two-way" | "pitching" | "streak" | "split" | "rare";
  receipts: { label: string; value: string }[];
};

export type PlayerPayload = {
  player: PlayerRef & {
    age?: number;
    bats?: string;
    throws?: string;
    positionName?: string;
  };
  seasonHit?: HitLine;
  seasonPitch?: PitchLine;
  recentHit: { last7?: HitLine; last15?: HitLine; last30?: HitLine };
  recentPitch: { last3?: PitchLine; last5?: PitchLine };
  lastHitGames: GameHit[];
  lastPitchGames: GamePitch[];
  crazy: CrazyStat[];
  featured: CrazyStat;
  liveNote?: string;
};

export type HomeGame = {
  gamePk: number;
  status: string;
  abstractState: string;
  venue?: string;
  home: { id: number; name: string; abbr?: string; score?: number };
  away: { id: number; name: string; abbr?: string; score?: number };
  players: PlayerRef[];
};

export type HomePayload = {
  asOf: string;
  slateLabel: string;
  games: HomeGame[];
  heaters: {
    homeRuns: (PlayerRef & { value: string })[];
    ops: (PlayerRef & { value: string })[];
    stolenBases: (PlayerRef & { value: string })[];
    era: (PlayerRef & { value: string })[];
    strikeouts: (PlayerRef & { value: string })[];
  };
};
