import { describe, expect, it } from "vitest";
import {
  apiId,
  apiResult,
  eventBody,
  legBody,
  mapEvent,
  mapLeg,
} from "@/lib/travel-api";

describe("backend adapters", () => {
  it("preserves every digit of int64 IDs in paths and JSON bodies", () => {
    const id = "1568610886538672011";
    expect(String(apiId(id))).toBe(id);
    expect(JSON.stringify({ waypointId: apiId(id) })).toBe(
      `{"waypointId":"${id}"}`,
    );
    expect(() => apiId("../auth/me")).toThrow();
    expect(() => apiId("9223372036854775808")).toThrow();
  });
  it("sends timezone-aware event and transfer times while preserving local clock digits", () => {
    const values = {
      title: "Museum",
      type: "tour" as const,
      start: "2026-11-07T23:30",
      end: "2026-11-08T00:30",
      description: "",
      pointId: "1568610886538672011",
      materials: [],
      bookingUrl: "",
    };
    const event = eventBody(values);
    expect(event.startedAt).toBe("2026-11-07T23:30:00Z");
    expect(event.endedAt).toBe("2026-11-08T00:30:00Z");
    expect(eventBody({ ...values, end: "" }).endedAt).toBeNull();
    expect(
      mapEvent({ ...event, id: "1", waypointId: values.pointId }).start,
    ).toBe(values.start);
    expect(
      mapEvent({ ...event, id: "1", waypointId: values.pointId }).end,
    ).toBe(values.end);
    const leg = legBody({
      ...values,
      fromPointId: values.pointId,
      toPointId: "2",
      transport: "walk",
    });
    expect(leg.startedAt).toBe("2026-11-07T23:30:00Z");
    expect(
      mapLeg({
        ...leg,
        id: "3",
        startsAtWaypointId: values.pointId,
        endsAtWaypointId: "2",
      }).end,
    ).toBe(values.end);
    expect(
      mapLeg({
        ...leg,
        id: "4",
        transportType: "hyperloop",
        startsAtWaypointId: "1",
        endsAtWaypointId: "2",
      }).transport,
    ).toBe("other");
  });
  it("turns authorization and validation failures into actionable errors", async () => {
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 401 }),
          error: {},
        }),
      ),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 403 }),
          error: {},
        }),
      ),
    ).rejects.toThrow("Недостаточно прав для этого действия.");
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 413 }),
          error: {},
        }),
      ),
    ).rejects.toThrow("Файл слишком большой.");
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 415 }),
          error: {},
        }),
      ),
    ).rejects.toThrow("Неподдерживаемый тип файла.");
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 409 }),
          error: { errorCode: "UsernameIsAlreadyInUse" },
        }),
      ),
    ).rejects.toThrow("Это имя пользователя уже занято.");
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 409 }),
          error: { errorCode: "UserIsAlreadyACollaborator" },
        }),
      ),
    ).rejects.toThrow("Вы уже участвуете в этой поездке.");
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 410 }),
          error: { errorCode: "ExpiredLink" },
        }),
      ),
    ).rejects.toThrow("Срок действия кода приглашения истёк.");
  });
  it("explains an ambiguous ticket kind and preserves its validation code", async () => {
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 422 }),
          error: {
            detail: {},
            errorCode: "ValidationFailed",
            errors: ["ticket_kind_ambiguous"],
          },
        }),
      ),
    ).rejects.toMatchObject({
      status: 422,
      message:
        "Не удалось определить вид билета. Выберите его вручную и повторите распознавание.",
      validationCodes: ["ticket_kind_ambiguous"],
    });
  });
  it.each([
    { errors: ["PDF не содержит текста"], message: "PDF не содержит текста" },
    { errors: [{ msg: "Проверьте ссылку" }], message: "Проверьте ссылку" },
    {
      errors: [
        null,
        42,
        {},
        "Неподдерживаемый билет",
        { msg: "Выберите другой PDF" },
      ],
      message: "Неподдерживаемый билет; Выберите другой PDF",
    },
    { errors: [], message: "Сервер отклонил данные. Проверьте поля формы." },
  ])(
    "preserves validation messages for $errors",
    async ({ errors, message }) => {
      await expect(
        apiResult(
          Promise.resolve({
            response: new Response(null, { status: 422 }),
            error: { errors },
          }),
        ),
      ).rejects.toMatchObject({ status: 422, message });
    },
  );
});
