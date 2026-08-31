import type { CollectionEntry } from "astro:content";

import { getPostDateTime } from "./utils.ts";

export type BlogPost = CollectionEntry<"blog">;
export type BlogLanguage = BlogPost["data"]["lang"];
export type WritingStatus = "ko-original" | "en-original" | "en-translation";

export type WritingViewItem = {
  source: BlogPost;
  display: BlogPost;
  path: string;
  status: WritingStatus;
};

export type LanguageAlternate = {
  lang: BlogLanguage;
  path: string;
};

function getEntrySlug(post: BlogPost) {
  return post.data.slug ?? post.id.replace(/\/index$/, "");
}

export function isTranslation(post: BlogPost) {
  return Boolean(post.data.translationOf);
}

export function isPublished(post: BlogPost) {
  return post.data.draft !== true;
}

export function getSourceSlug(post: BlogPost) {
  return post.data.translationOf ?? getEntrySlug(post).replace(/\/en$/, "");
}

export function getPostPath(post: BlogPost) {
  if (post.data.translationOf) {
    return `/blog/${post.data.translationOf}/en/`;
  }

  return `/blog/${getEntrySlug(post)}/`;
}

export function getWritingStatus(post: BlogPost): WritingStatus {
  if (post.data.translationOf) return "en-translation";
  return post.data.lang === "en" ? "en-original" : "ko-original";
}

export function getPublishedOriginalPosts(posts: BlogPost[]) {
  return posts
    .filter((post) => isPublished(post) && !isTranslation(post))
    .sort(
      (a, b) =>
        getPostDateTime(b.data).getTime() - getPostDateTime(a.data).getTime(),
    );
}

export function getTranslationFor(original: BlogPost, posts: BlogPost[]) {
  const originalSlug = getSourceSlug(original);
  return posts.find(
    (post) =>
      isPublished(post) &&
      post.data.lang === "en" &&
      post.data.translationOf === originalSlug,
  );
}

export function getOriginalFor(translation: BlogPost, posts: BlogPost[]) {
  if (!translation.data.translationOf) return undefined;

  return posts.find(
    (post) =>
      isPublished(post) &&
      !isTranslation(post) &&
      getSourceSlug(post) === translation.data.translationOf,
  );
}

export function getAllWritingItems(posts: BlogPost[]): WritingViewItem[] {
  return getPublishedOriginalPosts(posts).map((source) => ({
    source,
    display: source,
    path: getPostPath(source),
    status: getWritingStatus(source),
  }));
}

export function getEnglishPreferredItems(posts: BlogPost[]): WritingViewItem[] {
  return getPublishedOriginalPosts(posts).map((source) => {
    const display =
      source.data.lang === "en"
        ? source
        : (getTranslationFor(source, posts) ?? source);

    return {
      source,
      display,
      path: getPostPath(display),
      status: getWritingStatus(display),
    };
  });
}

export function getPostAlternates(
  post: BlogPost,
  posts: BlogPost[],
): LanguageAlternate[] {
  const original = isTranslation(post) ? getOriginalFor(post, posts) : post;
  if (!original || original.data.lang !== "ko") return [];

  const translation = getTranslationFor(original, posts);
  if (!translation) return [];

  return [
    { lang: "ko", path: getPostPath(original) },
    { lang: "en", path: getPostPath(translation) },
  ];
}

export function validateBlogPosts(posts: BlogPost[]) {
  const originals = new Map<string, BlogPost>();
  const translations = new Map<string, BlogPost>();

  for (const post of posts) {
    if (isTranslation(post)) continue;

    const slug = getSourceSlug(post);
    if (originals.has(slug)) {
      throw new Error(`Duplicate original blog slug: ${slug}`);
    }
    originals.set(slug, post);
  }

  for (const post of posts) {
    const sourceSlug = post.data.translationOf;
    if (!sourceSlug) continue;

    const original = originals.get(sourceSlug);
    if (!original) {
      throw new Error(
        `Translation ${post.id} references missing original: ${sourceSlug}`,
      );
    }
    if (original.data.lang !== "ko") {
      throw new Error(
        `Translation ${post.id} must reference a Korean original: ${sourceSlug}`,
      );
    }
    if (isPublished(post) && !isPublished(original)) {
      throw new Error(
        `Published translation ${post.id} references a draft original: ${sourceSlug}`,
      );
    }
    if (translations.has(sourceSlug)) {
      throw new Error(
        `Multiple English translations reference original: ${sourceSlug}`,
      );
    }
    translations.set(sourceSlug, post);
  }
}
