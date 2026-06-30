import type { FinalJudgement, JudgeComment, Scenario } from "./types";
import { scoreAxes } from "./gameRules";

const controlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const unsafePattern =
  /(殺害|虐殺|自殺|性的|児童|差別|ヘイト|中傷|住所|電話番号|爆弾|薬物|詐欺|個人情報|クレジットカード|password|secret|access key)/i;

export class UserInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserInputError";
  }
}

export function getMaxExcuseLength() {
  return Number.parseInt(process.env.MAX_EXCUSE_LENGTH ?? "600", 10);
}

export function validateExcuse(input: unknown): string {
  if (typeof input !== "string") {
    throw new UserInputError("言い訳を入力してください。");
  }

  const value = input.trim();
  if (value.length === 0) {
    throw new UserInputError("言い訳は1文字以上で入力してください。");
  }

  if (value.length > getMaxExcuseLength()) {
    throw new UserInputError(`言い訳は${getMaxExcuseLength()}文字以内で入力してください。`);
  }

  if (controlCharacterPattern.test(value)) {
    throw new UserInputError("制御文字を含む入力は使えません。");
  }

  if (safetyStatus(value) === "reject") {
    throw new UserInputError("安全性の理由でこの言い訳は送信できません。表現を変えてください。");
  }

  return value;
}

export function safetyStatus(text: string): "allow" | "reject" {
  return unsafePattern.test(text) ? "reject" : "allow";
}

export function ensureSafeGeneratedText(text: string) {
  if (safetyStatus(text) === "reject") {
    throw new Error("Generated content failed safety validation.");
  }
}

export function assertScenario(value: Scenario): Scenario {
  const fields = [value.worldType, value.incident, value.defendantRole, value.angryParty];
  if (fields.some((field) => typeof field !== "string" || field.trim().length < 2)) {
    throw new Error("Scenario is missing required fields.");
  }
  ensureSafeGeneratedText(fields.join("\n"));
  return value;
}

export function assertJudgeComment(value: JudgeComment): JudgeComment {
  if (!["prosecutor", "defender", "crowd"].includes(value.role)) {
    throw new Error("Judge role is invalid.");
  }
  if (typeof value.displayName !== "string" || typeof value.comment !== "string") {
    throw new Error("Judge comment is missing text fields.");
  }
  for (const axis of scoreAxes) {
    const score = value.axisScores[axis];
    if (!Number.isInteger(score) || score < 0 || score > 20) {
      throw new Error(`Judge score for ${axis} is out of range.`);
    }
  }
  ensureSafeGeneratedText(`${value.displayName}\n${value.comment}`);
  return value;
}

export function assertFinalJudgement(value: FinalJudgement): FinalJudgement {
  if (!Number.isInteger(value.totalScore) || value.totalScore < 0 || value.totalScore > 100) {
    throw new Error("Final score is out of range.");
  }
  if (!["S", "A", "B", "C", "D", "E", "EX"].includes(value.rank)) {
    throw new Error("Rank is invalid.");
  }
  ensureSafeGeneratedText(`${value.finalComment}\n${value.improvementPoint}`);
  return value;
}
