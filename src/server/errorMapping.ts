import { AiGenerationError } from "../ai/textClient";
import { UserInputError } from "../domain/validation";
import { NotFoundError } from "../services/gameService";
import {
  AuthenticationRequiredError,
  DailyPlayLimitError
} from "../usage/dailyPlayLimit";

export function errorToHttp(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return { statusCode: 401, message: error.message };
  }
  if (error instanceof DailyPlayLimitError) {
    return { statusCode: 429, message: error.message };
  }
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
