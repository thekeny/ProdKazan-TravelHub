// Это пример, потом удалите

import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("объединяет классы", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("разрешает конфликты Tailwind, оставляя последний класс", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("поддерживает условные классы", () => {
    expect(cn("a", { b: true, c: false })).toBe("a b");
  });
});
