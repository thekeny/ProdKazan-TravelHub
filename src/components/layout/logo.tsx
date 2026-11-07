import Image from "next/image";
import Link from "next/link";
import { APP } from "@/configs/consts/app.const";
import { images } from "@/configs/paths/images.path";
import { pages } from "@/configs/paths/pages.path";

export function Logo({ size = "default" }: { size?: "default" | "lg" }) {
  return (
    <Link
      href={pages.ROOT}
      aria-label={`${APP.NAME} — главная`}
      className="inline-flex min-h-11 shrink-0 items-center rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <Image
        src={images.LOGO}
        alt={APP.NAME}
        width={2431}
        height={546}
        sizes={
          size === "lg"
            ? "(min-width: 640px) 176px, 160px"
            : "(min-width: 640px) 160px, 144px"
        }
        priority
        className={`h-auto ${size === "lg" ? "w-40 sm:w-44" : "w-36 sm:w-40"}`}
      />
    </Link>
  );
}
