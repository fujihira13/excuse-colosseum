import type { GameSessionRecord } from "../domain/types";

export type SessionStore = {
  putSession(record: GameSessionRecord): Promise<void>;
  getSession(sessionId: string): Promise<GameSessionRecord | null>;
};
