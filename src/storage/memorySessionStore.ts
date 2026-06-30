import type { GameSessionRecord } from "../domain/types";
import type { SessionStore } from "./sessionStore";

const sessions = new Map<string, GameSessionRecord>();

export class MemorySessionStore implements SessionStore {
  async putSession(record: GameSessionRecord): Promise<void> {
    sessions.set(record.sessionId, structuredClone(record));
  }

  async getSession(sessionId: string): Promise<GameSessionRecord | null> {
    const record = sessions.get(sessionId);
    return record ? structuredClone(record) : null;
  }
}

export function clearMemorySessionsForTests() {
  sessions.clear();
}
