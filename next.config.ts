import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hero-lyset har shaderne sine i egne .wgsl-filer med import seg imellom;
  // vgpu-loaderen løser opp importgrafen ved bygg og gir én ferdig shader.
  webpack(config) {
    config.module.rules.push({
      test: /\.wgsl$/,
      loader: "@vgpu/wgsl/loader-webpack",
      options: { minify: { whitespace: true } },
    });
    return config;
  },
};

export default nextConfig;
