import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "lunch.community",
    short_name: "lunch.community",
    description: "Order together with your lunch community",
    start_url: "/",
    display: "standalone",
    background_color: "#c8e4c9",
    theme_color: "#4CAF50",
    icons: [
      {
        src: "/assets/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
