import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF først: galleribildene er fotografier, og der er gevinsten mot WebP
    // stor nok til å forsvare den dyrere transformasjonen.
    formats: ["image/avif", "image/webp"],
    // Rammene i filmrullen er 176–280 px brede; med DPR 3 holder det til 840.
    imageSizes: [176, 212, 224, 280, 424, 560, 672, 840],
  },
};

export default nextConfig;
