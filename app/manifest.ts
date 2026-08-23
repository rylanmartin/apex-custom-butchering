import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Apex Custom Butchering",
    short_name: "Apex Butchering",
    description:
      "Custom beef, pork, sheep, goat, and deer processing in Owosso, Michigan.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#090909",
    icons: [
      {
        src: "/apex-logo-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
