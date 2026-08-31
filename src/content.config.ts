import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const dateString = z.preprocess(
  (value) => {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return value;
  },
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
);
const timeString = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
const optionalDateString = z.preprocess((value) => {
  if (value === "") return undefined;
  return value;
}, dateString.optional());
const optionalTimeString = z.preprocess((value) => {
  if (value === "") return undefined;
  return value;
}, timeString.optional());
const optionalString = z.preprocess((value) => {
  if (value === "") return undefined;
  return value;
}, z.string().optional());
const optionalSlugString = z.preprocess(
  (value) => {
    if (value === "") return undefined;
    return value;
  },
  z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/en)?$/)
    .optional(),
);
const optionalBaseSlugString = z.preprocess(
  (value) => {
    if (value === "") return undefined;
    return value;
  },
  z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
);
const optionalTranslationMethod = z.preprocess(
  (value) => {
    if (value === "") return undefined;
    return value;
  },
  z.enum(["ai-assisted", "human"]).optional(),
);
const timezoneString = z.preprocess((value) => {
  if (value === "") return undefined;
  return value;
}, z.string().default("UTC"));

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: z
    .object({
      title: z.string(),
      slug: optionalSlugString,
      lang: z.enum(["ko", "en"]),
      translationOf: optionalBaseSlugString,
      translationMethod: optionalTranslationMethod,
      translationReviewed: z.boolean().optional(),
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
    })
    .superRefine((data, context) => {
      const isTranslation = Boolean(data.translationOf);

      if (isTranslation && data.lang !== "en") {
        context.addIssue({
          code: "custom",
          path: ["lang"],
          message: "Translations must use lang: en.",
        });
      }

      if (isTranslation && data.slug !== `${data.translationOf}/en`) {
        context.addIssue({
          code: "custom",
          path: ["slug"],
          message: "An English translation slug must be <translationOf>/en.",
        });
      }

      if (!isTranslation && data.slug?.endsWith("/en")) {
        context.addIssue({
          code: "custom",
          path: ["slug"],
          message: "Only English translations may use an /en slug suffix.",
        });
      }

      if (isTranslation && !data.translationMethod) {
        context.addIssue({
          code: "custom",
          path: ["translationMethod"],
          message: "Translations must identify how they were translated.",
        });
      }

      if (
        !isTranslation &&
        (data.translationMethod || data.translationReviewed === true)
      ) {
        context.addIssue({
          code: "custom",
          path: ["translationOf"],
          message: "Translation metadata can only be used on a translation.",
        });
      }

      if (
        isTranslation &&
        data.draft !== true &&
        data.translationReviewed !== true
      ) {
        context.addIssue({
          code: "custom",
          path: ["translationReviewed"],
          message: "Published translations must be reviewed by the author.",
        });
      }
    }),
});

const legal = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

export const collections = { blog, legal };
