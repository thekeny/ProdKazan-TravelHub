import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FormProvider } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Field } from "@/components/ui/field";
import { TextSelect } from "@/components/ui/text-select";
import { useFormValues } from "@/hooks/use-form-values";
import { textError } from "@/lib/input-validation";

const longName = "НазваниеБезПробелов".repeat(5);
let state: ReturnType<typeof useFormValues<{ name: string; pointId: string }>>;
let root: Root;
let container: HTMLDivElement;

function Form() {
  state = useFormValues({ name: "", pointId: "" }, (values) => ({
    name: textError(values.name, 100, true),
    pointId: values.pointId ? undefined : "Выберите точку.",
  }));
  const [values, setValues, form] = state;
  return (
    <FormProvider {...form}>
      <Field name="name" label="Название" hint="До 100 символов.">
        {(id) => (
          <input
            id={id}
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
          />
        )}
      </Field>
      <Field name="pointId" label="Точка">
        {(id) => (
          <TextSelect
            data-field-control
            id={id}
            value={values.pointId}
            options={[{ value: "point", label: longName }]}
            onValueChange={(pointId) =>
              setValues((current) => ({ ...current, pointId }))
            }
          />
        )}
      </Field>
    </FormProvider>
  );
}

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Form />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("shared form fields", () => {
  it("shows an error only after blur and removes it as the value is corrected", async () => {
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0);
    const input = container.querySelector("input") as HTMLInputElement;
    await act(async () =>
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })),
    );
    const error = container.querySelector('[role="alert"]');
    expect(error?.textContent).toBe("Заполните поле.");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(
      error?.id,
    );
    await act(async () => state[1]((current) => ({ ...current, name: "Я" })));
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0);
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(
      document.getElementById(input.getAttribute("aria-describedby") ?? "")
        ?.textContent,
    ).toBe("До 100 символов.");
  });

  it("registers the custom select for blur validation, error focus and controlled values", async () => {
    const select = container.querySelector(
      '[role="combobox"]',
    ) as HTMLButtonElement;
    await act(async () =>
      select.dispatchEvent(new FocusEvent("focusout", { bubbles: true })),
    );
    expect(select.getAttribute("aria-invalid")).toBe("true");
    await act(async () => state[2].trigger("pointId", { shouldFocus: true }));
    expect(document.activeElement).toBe(select);
    await act(async () =>
      state[1]((current) => ({ ...current, pointId: "point" })),
    );
    expect(select.textContent).toBe(longName);
    expect(select.getAttribute("aria-invalid")).toBe("false");
    expect(state[2].getValues("pointId")).toBe("point");
  });
});
