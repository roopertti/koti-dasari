export interface NewsItem {
  guid: string;
  title: string;
  link: string;
  summary: string | null;
  publishedAt: string;
  source: string;
  fetchedAt: string;
}
