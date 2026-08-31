import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { parse } from "yaml"

const config = parse(await readFile(new URL("../.pages.yml", import.meta.url), "utf8"))
const blog = config.content.find((item) => item.name === "blog")
const fields = new Map(blog.fields.map((field) => [field.name, field]))

test("Pages CMS exposes every localization field required by the blog schema", () => {
  for (const name of [
    "slug",
    "lang",
    "translationOf",
    "translationMethod",
    "translationReviewed",
    "title",
    "summary",
    "date",
    "tags",
    "draft",
    "body",
  ]) {
    assert.ok(fields.has(name), `Missing Pages CMS field: ${name}`)
  }
})

test("translationOf accepts an empty value or a base slug, but not an /en path", () => {
  const field = fields.get("translationOf")
  const pattern = new RegExp(field.pattern.regex)

  assert.equal(pattern.test(""), true)
  assert.equal(pattern.test("source-post"), true)
  assert.equal(pattern.test("source-post/en"), false)
  assert.equal(pattern.test("Source Post"), false)
})
