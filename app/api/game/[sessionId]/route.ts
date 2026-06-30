import { NextResponse } from "next/server";
import { getGameResult } from "@/src/services/gameService";
import { apiErrorResponse } from "@/src/server/apiErrors";

export async function GET(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const result = await getGameResult(sessionId);
    return NextResponse.json({ result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
