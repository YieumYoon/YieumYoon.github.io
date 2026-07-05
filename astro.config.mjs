import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import partytown from "@astrojs/partytown";


// https://astro.build/config
export default defineConfig({
  site: "https://yieumyoon.github.io",
  integrations: [sitemap({
    filter: (page) => 
    page !== 'https://yieumyoon.github.io/legal/terms/' &&
    page !== 'https://yieumyoon.github.io/legal/privacy/',

  }), tailwind({
    applyBaseStyles: false
  }), partytown({
    config: {
      forward: ["dataLayer.push"]
    }
  })], 
});
