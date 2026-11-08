import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { JoinTripButton } from "@/components/trips/join-trip";
import { TripSharing } from "@/components/trips/trip-sharing";
import type { Trip } from "@/configs/types/travel.type";

const account = vi.hoisted(() => ({
  username: "traveler",
  loadCollaborators: vi.fn(),
  generateInviteCode: vi.fn(),
  joinTrip: vi.fn(),
}));
const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("@/providers/travel-provider", () => ({ useTravel: () => account }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/lib/action-toast", () => ({
  actionToast: (action: () => unknown) => action(),
}));

const trip: Trip = {
  id: "trip",
  name: "Казань",
  description: "",
  startDate: "2026-11-07",
  endDate: "2026-11-08",
  cover: null,
  points: [],
  legs: [],
  events: [],
};

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.resetAllMocks();
  account.username = "traveler";
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function fill(input: HTMLInputElement | null, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set?.call(input, value);
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("shows collaborators and generates invite codes", async () => {
  account.loadCollaborators.mockResolvedValue({
    owner: { username: "traveler" },
    collaborators: [{ username: "friend" }],
  });
  account.generateInviteCode.mockResolvedValue({
    code: "Invite-1",
    uses: 3,
  });
  await act(async () =>
    root.render(<TripSharing trip={trip} onClose={vi.fn()} />),
  );
  await vi.waitFor(() => expect(document.body.textContent).toContain("friend"));
  expect(account.loadCollaborators).toHaveBeenCalledWith(trip.id);
  await fill(document.querySelector('input[type="number"]'), "3");
  await act(async () => {
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Создать код"))
      ?.click();
  });
  expect(account.generateInviteCode).toHaveBeenCalledWith(trip.id, 3);
  expect(
    document.querySelector<HTMLInputElement>(
      'input[aria-label="Код приглашения"]',
    )?.value,
  ).toBe("Invite-1");
});

it("joins by code and opens the joined trip", async () => {
  account.joinTrip.mockResolvedValue("joined-trip");
  await act(async () => root.render(<JoinTripButton />));
  await act(async () => {
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Присоединиться по коду"))
      ?.click();
  });
  await fill(document.querySelector("input"), "Invite-1");
  await act(async () => {
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(account.joinTrip).toHaveBeenCalledWith("Invite-1");
  expect(navigation.push).toHaveBeenCalledWith("/dashboard");
});

it("hides invite generation from collaborators who are not the owner", async () => {
  account.loadCollaborators.mockResolvedValue({
    owner: { username: "owner" },
    collaborators: [{ username: "traveler" }],
  });
  await act(async () =>
    root.render(<TripSharing trip={trip} onClose={vi.fn()} />),
  );
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain("Попутчик"),
  );
  expect(document.body.textContent).not.toContain("Создать код");
  expect(document.body.textContent).toContain("только владелец");
});

it("shows a retry action when participants cannot be loaded", async () => {
  account.loadCollaborators.mockRejectedValueOnce(new Error("network"));
  await act(async () =>
    root.render(<TripSharing trip={trip} onClose={vi.fn()} />),
  );
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain("Повторить"),
  );
  expect(document.body.textContent).toContain("network");
  account.loadCollaborators.mockResolvedValueOnce({
    owner: { username: "traveler" },
    collaborators: [],
  });
  await act(async () => {
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Повторить"))
      ?.click();
  });
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain("Владелец"),
  );
});

it("validates the number of invite uses locally", async () => {
  account.loadCollaborators.mockResolvedValue({
    owner: { username: "traveler" },
    collaborators: [],
  });
  await act(async () =>
    root.render(<TripSharing trip={trip} onClose={vi.fn()} />),
  );
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain("Владелец"),
  );
  await fill(document.querySelector('input[type="number"]'), "0");
  await act(async () => {
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Создать код"))
      ?.click();
  });
  expect(account.generateInviteCode).not.toHaveBeenCalled();
  expect(document.body.textContent).toContain("Укажите число от 1 до 100.");
});

it("blocks closing while an invite code is being generated", async () => {
  account.loadCollaborators.mockResolvedValue({
    owner: { username: "traveler" },
    collaborators: [],
  });
  let resolveInvite!: (value: { code: string; uses: number }) => void;
  account.generateInviteCode.mockReturnValue(
    new Promise((resolve) => {
      resolveInvite = resolve;
    }),
  );
  const onClose = vi.fn();
  await act(async () =>
    root.render(<TripSharing trip={trip} onClose={onClose} />),
  );
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain("Владелец"),
  );
  await act(async () => {
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Создать код"))
      ?.click();
  });
  await act(async () => {
    document
      .querySelector<HTMLButtonElement>('button[aria-label="Закрыть окно"]')
      ?.click();
  });
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => resolveInvite({ code: "Invite-1", uses: 1 }));
});

it("shows join controls without a mode flag", async () => {
  await act(async () => root.render(<JoinTripButton />));
  expect(document.querySelector("button")).not.toBeNull();
});

it("rejects an empty or unsafe invite code without calling the API", async () => {
  await act(async () => root.render(<JoinTripButton />));
  await act(async () => {
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Присоединиться по коду"))
      ?.click();
  });
  await fill(document.querySelector("input"), "code/with/slashes");
  await act(async () => {
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(account.joinTrip).not.toHaveBeenCalled();
  expect(document.body.textContent).toContain(
    "Код может содержать только латинские буквы",
  );
  const input = document.querySelector<HTMLInputElement>("input");
  expect(input?.getAttribute("aria-invalid")).toBe("true");
  expect(input?.getAttribute("aria-describedby")).toBeTruthy();
});
