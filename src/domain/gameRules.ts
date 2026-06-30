import type { AxisScores, FinalJudgement, JudgeRole, Rank } from "./types";

export const scoreAxes = ["説得力", "面白さ", "誠実さ", "リスク回避力", "整合性"] as const;

export const judgeProfiles: Array<{
  role: JudgeRole;
  displayName: string;
  order: number;
  stance: string;
}> = [
  {
    role: "prosecutor",
    displayName: "検察官AI",
    order: 1,
    stance: "矛盾、責任逃れ、二次被害のリスクを厳しく追及する"
  },
  {
    role: "defender",
    displayName: "弁護人AI",
    order: 2,
    stance: "言い訳の良い部分を拾い、情状酌量や改善意志を評価する"
  },
  {
    role: "crowd",
    displayName: "民衆AI",
    order: 3,
    stance: "面白さ、共感、勢い、観客受けを率直に評価する"
  }
];

export function emptyAxisScores(): AxisScores {
  return {
    説得力: 0,
    面白さ: 0,
    誠実さ: 0,
    リスク回避力: 0,
    整合性: 0
  };
}

export function clampScore(value: unknown, max = 20): number {
  const numberValue = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(max, Math.round(numberValue)));
}

export function normalizeAxisScores(input: Partial<Record<string, unknown>>): AxisScores {
  return scoreAxes.reduce<AxisScores>((scores, axis) => {
    scores[axis] = clampScore(input[axis]);
    return scores;
  }, emptyAxisScores());
}

export function aggregateJudgeScores(judgeScores: AxisScores[]): AxisScores {
  if (judgeScores.length === 0) {
    return emptyAxisScores();
  }

  return scoreAxes.reduce<AxisScores>((scores, axis) => {
    const total = judgeScores.reduce((sum, item) => sum + item[axis], 0);
    scores[axis] = clampScore(total / judgeScores.length);
    return scores;
  }, emptyAxisScores());
}

export function calculateTotalScore(axisScores: AxisScores): number {
  return clampScore(
    scoreAxes.reduce((sum, axis) => sum + axisScores[axis], 0),
    100
  );
}

export function rankFromScores(totalScore: number, axisScores: AxisScores): Rank {
  if (axisScores.面白さ >= 18 && totalScore < 50) {
    return "EX";
  }
  if (totalScore >= 90) {
    return "S";
  }
  if (totalScore >= 80) {
    return "A";
  }
  if (totalScore >= 65) {
    return "B";
  }
  if (totalScore >= 50) {
    return "C";
  }
  if (totalScore >= 35) {
    return "D";
  }
  return "E";
}

export function buildFinalJudgement(input: {
  axisScores: AxisScores;
  finalComment: string;
  improvementPoint: string;
}): FinalJudgement {
  const totalScore = calculateTotalScore(input.axisScores);
  return {
    totalScore,
    axisScores: input.axisScores,
    rank: rankFromScores(totalScore, input.axisScores),
    finalComment: input.finalComment,
    improvementPoint: input.improvementPoint
  };
}
