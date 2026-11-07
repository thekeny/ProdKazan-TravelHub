export const COLLABORATION = {
  MAX_USES: 100,
  CODE_MAX_LENGTH: 128,
} as const;

// The first character cannot be a dot: a value like ".." would be normalized
// by URL parsing and could escape the intended backend path.
export const INVITE_CODE_PATTERN = /^[A-Za-z0-9_~-][A-Za-z0-9._~-]*$/;

export function inviteCodeError(value: string): string | null {
  const code = value.trim();
  if (!code) return "Введите код приглашения.";
  if (code.length > COLLABORATION.CODE_MAX_LENGTH)
    return `Код должен быть не длиннее ${COLLABORATION.CODE_MAX_LENGTH} символов.`;
  if (!INVITE_CODE_PATTERN.test(code)) {
    if (code.startsWith(".")) return "Код не может начинаться с точки.";
    return "Код может содержать только латинские буквы, цифры, точку, дефис, подчёркивание или тильду.";
  }
  return null;
}
