import { NextResponse } from "next/server";
import { submitExcuse } from "@/src/services/gameService";
import { apiErrorResponse } from "@/src/server/apiErrors";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: string; excuse?: unknown };
    const result = await submitExcuse({
      sessionId: body.sessionId ?? "",
      excuse: body.excuse
    });

    return NextResponse.json({ result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
