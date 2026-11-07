"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/field";
import {
  EVENT_TYPE_LIMITS,
  TEXT_LIMITS,
} from "@/configs/consts/validation.const";
import { eventTypesError } from "@/lib/event-types";

export function EventTypeChips({
  value,
  onChange,
  disabled = false,
  limit = EVENT_TYPE_LIMITS.PER_TRIP,
  onDraftChange,
}: {
  value: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
  limit?: number;
  onDraftChange?: (value: string) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  function add(name: string) {
    const next = [...value, name.trim()];
    const issue = eventTypesError(next, limit);
    if (issue) {
      setError(issue);
      return;
    }
    try {
      onChange(next);
      setDraft("");
      onDraftChange?.("");
      setError(undefined);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Не удалось сохранить типы.",
      );
    }
  }
  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        Типы событий
      </label>
      <div className="flex flex-wrap gap-2">
        {value.map((name) => (
          <span
            key={name}
            className="inline-flex max-w-full items-center rounded-xl border border-primary/25 bg-primary/10 pl-3 text-sm"
          >
            <span className="user-text min-w-0">{name}</span>
            <button
              type="button"
              disabled={disabled}
              aria-label={`Убрать тип «${name}»`}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
              onClick={() => {
                try {
                  onChange(value.filter((item) => item !== name));
                  setError(undefined);
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Не удалось убрать тип.",
                  );
                }
              }}
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      <input
        id={id}
        className={inputClass}
        value={draft}
        disabled={disabled}
        maxLength={TEXT_LIMITS.EVENT_TYPE}
        placeholder="Введите название и нажмите Enter"
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        aria-invalid={Boolean(error)}
        onChange={(event) => {
          setDraft(event.target.value);
          onDraftChange?.(event.target.value);
          setError(undefined);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
          event.preventDefault();
          if (draft.trim()) add(draft);
        }}
      />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        Enter добавляет тип. Пробелы остаются в названии.
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
