import type { GameSessionRecord } from "../domain/types";
import type { SessionStore } from "./sessionStore";

export class DynamoSessionStore implements SessionStore {
  constructor() {
    throw new Error("DynamoDB integration requires adding @aws-sdk/client-dynamodb and @aws-sdk/lib-dynamodb in the AWS connection phase.");
  }

  async putSession(_record: GameSessionRecord): Promise<void> {
    throw new Error("DynamoDB integration is not available in the local Mock MVP dependency set.");
  }

  async getSession(_sessionId: string): Promise<GameSessionRecord | null> {
    throw new Error("DynamoDB integration is not available in the local Mock MVP dependency set.");
  }
}
