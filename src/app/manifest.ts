import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TravelHub",
    short_name: "TravelHub",
    description: "Планирование поездок и сохранение их истории",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#4f8a68",
    icons: [
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
