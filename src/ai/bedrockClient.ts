import type { AiTextClient, GenerateTextRequest } from "./textClient";

export class BedrockTextClient implements AiTextClient {
  constructor() {
    throw new Error("Bedrock integration requires adding @aws-sdk/client-bedrock-runtime in the AWS connection phase.");
  }

  async generateText(_request: GenerateTextRequest): Promise<string> {
    throw new Error("Bedrock integration is not available in the local Mock MVP dependency set.");
  }
}
