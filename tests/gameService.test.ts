import { beforeEach, describe, expect, it } from "vitest";
import { MockTextClient } from "@/src/ai/mockClient";
import type { AiTextClient, GenerateTextRequest } from "@/src/ai/textClient";
import { AiGenerationError } from "@/src/ai/textClient";
import { clearMemorySessionsForTests, MemorySessionStore } from "@/src/storage/memorySessionStore";
import { startGame, submitExcuse } from "@/src/services/gameService";

class FailingClient implements AiTextClient {
  calls = 0;

  async generateText(_request: GenerateTextRequest): Promise<string> {
    this.calls += 1;
    return "{}";
  }
}

describe("game service", () => {
  beforeEach(() => {
    clearMemorySessionsForTests();
  });

  it("creates a scenario and completes a result with three judges", async () => {
    const store = new MemorySessionStore();
    const aiClient = new MockTextClient();
    const started = await startGame({ store, aiClient });
    const result = await submitExcuse(
      {
        sessionId: started.sessionId,
        excuse: "発進ボタンに見えたのは事実です。ただ、全員の安全確認を先に行い、被害説明と再発防止策を今すぐ提出します。"
      },
      { store, aiClient }
    );

    expect(result.sessionId).toBe(started.sessionId);
    expect(result.judgeComments).toHaveLength(3);
    expect(result.finalJudgement.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.finalJudgement.totalScore).toBeLessThanOrEqual(100);
  });

  it("does not retry AI validation forever", async () => {
    const store = new MemorySessionStore();
    const aiClient = new FailingClient();

    await expect(startGame({ store, aiClient })).rejects.toBeInstanceOf(AiGenerationError);
    expect(aiClient.calls).toBe(2);
  });
});
