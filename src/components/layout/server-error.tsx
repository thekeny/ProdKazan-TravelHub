"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export function ServerError({ status }: { status: number }) {
  return (
    <main className="paper-texture grid min-h-dvh place-items-center px-4 py-10">
      <section className="flex w-full max-w-md flex-col items-center text-center">
        <Image
          alt=""
          className="h-auto w-full max-w-44"
          height={508}
          priority
          src="/warn.webp"
          unoptimized
          width={716}
        />
        <h1 className="mt-5 flex flex-col items-center gap-3 font-sans text-2xl font-semibold tracking-tight text-foreground">
          {status >= 500 && status < 600 && (
            <span className="text-5xl text-destructive">500</span>
          )}
          <span>Не удалось загрузить страницу</span>
        </h1>
        <Button
          className="mt-6 h-11 min-w-48"
          onClick={() => window.location.reload()}
        >
          Перезагрузить
        </Button>
      </section>
    </main>
  );
}
