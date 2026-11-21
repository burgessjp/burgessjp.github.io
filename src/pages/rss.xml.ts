import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { standalonePosts } from '../data/standalone-posts';

export async function GET(context) {
  const items = [
    ...(await getCollection('blog')).map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: `/blog/${post.id}/`,
    })),
    ...standalonePosts.map((post) => ({
      title: post.title,
      pubDate: post.date,
      description: post.excerpt,
      link: post.url,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'PENG Blog',
    description: 'Mobile Dev | AI Explorer',
    site: context.site,
    items,
    customData: `<language>zh-CN</language>`,
  });
}
