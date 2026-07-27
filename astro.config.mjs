import { defineConfig } from "astro/config";
import { fileURLToPath, URL } from "node:url";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";
import tailwindcss from "@tailwindcss/vite";
import { getBlogSitemapLastmods } from "./src/lib/sitemap-lastmod.ts";

const blogLastmods = await getBlogSitemapLastmods(
  fileURLToPath(new URL("./src/content/blog/", import.meta.url))
);

// https://astro.build/config
export default defineConfig({
  site: "https://yieumyoon.github.io",
  integrations: [sitemap({
    filter: (page) => 
    page !== 'https://yieumyoon.github.io/legal/terms/' &&
    page !== 'https://yieumyoon.github.io/legal/privacy/',
    serialize: (item) => {
      const pathname = new URL(item.url).pathname.replace(/\/$/, "");
      const lastmod = blogLastmods.get(pathname);

      return lastmod ? { ...item, lastmod } : item;
    },

  }), partytown({
    config: {
      forward: ["dataLayer.push"]
    }
  })],
  vite: {
    plugins: [tailwindcss()]
  }
});
