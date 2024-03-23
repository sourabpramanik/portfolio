import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import customTheme from "./code-theme.json";
// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: { theme: customTheme, wrap: true },
  },
  integrations: [
    react({
      include: ["**/react/*"],
    }),
    tailwind({
      applyBaseStyles: false,
      configFile: "./tailwind.config.mjs",
    }),
  ],
});
