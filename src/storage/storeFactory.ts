import { DynamoSessionStore } from "./dynamoSessionStore";
import { MemorySessionStore } from "./memorySessionStore";
import type { SessionStore } from "./sessionStore";

let cachedStore: SessionStore | undefined;

export function createSessionStore(): SessionStore {
  if (cachedStore) {
    return cachedStore;
  }

  const wantsDynamo = process.env.STORAGE_PROVIDER === "dynamodb" || Boolean(process.env.GAME_SESSIONS_TABLE);
  cachedStore = wantsDynamo ? new DynamoSessionStore() : new MemorySessionStore();
  return cachedStore;
}

export function resetSessionStoreForTests() {
  cachedStore = undefined;
}
