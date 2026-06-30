import { describe, expect, it } from "vitest";
import { aggregateJudgeScores, calculateTotalScore, rankFromScores } from "@/src/domain/gameRules";
import type { AxisScores } from "@/src/domain/types";

describe("game rules", () => {
  it("aggregates five scoring axes into a 0-100 total", () => {
    const scores = aggregateJudgeScores([
      { 説得力: 10, 面白さ: 12, 誠実さ: 14, リスク回避力: 16, 整合性: 18 },
      { 説得力: 20, 面白さ: 20, 誠実さ: 20, リスク回避力: 20, 整合性: 20 },
      { 説得力: 0, 面白さ: 1, 誠実さ: 2, リスク回避力: 3, 整合性: 4 }
    ]);

    expect(scores).toEqual({
      説得力: 10,
      面白さ: 11,
      誠実さ: 12,
      リスク回避力: 13,
      整合性: 14
    });
    expect(calculateTotalScore(scores)).toBe(60);
  });

  it("assigns EX for artistically terrible high-fun low-total results", () => {
    const scores: AxisScores = {
      説得力: 2,
      面白さ: 20,
      誠実さ: 4,
      リスク回避力: 3,
      整合性: 5
    };

    expect(rankFromScores(calculateTotalScore(scores), scores)).toBe("EX");
  });
});
