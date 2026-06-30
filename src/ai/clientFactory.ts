import { BedrockTextClient } from "./bedrockClient";
import { MockTextClient } from "./mockClient";
import type { AiTextClient } from "./textClient";

let cachedClient: AiTextClient | undefined;

export function createAiTextClient(): AiTextClient {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = process.env.AI_PROVIDER === "bedrock" ? new BedrockTextClient() : new MockTextClient();
  return cachedClient;
}

export function resetAiTextClientForTests() {
  cachedClient = undefined;
}
