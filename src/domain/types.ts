export type ScoreAxis = "説得力" | "面白さ" | "誠実さ" | "リスク回避力" | "整合性";

export type AxisScores = Record<ScoreAxis, number>;

export type Rank = "S" | "A" | "B" | "C" | "D" | "E" | "EX";

export type JudgeRole = "prosecutor" | "defender" | "crowd";

export type GameStatus = "awaiting_excuse" | "completed" | "failed";

export type Scenario = {
  worldType: string;
  incident: string;
  defendantRole: string;
  angryParty: string;
};

export type PlayerExcuse = {
  body: string;
  submittedAt: string;
  charCount: number;
};

export type JudgeComment = {
  role: JudgeRole;
  displayName: string;
  comment: string;
  axisScores: AxisScores;
  order: number;
};

export type FinalJudgement = {
  totalScore: number;
  axisScores: AxisScores;
  rank: Rank;
  finalComment: string;
  improvementPoint: string;
};

export type GameResult = {
  sessionId: string;
  scenario: Scenario;
  playerExcuse: PlayerExcuse;
  judgeComments: JudgeComment[];
  finalJudgement: FinalJudgement;
  completedAt: string;
};

export type GameSessionRecord = {
  sessionId: string;
  status: GameStatus;
  scenario: Scenario;
  createdAt: string;
  updatedAt: string;
  expiresAt: number;
  playerExcuse?: PlayerExcuse;
  judgeComments?: JudgeComment[];
  finalJudgement?: FinalJudgement;
  completedAt?: string;
  error?: string;
};
