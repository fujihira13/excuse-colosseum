import { ConverseCommand, type ConverseCommandOutput } from "@aws-sdk/client-bedrock-runtime";
import { GetCommand, PutCommand, type GetCommandOutput, type PutCommandOutput } from "@aws-sdk/lib-dynamodb";
import { afterEach, describe, expect, it } from "vitest";
import { BedrockTextClient } from "@/src/ai/bedrockClient";
import { DynamoSessionStore } from "@/src/storage/dynamoSessionStore";
import type { GameSessionRecord } from "@/src/domain/types";

class FakeBedrockRuntime {
  command: ConverseCommand | undefined;

  async send(command: ConverseCommand): Promise<ConverseCommandOutput> {
    this.command = command;
    return {
      $metadata: {},
      output: {
        message: {
          role: "assistant",
          content: [{ text: "{\"ok\":true}" }]
        }
      },
      stopReason: "end_turn",
      usage: {
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15
      },
      metrics: {
        latencyMs: 100
      }
    };
  }
}

class FakeDynamoDocumentClient {
  commands: Array<PutCommand | GetCommand> = [];
  getOutput: GetCommandOutput = { $metadata: {} };

  async send(command: PutCommand): Promise<PutCommandOutput>;
  async send(command: GetCommand): Promise<GetCommandOutput>;
  async send(command: PutCommand | GetCommand): Promise<PutCommandOutput | GetCommandOutput> {
    this.commands.push(command);
    return command instanceof GetCommand ? this.getOutput : { $metadata: {} };
  }
}

const envBackup = { ...process.env };

afterEach(() => {
  process.env = { ...envBackup };
});

describe("BedrockTextClient", () => {
  it("reads Bedrock environment settings and returns text output", async () => {
    process.env.AWS_REGION = "ap-northeast-1";
    process.env.BEDROCK_MODEL_ID = "anthropic.claude-haiku-4-5-20251001-v1:0";
    process.env.BEDROCK_TEMPERATURE = "0.4";
    process.env.BEDROCK_MAX_TOKENS = "321";

    const fakeRuntime = new FakeBedrockRuntime();
    const client = new BedrockTextClient(fakeRuntime);
    const text = await client.generateText({
      schemaName: "scenario",
      system: "system prompt",
      user: "user prompt"
    });

    expect(text).toBe("{\"ok\":true}");
    expect(client.region).toBe("ap-northeast-1");
    expect(client.modelId).toBe("anthropic.claude-haiku-4-5-20251001-v1:0");
    expect(fakeRuntime.command?.input).toMatchObject({
      modelId: "anthropic.claude-haiku-4-5-20251001-v1:0",
      system: [{ text: "system prompt" }],
      messages: [{ role: "user", content: [{ text: "user prompt" }] }],
      inferenceConfig: {
        temperature: 0.4,
        maxTokens: 321
      }
    });
  });

  it("falls back to Claude Haiku 4.5 when model env is omitted", () => {
    delete process.env.BEDROCK_MODEL_ID;

    const client = new BedrockTextClient(new FakeBedrockRuntime());

    expect(client.modelId).toBe("anthropic.claude-haiku-4-5-20251001-v1:0");
  });
});

describe("DynamoSessionStore", () => {
  it("puts sessions into the configured DynamoDB table", async () => {
    process.env.GAME_SESSIONS_TABLE = "GameSessions";
    const fakeClient = new FakeDynamoDocumentClient();
    const store = new DynamoSessionStore(fakeClient);
    const record: GameSessionRecord = {
      sessionId: "session-1",
      status: "awaiting_excuse",
      scenario: {
        worldType: "宇宙船",
        incident: "発進ボタンを押した",
        defendantRole: "新人管制官",
        angryParty: "広報局長"
      },
      createdAt: "2026-07-07T00:00:00.000Z",
      updatedAt: "2026-07-07T00:00:00.000Z",
      expiresAt: 1780000000
    };

    await store.putSession(record);

    expect(fakeClient.commands[0]).toBeInstanceOf(PutCommand);
    expect(fakeClient.commands[0]?.input).toMatchObject({
      TableName: "GameSessions",
      Item: record
    });
  });

  it("gets sessions by sessionId and returns null when missing", async () => {
    process.env.GAME_SESSIONS_TABLE = "GameSessions";
    const fakeClient = new FakeDynamoDocumentClient();
    const store = new DynamoSessionStore(fakeClient);

    await expect(store.getSession("missing")).resolves.toBeNull();
    expect(fakeClient.commands[0]).toBeInstanceOf(GetCommand);
    expect(fakeClient.commands[0]?.input).toMatchObject({
      TableName: "GameSessions",
      Key: { sessionId: "missing" }
    });
  });
});
