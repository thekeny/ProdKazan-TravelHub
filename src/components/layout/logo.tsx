import Image from "next/image";
import Link from "next/link";
import { APP } from "@/configs/consts/app.const";
import { images } from "@/configs/paths/images.path";
import { pages } from "@/configs/paths/pages.path";

const sizes = {
  default: "w-36 sm:w-40",
  large: "w-64 sm:w-80",
};

export function Logo({
  large = false,
  className = "",
}: {
  large?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={pages.ROOT}
      aria-label={`${APP.NAME} — главная`}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-4 ${className}`}
    >
      <Image
        src={images.LOGO}
        alt={APP.NAME}
        width={2431}
        height={546}
        sizes={
          large
            ? "(min-width: 640px) 320px, 256px"
            : "(min-width: 640px) 160px, 144px"
        }
        priority
        className={`${large ? sizes.large : sizes.default} h-auto`}
      />
    </Link>
  );
}
