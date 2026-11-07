"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import {
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type Path,
  type PathValue,
  type Resolver,
  useForm,
  useWatch,
} from "react-hook-form";

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function useFormValues<T extends FieldValues>(
  initial: T | (() => T),
  validate: (values: T) => FormErrors<T>,
) {
  const resolver: Resolver<T> = async (values) => {
    const issues = validate(values);
    const errors = Object.fromEntries(
      Object.entries(issues)
        .filter(([, message]) => Boolean(message))
        .map(([key, message]) => [key, { type: "validate", message }]),
    );
    return Object.keys(errors).length
      ? { values: {}, errors: errors as FieldErrors<T> }
      : { values, errors: {} };
  };
  const [defaults] = useState(initial);
  const form = useForm<T>({
    defaultValues: defaults as DefaultValues<T>,
    resolver,
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const values = useWatch({ control: form.control }) as T;
  const setValues: Dispatch<SetStateAction<T>> = (next) => {
    const updated = typeof next === "function" ? next(form.getValues()) : next;
    for (const key of Object.keys(updated) as Path<T>[]) {
      form.setValue(key, updated[key] as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate:
          form.formState.isSubmitted ||
          form.getFieldState(key).isTouched ||
          Boolean(form.formState.errors[key]),
      });
    }
  };
  return [values, setValues, form] as const;
}
