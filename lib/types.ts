export type PlayerRef = {
  id: number;
  name: string;
  nickname?: string;
  team?: string;
  teamId?: number;
  teamAbbr?: string;
  position?: string;
  number?: string;
  topStat?: string;
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
  leftOnBase?: number;
};

export type GamePitch = PitchLine & {
  date: string;
  opponent: string;
  opponentId?: number;
  isHome: boolean;
  isWin?: boolean;
  summary?: string;
};

export type YearLine = {
  year: number;
  hit?: HitLine;
  pitch?: PitchLine;
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

export type LogRow = {
  date: string;
  opponent: string;
  isHome: boolean;
  line: string;
};

export type PlayerPayload = {
  player: PlayerRef & { bats?: string; throws?: string };
  seasonHit?: HitLine;
  seasonPitch?: PitchLine;
  recentHit: { last7?: HitLine; last15?: HitLine; last30?: HitLine };
  lastHitGames: LogRow[];
  seasonTakes: CrazyStat[];
  gameTakes: CrazyStat[];
  gameLabel: string;
};

export type TeamSide = {
  id: number;
  name: string;
  abbr: string;
  score?: number;
};

export type HomeGame = {
  gamePk: number;
  status: string;
  abstractState: string;
  start?: string;
  topPlayer?: string;
  home: TeamSide;
  away: TeamSide;
};

export type SlateBlock = {
  label: string;
  games: HomeGame[];
};

export type GameSide = TeamSide & { players: PlayerRef[] };

export type GamePayload = {
  gamePk: number;
  status: string;
  abstractState: string;
  date?: string;
  venue?: string;
  home: GameSide;
  away: GameSide;
};

export type TopStatCard = PlayerRef & {
  feat: string;
  gamePk?: number;
  scope?: "game" | "season";
};

export type HomePayload = {
  asOf: string;
  blocks: SlateBlock[];
  top: TopStatCard[];
};
