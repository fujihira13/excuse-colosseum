import { BedrockRuntimeClient, ConverseCommand, type ConverseCommandOutput } from "@aws-sdk/client-bedrock-runtime";
import type { AiTextClient, GenerateTextRequest } from "./textClient";

const defaultRegion = "ap-northeast-1";
const defaultModelId = "anthropic.claude-haiku-4-5-20251001-v1:0";
const defaultTemperature = 0.8;
const defaultMaxTokens = 1200;

type BedrockRuntime = {
  send(command: ConverseCommand): Promise<ConverseCommandOutput>;
};

function parseNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function extractGeneratedText(response: ConverseCommandOutput): string {
  const text = response.output?.message?.content?.find((content) => "text" in content)?.text;
  if (!text) {
    throw new Error("Bedrock response did not contain text output.");
  }
  return text;
}

export class BedrockTextClient implements AiTextClient {
  private readonly client: BedrockRuntime;
  readonly modelId: string;
  readonly region: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(client?: BedrockRuntime) {
    this.region = process.env.AWS_REGION || defaultRegion;
    this.modelId = process.env.BEDROCK_MODEL_ID || defaultModelId;
    this.temperature = parseNumberEnv("BEDROCK_TEMPERATURE", defaultTemperature);
    this.maxTokens = parseNumberEnv("BEDROCK_MAX_TOKENS", defaultMaxTokens);
    this.client = client ?? new BedrockRuntimeClient({ region: this.region });
  }

  async generateText(request: GenerateTextRequest): Promise<string> {
    const response = await this.client.send(
      new ConverseCommand({
        modelId: this.modelId,
        system: [{ text: request.system }],
        messages: [
          {
            role: "user",
            content: [{ text: request.user }]
          }
        ],
        inferenceConfig: {
          temperature: this.temperature,
          maxTokens: this.maxTokens
        }
      })
    );

    return extractGeneratedText(response);
  }
}
