import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";

export default function NotFound() {
  return (
    <main className="paper-texture grid min-h-dvh place-items-center px-4 py-10">
      <section className="flex w-full max-w-md flex-col items-center text-center">
        <Image
          alt=""
          className="h-auto w-full max-w-44"
          height={448}
          priority
          src="/found.gif"
          unoptimized
          width={716}
        />
        <h1 className="mt-5 flex flex-col items-center gap-3 font-sans text-2xl font-semibold tracking-tight text-foreground">
          <span className="text-5xl text-primary-strong">404</span>
          <span>Страница не найдена</span>
        </h1>
        <Link
          className={buttonVariants({ className: "mt-6 h-11 min-w-48" })}
          href={pages.ROOT}
        >
          На главную
        </Link>
      </section>
    </main>
  );
}
