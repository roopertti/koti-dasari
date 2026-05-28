import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

export const DEFAULT_YLE_FEED_URL =
  'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss';

/**
 * The `fast-xml-parser` output for an RSS feed `<item>`. `description` is optional
 * and may contain HTML that we strip before persisting.
 */
const RssItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  guid: z.union([z.string(), z.object({ '#text': z.string() })]).optional(),
  pubDate: z.string().optional(),
  description: z.string().optional(),
});

const RssChannelSchema = z.object({
  item: z.array(RssItemSchema).or(RssItemSchema).optional(),
});

const RssFeedSchema = z.object({
  rss: z.object({
    channel: RssChannelSchema,
  }),
});

export interface NewsItemEntry {
  guid: string;
  title: string;
  link: string;
  summary: string | null;
  publishedAt: string;
}

export async function fetchYleNews(
  feedUrl: string = DEFAULT_YLE_FEED_URL,
): Promise<NewsItemEntry[]> {
  const response = await fetch(feedUrl, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Yle RSS error: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parseYleRss(xml);
}

export function parseYleRss(xml: string): NewsItemEntry[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    parseTagValue: false,
  });

  const raw = parser.parse(xml);
  const parsed = RssFeedSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Yle RSS validation failed: ${parsed.error.message}`);
  }

  const items = parsed.data.rss.channel.item;
  if (!items) {
    return [];
  }
  const list = Array.isArray(items) ? items : [items];

  return list
    .map((item): NewsItemEntry | null => {
      const guidRaw = item.guid;
      const guid = typeof guidRaw === 'string' ? guidRaw : guidRaw?.['#text'];
      const link = item.link;
      const finalGuid = guid && guid.length > 0 ? guid : link;
      if (!finalGuid) {
        return null;
      }
      const publishedAt = item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString();
      return {
        guid: finalGuid,
        title: item.title,
        link,
        summary: item.description ? stripHtml(item.description) : null,
        publishedAt,
      };
    })
    .filter((entry): entry is NewsItemEntry => entry !== null);
}

/**
 * Strip HTML tags and collapse whitespace. Yle's `<description>` often contains
 * inline anchors and `<p>` wrappers — the panel renders plain text only.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
