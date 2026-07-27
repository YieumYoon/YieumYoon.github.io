import { readdir, readFile } from "node:fs/promises"
import { extname, join, relative, sep } from "node:path"
import { parse } from "yaml"

import { getPostDateTime } from "./utils.ts"

type BlogFrontmatter = {
  slug?: unknown
  date?: unknown
  time?: unknown
  timezone?: unknown
  updatedDate?: unknown
  updatedTime?: unknown
  updatedTimezone?: unknown
  draft?: unknown
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

function parseFrontmatter(source: string, filePath: string): BlogFrontmatter {
  const match = source.match(FRONTMATTER_PATTERN)

  if (!match) {
    throw new Error(`Missing YAML frontmatter in ${filePath}`)
  }

  const frontmatter = parse(match[1])
  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    throw new Error(`Invalid YAML frontmatter in ${filePath}`)
  }

  return frontmatter as BlogFrontmatter
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function requiredDate(value: unknown, filePath: string) {
  if (value instanceof Date) return value
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  throw new Error(`Invalid or missing publication date in ${filePath}`)
}

function getLastModifiedDate(frontmatter: BlogFrontmatter, filePath: string) {
  const publishedDate = requiredDate(frontmatter.date, filePath)
  const updatedDate = optionalString(frontmatter.updatedDate)

  return getPostDateTime({
    date: updatedDate ?? publishedDate,
    time: updatedDate
      ? optionalString(frontmatter.updatedTime)
      : optionalString(frontmatter.time),
    timezone: updatedDate
      ? optionalString(frontmatter.updatedTimezone) ?? optionalString(frontmatter.timezone)
      : optionalString(frontmatter.timezone),
  })
}

async function getContentFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) return getContentFiles(entryPath)
    if (entry.name.startsWith("_") || ![".md", ".mdx"].includes(extname(entry.name))) {
      return []
    }

    return [entryPath]
  }))

  return files.flat()
}

function getBlogPath(
  contentDirectory: string,
  filePath: string,
  frontmatter: BlogFrontmatter
) {
  const relativePath = relative(contentDirectory, filePath).split(sep).join("/")
  const fileId = relativePath
    .replace(/\.(?:md|mdx)$/, "")
    .replace(/\/index$/, "")
  const contentId = optionalString(frontmatter.slug) ?? fileId

  return `/blog/${contentId}`
}

export async function getBlogSitemapLastmods(contentDirectory: string) {
  const lastmods = new Map<string, Date>()

  for (const filePath of await getContentFiles(contentDirectory)) {
    const frontmatter = parseFrontmatter(await readFile(filePath, "utf8"), filePath)
    if (frontmatter.draft === true) continue

    lastmods.set(
      getBlogPath(contentDirectory, filePath, frontmatter),
      getLastModifiedDate(frontmatter, filePath)
    )
  }

  return lastmods
}
