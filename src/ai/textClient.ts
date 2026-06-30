export type GenerateTextRequest = {
  schemaName: string;
  system: string;
  user: string;
};

export type AiTextClient = {
  generateText(request: GenerateTextRequest): Promise<string>;
};

export class AiGenerationError extends Error {
  constructor(
    message: string,
    public readonly details: string[]
  ) {
    super(message);
    this.name = "AiGenerationError";
  }
}

export function extractJsonObject(text: string): unknown {
  const withoutFence = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain a JSON object.");
  }

  return JSON.parse(withoutFence.slice(start, end + 1));
}

export async function generateValidatedJson<T>(input: {
  client: AiTextClient;
  request: GenerateTextRequest;
  validate: (value: unknown) => T;
  attempts?: number;
}): Promise<T> {
  const attempts = input.attempts ?? 2;
  const errors: string[] = [];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const text = await input.client.generateText(input.request);
      return input.validate(extractJsonObject(text));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new AiGenerationError("AI response could not be validated.", errors);
}
