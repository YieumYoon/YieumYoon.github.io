import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "@consts";
import { getAllWritingItems, validateBlogPosts } from "@lib/blog";
import { getPostDateTime } from "@lib/utils";

type Context = {
  site: string;
};

export async function GET(context: Context) {
  const posts = await getCollection("blog");
  validateBlogPosts(posts);
  const items = getAllWritingItems(posts);

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site,
    items: items.map((item) => ({
      title: item.source.data.title,
      description: item.source.data.summary,
      pubDate: getPostDateTime(item.source.data),
      link: item.path,
    })),
  });
}
