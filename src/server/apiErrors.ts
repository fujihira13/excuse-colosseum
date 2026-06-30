import { NextResponse } from "next/server";
import { logMetric } from "../observability/logger";
import { errorToHttp } from "./errorMapping";

export function apiErrorResponse(error: unknown) {
  const response = errorToHttp(error);
  logMetric("ApiError", {
    statusCode: response.statusCode,
    error: error instanceof Error ? error.message : String(error)
  });
  return NextResponse.json({ error: response.message }, { status: response.statusCode });
}
