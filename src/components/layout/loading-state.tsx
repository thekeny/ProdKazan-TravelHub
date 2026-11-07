import Image from "next/image";
import { images } from "@/configs/paths/images.path";

export function LoadingState() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <output
        aria-live="polite"
        aria-label="Загрузка"
        className="flex flex-col items-center text-center"
      >
        <Image
          unoptimized
          alt=""
          aria-hidden="true"
          className="h-auto w-52"
          height={464}
          loading="eager"
          fetchPriority="high"
          src={images.LOADING}
          width={716}
        />
        <span className="mt-5 flex items-baseline font-sans text-2xl font-semibold tracking-tight text-foreground">
          Загрузка
          <span aria-hidden="true" className="inline-flex w-6 justify-start">
            {[0, 1, 2].map((dot) => (
              <span
                className="animate-pulse text-primary"
                key={dot}
                style={{ animationDelay: `${dot * 180}ms` }}
              >
                .
              </span>
            ))}
          </span>
        </span>
      </output>
    </main>
  );
}
