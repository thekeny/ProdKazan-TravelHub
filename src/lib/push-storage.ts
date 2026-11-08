import { PUSH } from "@/configs/consts/push.const";
import { apiId } from "@/lib/travel-api";

export type PushBinding = { userId: string; id: string; endpoint: string };

export function readPushBinding(): PushBinding | null {
  const value: unknown = JSON.parse(
    localStorage.getItem(PUSH.storageKey) ?? "null",
  );
  if (
    !value ||
    typeof value !== "object" ||
    !("userId" in value) ||
    typeof value.userId !== "string" ||
    !("id" in value) ||
    typeof value.id !== "string" ||
    !("endpoint" in value) ||
    typeof value.endpoint !== "string"
  )
    return null;
  apiId(value.id);
  return { userId: value.userId, id: value.id, endpoint: value.endpoint };
}

export function writePushBinding(value: PushBinding | null) {
  if (value) localStorage.setItem(PUSH.storageKey, JSON.stringify(value));
  else localStorage.removeItem(PUSH.storageKey);
}

export function pushDisabled(userId: string) {
  return (
    localStorage.getItem(`${PUSH.storageKey}.disabled.${userId}`) === "true"
  );
}

export function setPushDisabled(userId: string, disabled: boolean) {
  localStorage.setItem(
    `${PUSH.storageKey}.disabled.${userId}`,
    String(disabled),
  );
}
