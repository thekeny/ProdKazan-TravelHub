"use client";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { APP, COVER_TYPES } from "@/configs/consts/app.const";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";
export function TripForm() {
  const { createTrip } = useTravel();
  const router = useRouter();
  const [cover, setCover] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <main className="flow-background">
      <section className="flow-card">
        <Logo />
        <Link
          href={pages.TRIPS}
          className="mt-7 flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />К путешествиям
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Новое путешествие
        </h1>
        <form
          className="mt-6 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            const form = new FormData(event.currentTarget);
            try {
              createTrip({
                name: String(form.get("name")),
                description: String(form.get("description")),
                startDate: String(form.get("startDate")),
                endDate: String(form.get("endDate")),
                cover,
              });
              router.push(pages.DASHBOARD);
            } catch (error) {
              setError((error as Error).message);
            }
          }}
        >
          <Field label="Название">
            {(id) => (
              <input
                id={id}
                name="name"
                required
                maxLength={100}
                placeholder="Выходные в Казани"
                className={inputClass}
              />
            )}
          </Field>
          <Field label="Описание (необязательно)">
            {(id) => (
              <textarea
                id={id}
                name="description"
                maxLength={2000}
                rows={3}
                placeholder="Несколько слов о поездке"
                className={`${inputClass} h-auto resize-y py-3`}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Дата начала">
              {(id) => (
                <input
                  id={id}
                  name="startDate"
                  type="date"
                  required
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Дата окончания">
              {(id) => (
                <input
                  id={id}
                  name="endDate"
                  type="date"
                  required
                  className={inputClass}
                />
              )}
            </Field>
          </div>
          <Field label="Обложка (необязательно)">
            {(id) => (
              <div>
                <div className="relative overflow-hidden rounded-lg border border-dashed bg-muted">
                  {cover && (
                    <div
                      role="img"
                      aria-label="Предпросмотр обложки"
                      className="h-40 bg-cover bg-center"
                      style={{ backgroundImage: `url(${cover})` }}
                    />
                  )}
                  <label
                    htmlFor={id}
                    className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 p-4 text-sm hover:bg-accent"
                  >
                    <Upload className="size-5" />
                    {reading
                      ? "Загрузка…"
                      : cover
                        ? "Заменить обложку"
                        : "Выбрать изображение"}
                    <input
                      ref={fileRef}
                      id={id}
                      type="file"
                      accept={COVER_TYPES.join(",")}
                      disabled={reading}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-describedby={`${id}-hint`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setError(null);
                        if (
                          !COVER_TYPES.includes(file.type) ||
                          file.size > APP.MAX_COVER_SIZE
                        ) {
                          setError(
                            "Выберите JPEG, PNG или WebP размером до 1 МБ.",
                          );
                          event.target.value = "";
                          return;
                        }
                        setReading(true);
                        const reader = new FileReader();
                        reader.onerror = () => {
                          setError(
                            "Не удалось прочитать изображение. Выберите файл ещё раз.",
                          );
                          setReading(false);
                        };
                        reader.onload = () => {
                          const value = String(reader.result);
                          const image = new window.Image();
                          image.onload = () => {
                            setCover(value);
                            setReading(false);
                          };
                          image.onerror = () => {
                            setError(
                              "Файл не является корректным изображением.",
                            );
                            setReading(false);
                          };
                          image.src = value;
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                <p
                  id={`${id}-hint`}
                  className="mt-2 text-xs text-muted-foreground"
                >
                  JPEG, PNG или WebP, до 1 МБ.
                </p>
                {cover && (
                  <Button
                    variant="ghost"
                    className="mt-2 h-11"
                    onClick={() => {
                      setCover(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    <X />
                    Убрать обложку
                  </Button>
                )}
              </div>
            )}
          </Field>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={reading} className="h-11">
            Создать путешествие
          </Button>
        </form>
      </section>
    </main>
  );
}
