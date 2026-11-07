import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AuthGuard } from "@/components/layout/auth-guard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/providers/travel-provider", () => ({
  useTravel: () => ({
    ready: false,
    username: null,
    trips: [],
    activeId: null,
  }),
}));

describe("AuthGuard", () => {
  it("shows the loading animation while browser storage is being read", () => {
    const markup = renderToStaticMarkup(<AuthGuard>Content</AuthGuard>);

    expect(markup).toContain('src="/load.webp"');
    expect(markup).not.toContain("Content");
  });
});
