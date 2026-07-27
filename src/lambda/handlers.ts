import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { errorToHttp } from "../server/errorMapping";
import { getGameResult, startGame, submitExcuse } from "../services/gameService";
import {
  AuthenticationRequiredError,
  createDailyPlayLimit
} from "../usage/dailyPlayLimit";

type JsonHandler = (event: APIGatewayProxyEventV2WithJWTAuthorizer) => Promise<APIGatewayProxyStructuredResultV2>;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8"
};

function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body)
  };
}

function parseJsonBody(event: APIGatewayProxyEventV2WithJWTAuthorizer): Record<string, unknown> {
  if (!event.body) {
    return {};
  }

  const body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  return JSON.parse(body) as Record<string, unknown>;
}

function authenticatedUserId(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
  const subject = event.requestContext.authorizer?.jwt?.claims?.sub;
  if (typeof subject !== "string" || subject.length === 0) {
    throw new AuthenticationRequiredError();
  }
  return subject;
}

function withErrors(handler: JsonHandler): JsonHandler {
  return async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      const response = errorToHttp(error);
      return jsonResponse(response.statusCode, { error: response.message });
    }
  };
}

export const startGameHandler = withErrors(async (event) => {
  await createDailyPlayLimit().consume(authenticatedUserId(event));
  const result = await startGame();
  return jsonResponse(200, result);
});

export const submitExcuseHandler = withErrors(async (event) => {
  const body = parseJsonBody(event);
  const result = await submitExcuse({
    sessionId: typeof body.sessionId === "string" ? body.sessionId : "",
    excuse: body.excuse
  });

  return jsonResponse(200, { result });
});

export const getGameHandler = withErrors(async (event) => {
  const sessionId = event.pathParameters?.sessionId ?? "";
  const result = await getGameResult(sessionId);
  return jsonResponse(200, { result });
});
