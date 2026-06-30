import type { AiTextClient } from "../ai/textClient";
import { generateValidatedJson } from "../ai/textClient";
import { finalPrompt, judgePrompt, scenarioPrompt } from "../ai/prompts";
import { createAiTextClient } from "../ai/clientFactory";
import {
  aggregateJudgeScores,
  buildFinalJudgement,
  calculateTotalScore,
  judgeProfiles,
  normalizeAxisScores,
  rankFromScores
} from "../domain/gameRules";
import type { FinalJudgement, GameResult, GameSessionRecord, JudgeComment, Scenario } from "../domain/types";
import {
  assertFinalJudgement,
  assertJudgeComment,
  assertScenario,
  validateExcuse,
  UserInputError
} from "../domain/validation";
import { withTiming } from "../observability/logger";
import { createSessionStore } from "../storage/storeFactory";
import type { SessionStore } from "../storage/sessionStore";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export type GameServiceOptions = {
  aiClient?: AiTextClient;
  store?: SessionStore;
};

function ttlSecondsFromNow() {
  const ttlDays = Number.parseInt(process.env.PLAY_LOG_TTL_DAYS ?? "30", 10);
  return Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
}

function validateScenarioJson(value: unknown): Scenario {
  if (!value || typeof value !== "object") {
    throw new Error("Scenario response must be an object.");
  }
  return assertScenario(value as Scenario);
}

function validateJudgeJson(expectedRole: string, value: unknown): JudgeComment {
  if (!value || typeof value !== "object") {
    throw new Error("Judge response must be an object.");
  }

  const raw = value as Partial<JudgeComment>;
  const profile = judgeProfiles.find((judge) => judge.role === expectedRole);
  if (!profile) {
    throw new Error("Expected judge role is invalid.");
  }

  return assertJudgeComment({
    role: profile.role,
    displayName: profile.displayName,
    comment: String(raw.comment ?? ""),
    axisScores: normalizeAxisScores((raw.axisScores ?? {}) as Record<string, unknown>),
    order: profile.order
  });
}

function validateFinalJson(computed: FinalJudgement, value: unknown): FinalJudgement {
  if (!value || typeof value !== "object") {
    throw new Error("Final judgement response must be an object.");
  }

  const raw = value as Partial<FinalJudgement>;
  return assertFinalJudgement({
    ...computed,
    finalComment: String(raw.finalComment ?? ""),
    improvementPoint: String(raw.improvementPoint ?? "")
  });
}

export async function startGame(options: GameServiceOptions = {}) {
  const aiClient = options.aiClient ?? createAiTextClient();
  const store = options.store ?? createSessionStore();
  const prompt = scenarioPrompt();

  const scenario = await withTiming(
    "BedrockCall",
    { operation: "scenario", estimatedCalls: 1 },
    () =>
      generateValidatedJson({
        client: aiClient,
        request: {
          schemaName: "scenario",
          ...prompt
        },
        validate: validateScenarioJson,
        attempts: 2
      })
  );

  const now = new Date().toISOString();
  const record: GameSessionRecord = {
    sessionId: crypto.randomUUID(),
    status: "awaiting_excuse",
    scenario,
    createdAt: now,
    updatedAt: now,
    expiresAt: ttlSecondsFromNow()
  };

  await withTiming("SessionStoreWrite", { operation: "start" }, () => store.putSession(record));

  return {
    sessionId: record.sessionId,
    scenario
  };
}

export async function submitExcuse(input: { sessionId: string; excuse: unknown }, options: GameServiceOptions = {}) {
  const aiClient = options.aiClient ?? createAiTextClient();
  const store = options.store ?? createSessionStore();
  const excuse = validateExcuse(input.excuse);

  if (!input.sessionId) {
    throw new UserInputError("セッションIDが見つかりません。");
  }

  const record = await withTiming("SessionStoreRead", { operation: "submit" }, () => store.getSession(input.sessionId));
  if (!record) {
    throw new NotFoundError("ゲームセッションが見つかりません。");
  }

  if (record.status === "completed" && record.playerExcuse && record.judgeComments && record.finalJudgement) {
    return toGameResult(record);
  }

  const playerExcuse = {
    body: excuse,
    submittedAt: new Date().toISOString(),
    charCount: excuse.length
  };

  const judgeComments = await withTiming("BedrockCall", { operation: "judgeBatch", estimatedCalls: 3 }, () =>
    Promise.all(
      judgeProfiles.map((profile) => {
        const prompt = judgePrompt({
          scenario: record.scenario,
          excuse,
          role: profile.role
        });

        return generateValidatedJson({
          client: aiClient,
          request: {
            schemaName: `judge:${profile.role}`,
            ...prompt
          },
          validate: (value) => validateJudgeJson(profile.role, value),
          attempts: 2
        });
      })
    )
  );

  if (judgeComments.length !== judgeProfiles.length) {
    throw new Error("Final judgement requires all judge comments.");
  }

  const axisScores = aggregateJudgeScores(judgeComments.map((judge) => judge.axisScores));
  const totalScore = calculateTotalScore(axisScores);
  const computedFinal = buildFinalJudgement({
    axisScores,
    finalComment: "審判AIのコメント生成中です。",
    improvementPoint: "改善ポイントを生成中です。"
  });
  const prompt = finalPrompt({
    scenario: record.scenario,
    excuse,
    axisScores,
    totalScore,
    rank: rankFromScores(totalScore, axisScores)
  });

  const finalJudgement = await withTiming("BedrockCall", { operation: "final", estimatedCalls: 1 }, () =>
    generateValidatedJson({
      client: aiClient,
      request: {
        schemaName: "final",
        ...prompt
      },
      validate: (value) => validateFinalJson(computedFinal, value),
      attempts: 2
    })
  );

  const completedAt = new Date().toISOString();
  const completedRecord: GameSessionRecord = {
    ...record,
    status: "completed",
    playerExcuse,
    judgeComments,
    finalJudgement,
    completedAt,
    updatedAt: completedAt
  };

  await withTiming("SessionStoreWrite", { operation: "complete" }, () => store.putSession(completedRecord));
  return toGameResult(completedRecord);
}

export async function getGameResult(sessionId: string, options: GameServiceOptions = {}) {
  const store = options.store ?? createSessionStore();
  const record = await store.getSession(sessionId);

  if (!record) {
    throw new NotFoundError("ゲームセッションが見つかりません。");
  }

  return toGameResult(record);
}

function toGameResult(record: GameSessionRecord): GameResult {
  if (!record.playerExcuse || !record.judgeComments || !record.finalJudgement || !record.completedAt) {
    throw new NotFoundError("ゲーム結果はまだ完成していません。");
  }

  return {
    sessionId: record.sessionId,
    scenario: record.scenario,
    playerExcuse: record.playerExcuse,
    judgeComments: [...record.judgeComments].sort((a, b) => a.order - b.order),
    finalJudgement: record.finalJudgement,
    completedAt: record.completedAt
  };
}
