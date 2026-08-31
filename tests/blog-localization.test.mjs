import assert from "node:assert/strict";
import test from "node:test";

import {
  getAllWritingItems,
  getEnglishPreferredItems,
  getPostAlternates,
  getPostPath,
  validateBlogPosts,
} from "../src/lib/blog.ts";

function post(id, data) {
  return {
    id,
    body: "",
    collection: "blog",
    data: {
      title: id,
      summary: id,
      date: "2026-08-30",
      timezone: "UTC",
      tags: [],
      draft: false,
      ...data,
    },
  };
}

test("English-preferred writing chooses a translation, falls back to Korean, and preserves English originals", () => {
  const koreanTranslated = post("translated-source", {
    slug: "translated-source",
    lang: "ko",
  });
  const translation = post("translated-source/en", {
    slug: "translated-source/en",
    lang: "en",
    translationOf: "translated-source",
    translationMethod: "ai-assisted",
    translationReviewed: true,
  });
  const koreanOnly = post("korean-only", {
    slug: "korean-only",
    lang: "ko",
  });
  const englishOriginal = post("english-original", {
    slug: "english-original",
    lang: "en",
  });
  const posts = [koreanTranslated, translation, koreanOnly, englishOriginal];

  validateBlogPosts(posts);

  const allWriting = getAllWritingItems(posts);
  const englishPreferred = getEnglishPreferredItems(posts);

  assert.equal(allWriting.length, 3);
  assert.equal(englishPreferred.length, 3);
  assert.equal(
    englishPreferred.find((item) => item.source.id === koreanTranslated.id)
      ?.display.id,
    translation.id,
  );
  assert.equal(
    englishPreferred.find((item) => item.source.id === koreanOnly.id)?.display
      .id,
    koreanOnly.id,
  );
  assert.equal(
    englishPreferred.find((item) => item.source.id === englishOriginal.id)
      ?.display.id,
    englishOriginal.id,
  );
});

test("draft translations do not replace their Korean original", () => {
  const original = post("source", { slug: "source", lang: "ko" });
  const draftTranslation = post("source/en", {
    slug: "source/en",
    lang: "en",
    translationOf: "source",
    translationMethod: "ai-assisted",
    translationReviewed: false,
    draft: true,
  });

  const [item] = getEnglishPreferredItems([original, draftTranslation]);

  assert.equal(item.display.id, original.id);
  assert.equal(item.path, "/blog/source/");
});

test("only real translation pairs receive reciprocal language alternates", () => {
  const original = post("source", { slug: "source", lang: "ko" });
  const translation = post("source/en", {
    slug: "source/en",
    lang: "en",
    translationOf: "source",
    translationMethod: "human",
    translationReviewed: true,
  });
  const englishOriginal = post("english", { slug: "english", lang: "en" });
  const posts = [original, translation, englishOriginal];

  assert.deepEqual(getPostAlternates(original, posts), [
    { lang: "ko", path: "/blog/source/" },
    { lang: "en", path: "/blog/source/en/" },
  ]);
  assert.deepEqual(getPostAlternates(translation, posts), [
    { lang: "ko", path: "/blog/source/" },
    { lang: "en", path: "/blog/source/en/" },
  ]);
  assert.deepEqual(getPostAlternates(englishOriginal, posts), []);
  assert.equal(getPostPath(translation), "/blog/source/en/");
});

test("translation validation rejects a missing or non-Korean original", () => {
  const translation = post("missing/en", {
    slug: "missing/en",
    lang: "en",
    translationOf: "missing",
    translationMethod: "ai-assisted",
    translationReviewed: true,
  });

  assert.throws(() => validateBlogPosts([translation]), /missing original/);

  const englishOriginal = post("source", { slug: "source", lang: "en" });
  const invalidTranslation = post("source/en", {
    slug: "source/en",
    lang: "en",
    translationOf: "source",
    translationMethod: "human",
    translationReviewed: true,
  });

  assert.throws(
    () => validateBlogPosts([englishOriginal, invalidTranslation]),
    /Korean original/,
  );
});

test("a published translation cannot reference a draft original", () => {
  const draftOriginal = post("source", {
    slug: "source",
    lang: "ko",
    draft: true,
  });
  const translation = post("source/en", {
    slug: "source/en",
    lang: "en",
    translationOf: "source",
    translationMethod: "human",
    translationReviewed: true,
  });

  assert.throws(
    () => validateBlogPosts([draftOriginal, translation]),
    /draft original/,
  );
});
