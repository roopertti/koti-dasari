import { describe, expect, it } from 'vitest';
import { parseYleRss, stripHtml } from '../src/yle-rss.js';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Yle Uutiset</title>
    <item>
      <title>Otsikko yksi</title>
      <link>https://yle.fi/a/74-1</link>
      <guid isPermaLink="false">yle-1</guid>
      <pubDate>Sun, 24 May 2026 10:30:00 +0300</pubDate>
      <description><![CDATA[<p>Lyhyt <a href="https://yle.fi">yhteenveto</a> jutusta.</p>]]></description>
    </item>
    <item>
      <title>Otsikko kaksi</title>
      <link>https://yle.fi/a/74-2</link>
      <guid isPermaLink="false">yle-2</guid>
      <pubDate>Sun, 24 May 2026 11:00:00 +0300</pubDate>
      <description>Ilman HTML&amp;tageja</description>
    </item>
  </channel>
</rss>`;

describe('parseYleRss', () => {
  it('parses each item with stripped summary and ISO publishedAt', () => {
    const items = parseYleRss(SAMPLE_RSS);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      guid: 'yle-1',
      title: 'Otsikko yksi',
      link: 'https://yle.fi/a/74-1',
      summary: 'Lyhyt yhteenveto jutusta.',
      publishedAt: '2026-05-24T07:30:00.000Z',
    });
    expect(items[1].summary).toBe('Ilman HTML&tageja');
  });

  it('falls back to link as guid when guid missing', () => {
    const xml = `<?xml version="1.0"?>
      <rss><channel><item>
        <title>No guid</title>
        <link>https://yle.fi/a/x</link>
        <pubDate>Sun, 24 May 2026 10:30:00 +0300</pubDate>
      </item></channel></rss>`;
    const items = parseYleRss(xml);
    expect(items[0].guid).toBe('https://yle.fi/a/x');
  });

  it('returns [] for a channel with no items', () => {
    const xml = '<?xml version="1.0"?><rss><channel><title>Empty</title></channel></rss>';
    expect(parseYleRss(xml)).toEqual([]);
  });

  it('handles a single-item channel (object, not array)', () => {
    const xml = `<?xml version="1.0"?>
      <rss><channel><item>
        <title>Solo</title>
        <link>https://yle.fi/a/solo</link>
        <guid>solo-1</guid>
        <pubDate>Sun, 24 May 2026 09:00:00 +0300</pubDate>
      </item></channel></rss>`;
    const items = parseYleRss(xml);
    expect(items).toHaveLength(1);
    expect(items[0].guid).toBe('solo-1');
  });

  it('throws on malformed input', () => {
    expect(() => parseYleRss('<not-rss>nope</not-rss>')).toThrow(/validation failed/);
  });
});

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello\n\n<strong>world</strong></p>')).toBe('Hello world');
  });

  it('decodes common entities', () => {
    expect(stripHtml('Cats &amp; dogs &lt;3 &quot;wow&quot;')).toBe('Cats & dogs <3 "wow"');
  });
});
