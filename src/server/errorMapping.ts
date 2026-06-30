import { AiGenerationError } from "../ai/textClient";
import { UserInputError } from "../domain/validation";
import { NotFoundError } from "../services/gameService";

export function errorToHttp(error: unknown) {
  if (error instanceof UserInputError) {
    return { statusCode: 400, message: error.message };
  }
  if (error instanceof NotFoundError) {
    return { statusCode: 404, message: error.message };
  }
  if (error instanceof AiGenerationError) {
    return { statusCode: 502, message: "AIの応答を検証できませんでした。時間を置いて再試行してください。" };
  }

  return { statusCode: 500, message: "処理に失敗しました。時間を置いて再試行してください。" };
}
