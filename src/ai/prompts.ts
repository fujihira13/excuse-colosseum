import type { AxisScores, JudgeRole, Scenario } from "../domain/types";
import { judgeProfiles, scoreAxes } from "../domain/gameRules";

const safetyRules = [
  "暴力、差別、性的内容、実在個人への中傷、違法行為助長、個人情報を含めない。",
  "ゲーム内の失敗や言い訳だけを評価し、ユーザー本人の人格を攻撃しない。",
  "返答は必ずJSONのみ。Markdown、コードフェンス、補足説明は禁止。"
].join("\n");

export function scenarioPrompt() {
  return {
    system: `あなたは日本語の即興ゲーム作家です。\n${safetyRules}`,
    user: [
      "言い訳コロシアムのお題を1つ生成してください。",
      "世界線、事件、被告の立場、怒れる相手を短く具体的にしてください。",
      "JSON schema: {\"worldType\":\"string\",\"incident\":\"string\",\"defendantRole\":\"string\",\"angryParty\":\"string\"}"
    ].join("\n")
  };
}

export function judgePrompt(input: { scenario: Scenario; excuse: string; role: JudgeRole }) {
  const profile = judgeProfiles.find((judge) => judge.role === input.role);
  if (!profile) {
    throw new Error(`Unknown judge role: ${input.role}`);
  }

  return {
    system: `あなたは${profile.displayName}です。${profile.stance}。\n${safetyRules}`,
    user: [
      "以下の言い訳を審査してください。",
      `世界線: ${input.scenario.worldType}`,
      `事件: ${input.scenario.incident}`,
      `被告: ${input.scenario.defendantRole}`,
      `怒れる相手: ${input.scenario.angryParty}`,
      `言い訳: ${input.excuse}`,
      `評価軸は${scoreAxes.join("、")}。各軸は0〜20点の整数です。`,
      `JSON schema: {"role":"${profile.role}","displayName":"${profile.displayName}","comment":"string","axisScores":{"説得力":0,"面白さ":0,"誠実さ":0,"リスク回避力":0,"整合性":0},"order":${profile.order}}`
    ].join("\n")
  };
}

export function finalPrompt(input: {
  scenario: Scenario;
  excuse: string;
  axisScores: AxisScores;
  totalScore: number;
  rank: string;
}) {
  return {
    system: `あなたは言い訳コロシアムの審判AIです。\n${safetyRules}`,
    user: [
      "審判として最終コメントと改善ポイントを出してください。",
      `世界線: ${input.scenario.worldType}`,
      `事件: ${input.scenario.incident}`,
      `言い訳: ${input.excuse}`,
      `確定スコア: ${JSON.stringify(input.axisScores)}`,
      `総合スコア: ${input.totalScore}`,
      `判定ランク: ${input.rank}`,
      "スコアとランクは変更しないでください。",
      `JSON schema: {"totalScore":${input.totalScore},"rank":"${input.rank}","finalComment":"string","improvementPoint":"string"}`
    ].join("\n")
  };
}
