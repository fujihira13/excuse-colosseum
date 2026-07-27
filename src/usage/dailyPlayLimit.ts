import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  type UpdateCommandOutput
} from "@aws-sdk/lib-dynamodb";

const defaultRegion = "ap-northeast-1";
const defaultDailyLimit = 20;
const counterTtlDays = 3;

type DynamoDocumentClientLike = {
  send(command: UpdateCommand): Promise<UpdateCommandOutput>;
};

export class DailyPlayLimitError extends Error {
  constructor(public readonly limit: number) {
    super(`本日のプレイ上限（${limit}回）に達しました。明日もう一度お試しください。`);
    this.name = "DailyPlayLimitError";
  }
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("ログイン情報を確認できませんでした。もう一度ログインしてください。");
    this.name = "AuthenticationRequiredError";
  }
}

function createDocumentClient(region: string): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
    marshallOptions: {
      removeUndefinedValues: true
    }
  });
}

function isConditionalCheckFailed(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ConditionalCheckFailedException"
  );
}

export function tokyoDateKey(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function getDailyPlayLimit(): number {
  const configured = Number.parseInt(process.env.PLAY_LIMIT_PER_DAY ?? String(defaultDailyLimit), 10);
  return Number.isInteger(configured) && configured > 0 ? configured : defaultDailyLimit;
}

export class DynamoDailyPlayLimit {
  private readonly client: DynamoDocumentClientLike;
  private readonly tableName: string;

  constructor(client?: DynamoDocumentClientLike) {
    const tableName = process.env.GAME_SESSIONS_TABLE;
    if (!tableName) {
      throw new Error("GAME_SESSIONS_TABLE is required for daily play limits.");
    }

    this.tableName = tableName;
    this.client = client ?? createDocumentClient(process.env.AWS_REGION || defaultRegion);
  }

  async consume(userId: string, now = new Date()): Promise<number> {
    const limit = getDailyPlayLimit();
    const dateKey = tokyoDateKey(now);
    const expiresAt = Math.floor(now.getTime() / 1000) + counterTtlDays * 24 * 60 * 60;

    try {
      const response = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            sessionId: `daily-usage#${userId}#${dateKey}`
          },
          UpdateExpression:
            "SET #recordType = :recordType, #dateKey = :dateKey, #expiresAt = :expiresAt, #playCount = if_not_exists(#playCount, :zero) + :one",
          ConditionExpression: "attribute_not_exists(#playCount) OR #playCount < :limit",
          ExpressionAttributeNames: {
            "#recordType": "recordType",
            "#dateKey": "dateKey",
            "#expiresAt": "expiresAt",
            "#playCount": "playCount"
          },
          ExpressionAttributeValues: {
            ":recordType": "dailyPlayUsage",
            ":dateKey": dateKey,
            ":expiresAt": expiresAt,
            ":zero": 0,
            ":one": 1,
            ":limit": limit
          },
          ReturnValues: "UPDATED_NEW"
        })
      );

      const playCount = response.Attributes?.playCount;
      return typeof playCount === "number" ? playCount : 1;
    } catch (error) {
      if (isConditionalCheckFailed(error)) {
        throw new DailyPlayLimitError(limit);
      }
      throw error;
    }
  }
}

let cachedLimiter: DynamoDailyPlayLimit | undefined;

export function createDailyPlayLimit(): DynamoDailyPlayLimit {
  cachedLimiter ??= new DynamoDailyPlayLimit();
  return cachedLimiter;
}
