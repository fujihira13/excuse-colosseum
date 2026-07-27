import { afterEach, describe, expect, it } from "vitest";
import { UpdateCommand, type UpdateCommandOutput } from "@aws-sdk/lib-dynamodb";
import {
  DailyPlayLimitError,
  DynamoDailyPlayLimit,
  tokyoDateKey
} from "@/src/usage/dailyPlayLimit";

class FakeDynamoDocumentClient {
  commands: UpdateCommand[] = [];
  playCount = 1;
  rejectWithLimit = false;

  async send(command: UpdateCommand): Promise<UpdateCommandOutput> {
    this.commands.push(command);
    if (this.rejectWithLimit) {
      const error = new Error("limit");
      error.name = "ConditionalCheckFailedException";
      throw error;
    }
    return {
      $metadata: {},
      Attributes: {
        playCount: this.playCount
      }
    };
  }
}

const envBackup = { ...process.env };

afterEach(() => {
  process.env = { ...envBackup };
});

describe("daily play limit", () => {
  it("uses the Tokyo calendar date for the daily counter", () => {
    expect(tokyoDateKey(new Date("2026-07-27T14:59:59.000Z"))).toBe("2026-07-27");
    expect(tokyoDateKey(new Date("2026-07-27T15:00:00.000Z"))).toBe("2026-07-28");
  });

  it("increments the shared account counter atomically", async () => {
    process.env.GAME_SESSIONS_TABLE = "GameSessions";
    process.env.PLAY_LIMIT_PER_DAY = "20";
    const client = new FakeDynamoDocumentClient();
    client.playCount = 7;
    const limiter = new DynamoDailyPlayLimit(client);

    await expect(limiter.consume("cognito-subject", new Date("2026-07-27T01:00:00.000Z"))).resolves.toBe(7);
    expect(client.commands[0]?.input).toMatchObject({
      TableName: "GameSessions",
      Key: {
        sessionId: "daily-usage#cognito-subject#2026-07-27"
      },
      ConditionExpression: "attribute_not_exists(#playCount) OR #playCount < :limit",
      ExpressionAttributeValues: {
        ":limit": 20
      }
    });
  });

  it("returns a clear error after the twentieth game", async () => {
    process.env.GAME_SESSIONS_TABLE = "GameSessions";
    process.env.PLAY_LIMIT_PER_DAY = "20";
    const client = new FakeDynamoDocumentClient();
    client.rejectWithLimit = true;
    const limiter = new DynamoDailyPlayLimit(client);

    await expect(limiter.consume("cognito-subject")).rejects.toEqual(
      expect.objectContaining<Partial<DailyPlayLimitError>>({
        name: "DailyPlayLimitError",
        limit: 20
      })
    );
  });
});
