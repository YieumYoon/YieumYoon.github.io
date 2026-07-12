import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const dateString = z.preprocess((value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
const timeString = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/)
const optionalDateString = z.preprocess((value) => {
  if (value === "") return undefined
  return value
}, dateString.optional())
const optionalTimeString = z.preprocess((value) => {
  if (value === "") return undefined
  return value
}, timeString.optional())
const optionalString = z.preprocess((value) => {
  if (value === "") return undefined
  return value
}, z.string().optional())
const optionalSlugString = z.preprocess((value) => {
  if (value === "") return undefined
  return value
}, z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional())
const timezoneString = z.preprocess((value) => {
  if (value === "") return undefined
  return value
}, z.string().default("UTC"))

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    slug: optionalSlugString,
    summary: z.string(),
    date: dateString,
    time: optionalTimeString,
    timezone: timezoneString,
    updatedDate: optionalDateString,
    updatedTime: optionalTimeString,
    updatedTimezone: optionalString,
    image: optionalString,
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
  }),
})

const legal = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
})

export const collections = { blog, legal }
