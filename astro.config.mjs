import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";
import tailwindcss from "@tailwindcss/vite";


// https://astro.build/config
export default defineConfig({
  site: "https://yieumyoon.github.io",
  integrations: [sitemap({
    filter: (page) => 
    page !== 'https://yieumyoon.github.io/legal/terms/' &&
    page !== 'https://yieumyoon.github.io/legal/privacy/',

  }), partytown({
    config: {
      forward: ["dataLayer.push"]
    }
  })],
  vite: {
    plugins: [tailwindcss()]
  }
});
