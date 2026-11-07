import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { LandingPage } from "@/components/landing/landing-page";

const session = vi.hoisted(() => ({
  ready: false,
  username: null as string | null,
}));
const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/providers/travel-provider", () => ({ useTravel: () => session }));
describe("landing session", () => {
  it("waits for storage, shows guests the landing, and redirects signed-in users", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      await act(async () => root.render(<LandingPage />));
      expect(container.querySelector('img[src="/load.webp"]')).not.toBeNull();
      expect(replace).not.toHaveBeenCalled();
      session.ready = true;
      await act(async () => root.render(<LandingPage />));
      expect(container.querySelector("footer")?.textContent).toContain(
        "TravelHub",
      );
      expect(replace).not.toHaveBeenCalled();
      session.username = "alice";
      await act(async () => root.render(<LandingPage />));
      expect(replace).toHaveBeenCalledWith("/dashboard");
      expect(container.querySelector("footer")).toBeNull();
    } finally {
      await act(async () => root.unmount());
      vi.unstubAllGlobals();
    }
  });
});
