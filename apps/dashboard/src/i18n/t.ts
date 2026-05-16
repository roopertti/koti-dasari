import en from './en.json' with { type: 'json' };
import fi from './fi.json' with { type: 'json' };

type Catalog = Record<string, string>;

const primary = fi as Catalog;
const fallback = en as Catalog;

export const LOCALE = 'fi-FI';

export function t(key: string, params?: Record<string, string | number>): string {
  const template = primary[key] ?? fallback[key] ?? key;
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}
