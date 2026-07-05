import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const timeString = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/)

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: dateString,
    time: timeString.optional(),
    timezone: z.string().default("UTC"),
    updatedDate: dateString.optional(),
    updatedTime: timeString.optional(),
    updatedTimezone: z.string().optional(),
    image: z.string().optional(),
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
