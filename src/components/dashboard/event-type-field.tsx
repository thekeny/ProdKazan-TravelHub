"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TextSelect } from "@/components/ui/text-select";
import { EVENT_TYPES } from "@/configs/consts/events.const";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import type { EventValues, TripEvent } from "@/configs/types/event.type";
import { actionToast } from "@/lib/action-toast";
import { appendEventType } from "@/lib/event-types";

export function EventTypeField({
  catalog,
  event,
  value,
  draft,
  onDraftChange,
  onChange,
  onAdd,
  onBusyChange,
  disabled,
}: {
  catalog: string[];
  event?: TripEvent;
  value: EventValues["customType"];
  draft: string;
  onDraftChange: (draft: string) => void;
  onChange: (value: EventValues["customType"]) => void;
  onAdd: (name: string) => void | Promise<void>;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();
  const locked = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const wasCreating = useRef(false);
  const preserved = event
    ? (event.customType ?? EVENT_TYPES[event.type])
    : null;

  useEffect(() => {
    if (creating) input.current?.focus({ preventScroll: true });
    else if (wasCreating.current)
      trigger.current?.focus({ preventScroll: true });
    wasCreating.current = creating;
  }, [creating]);

  async function add() {
    if (locked.current || disabled) return;
    const name = draft.trim();
    try {
      appendEventType(catalog, name);
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : "Проверьте название типа.",
      );
      return;
    }
    locked.current = true;
    onBusyChange(true);
    setError(undefined);
    try {
      await actionToast(
        () => onAdd(name),
        "Добавляем тип…",
        "Тип добавлен в путешествие.",
      );
      onChange(name);
      onDraftChange("");
      setCreating(false);
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : "Не удалось добавить тип.",
      );
    } finally {
      locked.current = false;
      onBusyChange(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Field name="customType" label="Тип события">
        {(id) => (
          <TextSelect
            data-field-control
            id={id}
            value={value === undefined ? (preserved ?? "") : (value ?? "")}
            disabled={disabled}
            options={[
              { value: "", label: "Выберите тип события" },
              ...(preserved && !catalog.includes(preserved)
                ? [{ value: preserved, label: preserved }]
                : []),
              ...catalog.map((name) => ({ value: name, label: name })),
            ]}
            onValueChange={(next) =>
              onChange(
                next === preserved &&
                  event?.customType === undefined &&
                  !catalog.includes(next)
                  ? undefined
                  : next || null,
              )
            }
          />
        )}
      </Field>
      {creating ? (
        <div className="grid gap-2 rounded-lg bg-muted p-3">
          <Field label="Название нового типа" error={error}>
            {(id, describedBy) => (
              <Input
                id={id}
                ref={input}
                data-field-control
                value={draft}
                maxLength={TEXT_LIMITS.EVENT_TYPE}
                aria-describedby={describedBy}
                disabled={disabled}
                onChange={(e) => {
                  onDraftChange(e.target.value);
                  setError(undefined);
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  void add();
                }}
              />
            )}
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              disabled={disabled}
              onClick={() => {
                setCreating(false);
                onDraftChange("");
                setError(undefined);
              }}
            >
              Отмена
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={disabled}
              onClick={() => void add()}
            >
              {locked.current ? "Добавляем…" : "Добавить тип"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          ref={trigger}
          type="button"
          variant="ghost"
          className="min-h-11 justify-self-start text-primary-strong"
          disabled={disabled}
          onClick={() => setCreating(true)}
        >
          <Plus aria-hidden="true" />
          Добавить тип
        </Button>
      )}
    </div>
  );
}
