import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, test } from "node:test"

import { getBlogSitemapLastmods } from "../src/lib/sitemap-lastmod.ts"

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    rm(directory, { recursive: true, force: true })
  )))
})

async function createContentDirectory(files) {
  const directory = await mkdtemp(join(tmpdir(), "sitemap-lastmod-"))
  temporaryDirectories.push(directory)

  await Promise.all(Object.entries(files).map(async ([filePath, source]) => {
    const absolutePath = join(directory, filePath)
    await mkdir(join(absolutePath, ".."), { recursive: true })
    await writeFile(absolutePath, source)
  }))

  return directory
}

test("uses publication timestamps and excludes draft and template posts", async () => {
  const directory = await createContentDirectory({
    "published/index.md": `---
slug: public-url
date: 2026-07-11
time: 20:26
timezone: America/New_York
draft: false
---
Published`,
    "draft/index.md": `---
date: 2026-07-12
draft: true
---
Draft`,
    "_template.md": `---
date: 2099-01-01
---
Template`,
  })

  const lastmods = await getBlogSitemapLastmods(directory)

  assert.deepEqual([...lastmods.keys()], ["/blog/public-url"])
  assert.equal(lastmods.get("/blog/public-url")?.toISOString(), "2026-07-12T00:26:00.000Z")
})

test("prefers the updated timestamp and its timezone", async () => {
  const directory = await createContentDirectory({
    "nested/post.mdx": `---
date: 2026-07-10
time: 08:00
timezone: UTC
updatedDate: 2026-07-12
updatedTime: 09:15
updatedTimezone: America/New_York
---
Updated`,
  })

  const lastmods = await getBlogSitemapLastmods(directory)

  assert.equal(
    lastmods.get("/blog/nested/post")?.toISOString(),
    "2026-07-12T13:15:00.000Z"
  )
})

test("falls back to the publication timezone for a date-only update", async () => {
  const directory = await createContentDirectory({
    "post/index.md": `---
date: 2026-01-01
timezone: America/Chicago
updatedDate: 2026-01-03
---
Updated`,
  })

  const lastmods = await getBlogSitemapLastmods(directory)

  assert.equal(lastmods.get("/blog/post")?.toISOString(), "2026-01-03T06:00:00.000Z")
})
