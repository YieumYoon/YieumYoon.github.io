import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parse, stringify } from "yaml";

const slug = process.argv[2];
const BASE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const contentDirectory = fileURLToPath(
  new URL("../src/content/blog/", import.meta.url),
);

if (!slug || !BASE_SLUG_PATTERN.test(slug)) {
  console.error("Usage: npm run new:translation -- <original-post-slug>");
  process.exitCode = 1;
} else {
  const sourceFile = await findOriginal(contentDirectory, slug);

  if (!sourceFile) {
    console.error(`Could not find an original post with slug: ${slug}`);
    process.exitCode = 1;
  } else {
    const translationFile = join(dirname(sourceFile.path), "en.md");

    try {
      await access(translationFile);
      console.error(`Translation already exists: ${translationFile}`);
      process.exitCode = 1;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;

      const source = sourceFile.data;
      const frontmatter = {
        title: "TODO: English title",
        slug: `${slug}/en`,
        lang: "en",
        translationOf: slug,
        translationMethod: "ai-assisted",
        translationReviewed: false,
        summary: "TODO: English summary",
        date: source.date,
        ...(source.time ? { time: source.time } : {}),
        ...(source.timezone ? { timezone: source.timezone } : {}),
        ...(source.image ? { image: source.image } : {}),
        tags: Array.isArray(source.tags) ? source.tags : [],
        draft: true,
      };
      const body = [
        "---",
        stringify(frontmatter).trimEnd(),
        "---",
        "",
        "<!-- Translate the Korean original, then review the title, summary, body, links, code, and image alt text before publishing. -->",
        "",
        "TODO: English translation",
        "",
      ].join("\n");

      await writeFile(translationFile, body, { flag: "wx" });
      console.log(`Created ${translationFile}`);
    }
  }
}

async function findOriginal(directory, targetSlug) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const entryPath = join(directory, entry.name);
    const indexPath = join(entryPath, "index.md");

    try {
      const source = await readFile(indexPath, "utf8");
      const match = source.match(FRONTMATTER_PATTERN);
      if (!match) continue;

      const data = parse(match[1]);
      if (data?.slug === targetSlug && !data.translationOf) {
        return { path: indexPath, data };
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  return undefined;
}
