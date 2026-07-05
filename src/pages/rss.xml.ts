import rss from "@astrojs/rss"
import { getCollection } from "astro:content"
import { SITE } from "@consts"
import { getPostDateTime } from "@lib/utils"

type Context = {
  site: string
}

export async function GET(context: Context) {
	const items = (await getCollection("blog"))
    .filter((post) => !post.data.draft)

  items.sort((a, b) => getPostDateTime(b.data).getTime() - getPostDateTime(a.data).getTime())

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.summary,
      pubDate: getPostDateTime(item.data),
      link: `/blog/${item.id.replace(/\/index$/, "")}/`,
    })),
  })
}
