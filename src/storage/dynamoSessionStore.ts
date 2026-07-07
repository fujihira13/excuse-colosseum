import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  type GetCommandOutput,
  PutCommand,
  type PutCommandOutput
} from "@aws-sdk/lib-dynamodb";
import type { GameSessionRecord } from "../domain/types";
import type { SessionStore } from "./sessionStore";

const defaultRegion = "ap-northeast-1";

type DynamoDocumentClientLike = {
  send(command: PutCommand): Promise<PutCommandOutput>;
  send(command: GetCommand): Promise<GetCommandOutput>;
};

function createDocumentClient(region: string): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
    marshallOptions: {
      removeUndefinedValues: true
    }
  });
}

export class DynamoSessionStore implements SessionStore {
  private readonly client: DynamoDocumentClientLike;
  private readonly tableName: string;

  constructor(client?: DynamoDocumentClientLike) {
    const tableName = process.env.GAME_SESSIONS_TABLE;
    if (!tableName) {
      throw new Error("GAME_SESSIONS_TABLE is required when using DynamoDB storage.");
    }

    this.tableName = tableName;
    this.client = client ?? createDocumentClient(process.env.AWS_REGION || defaultRegion);
  }

  async putSession(record: GameSessionRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: record
      })
    );
  }

  async getSession(sessionId: string): Promise<GameSessionRecord | null> {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { sessionId }
      })
    );

    return response.Item ? (response.Item as GameSessionRecord) : null;
  }
}
