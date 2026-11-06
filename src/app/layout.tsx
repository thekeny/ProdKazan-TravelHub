import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
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

const pangolin = localFont({
  src: "../../public/fonts/Pangolin-Regular.ttf",
  weight: "400",
  variable: "--font-pangolin",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TravelHub — путешествие как история",
    template: "%s · TravelHub",
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
    <html lang="ru" className={`${lora.variable} ${pangolin.variable}`}>
      <body className="antialiased">
        <TravelProvider>{children}</TravelProvider>
      </body>
    </html>
  );
}
