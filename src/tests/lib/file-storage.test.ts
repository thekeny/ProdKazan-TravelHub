import { beforeEach, expect, it, vi } from "vitest";
import { sessionFetch } from "@/lib/api-session";
import { getRemoteFile, putRemoteFile } from "@/lib/file-storage";

vi.mock("@/lib/api-session", () => ({
  sessionFetch: vi.fn(),
}));

const fetchMock = vi.mocked(sessionFetch);

beforeEach(() => vi.resetAllMocks());

it("uploads a file with its content type and UUID path", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  const blob = new Blob(["photo"], { type: "image/jpeg" });

  await putRemoteFile("file-id", blob);

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringMatching(/\/files\/file-id$/),
    expect.objectContaining({
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "image/jpeg" },
    }),
  );
});

it("returns null when the owner cannot access a file", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

  await expect(getRemoteFile("missing")).resolves.toBeNull();
});
