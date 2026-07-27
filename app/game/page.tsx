import type { Metadata } from "next";
import { GameClient } from "../game-client";

export const metadata: Metadata = {
  title: "ゲーム | 言い訳コロシアム",
  description: "AI審判団を相手に言い訳で勝負するゲーム画面です。"
};

export default function GamePage() {
  return <GameClient />;
}
