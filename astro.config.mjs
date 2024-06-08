import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import solidJs from "@astrojs/solid-js";
import partytown from "@astrojs/partytown";


// https://astro.build/config
export default defineConfig({
  site: "https://yieumyoon.github.io",
  integrations: [mdx(), sitemap({
    filter: (page) => 
    page !== 'https://yieumyoon.github.io/legal/terms/' &&
    page !== 'https://yieumyoon.github.io/legal/privacy/' &&
    page !== 'https://yieumyoon.github.io/work/' &&
    page !== 'https://yieumyoon.github.io/search/' &&
    page !== 'https://yieumyoon.github.io/blog/05-astro-sphere-writing-mdx/',

  }), solidJs(), tailwind({
    applyBaseStyles: false
  }), partytown({
    config: {
      forward: ["dataLayer.push"]
    }
  })], 
});