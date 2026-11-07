import { describe, expect, it } from "vitest";
import {
  COLLABORATION,
  inviteCodeError,
} from "@/configs/consts/collaboration.const";

describe("invite code validation", () => {
  it("accepts safe codes and explains rejected ones", () => {
    expect(inviteCodeError("Invite-1")).toBeNull();
    expect(inviteCodeError("  Invite_1  ")).toBeNull();
    expect(inviteCodeError(".hidden")).toBe("Код не может начинаться с точки.");
    expect(inviteCodeError("code/with/slashes")).toContain(
      "только латинские буквы",
    );
    expect(
      inviteCodeError("a".repeat(COLLABORATION.CODE_MAX_LENGTH + 1)),
    ).toContain("не длиннее");
    expect(inviteCodeError("   ")).toBe("Введите код приглашения.");
  });
});
