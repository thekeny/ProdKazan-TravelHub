import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PwaRegistration } from "@/components/layout/pwa-registration";
import { AppToaster } from "@/components/ui/app-toaster";
import { images } from "@/configs/paths/images.path";
import { TravelProvider } from "@/providers/travel-provider";

const lora = localFont({
  src: [
    {
      path: "../../public/fonts/Lora-Variable.ttf",
      style: "normal",
      weight: "400 700",
    },
    {
      path: "../../public/fonts/Lora-Italic-Variable.ttf",
      style: "italic",
      weight: "400 700",
    },
  ],
  variable: "--font-lora",
  display: "swap",
});

const caveat = localFont({
  src: "../../public/fonts/Caveat-Variable.ttf",
  weight: "400 700",
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TravelHub",
    template: "%s",
  },
  description:
    "Планируйте поездки, стройте маршруты на карте и сохраняйте события, фотографии и билеты в одной хронологии.",
  icons: {
    icon: [{ url: images.FAVICON, type: "image/png" }],
    apple: [{ url: images.FAVICON, type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${lora.variable} ${caveat.variable}`}>
      <head>
        <link
          rel="preload"
          as="image"
          href={images.LOADING}
          type="image/webp"
          fetchPriority="high"
        />
      </head>
      <body className="antialiased">
        <PwaRegistration />
        <TravelProvider>
          {children}
          <AppToaster />
        </TravelProvider>
      </body>
    </html>
  );
}
