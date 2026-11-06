import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TravelProvider } from "@/providers/travel-provider";

const interSans = localFont({
  src: [
    {
      path: "../../public/fonts/InterVariable.woff2",
      style: "normal",
    },
    {
      path: "../../public/fonts/InterVariable-Italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TravelHub",
  description: "Путешествие как история",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={interSans.variable}>
      <body className={`${interSans.className} antialiased`}>
        <TravelProvider>{children}</TravelProvider>
      </body>
    </html>
  );
}
