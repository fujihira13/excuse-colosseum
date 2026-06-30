import { NextResponse } from "next/server";
import { startGame } from "@/src/services/gameService";
import { apiErrorResponse } from "@/src/server/apiErrors";

export async function POST() {
  try {
    const result = await startGame();
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
