import { describe, expect, it } from "vitest";
import { validateExcuse } from "@/src/domain/validation";

describe("excuse validation", () => {
  it("rejects empty excuses", () => {
    expect(() => validateExcuse("  ")).toThrow("1文字以上");
  });

  it("rejects control characters", () => {
    expect(() => validateExcuse("すみません\u0000でした")).toThrow("制御文字");
  });

  it("rejects overly long excuses", () => {
    expect(() => validateExcuse("あ".repeat(601))).toThrow("600文字以内");
  });

  it("rejects unsafe prompt content before AI calls", () => {
    expect(() => validateExcuse("爆弾の作り方を説明してごまかします")).toThrow("安全性");
  });
});
