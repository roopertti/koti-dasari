import { assignVars, createGlobalTheme, globalStyle } from '@vanilla-extract/css';

const darkTokens = {
  color: {
    bg: '#08090c',
    bgPanel: '#101218',
    bgPanelHover: '#181b24',
    border: '#1f2330',
    fg: '#e8eaf0',
    fgMuted: '#8b94a7',
    fgDim: '#5c6577',
    accent: '#2dd4bf',
    accentFg: '#052e2b',
    success: '#34d399',
    warn: '#fbbf24',
    danger: '#f87171',
  },
  radii: {
    sm: '12px',
    md: '22px',
    pill: '999px',
  },
  space: {
    xs: '2px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '28px',
  },
  size: {
    touchMin: '44px',
  },
  font: {
    family: '"Inter", "Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    familyMono:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    familyAlt: '"Fira Sans", sans-serif',
    sizeXs: '0.75rem',
    sizeSm: '0.9rem',
    sizeMd: '0.95rem',
    sizeBase: '1rem',
    weightMedium: '500',
    weightSemibold: '600',
    letterSpacingWide: '0.08em',
    letterSpacingTight: '-0.01em',
    lineHeightBase: '1.4',
  },
};

const lightTokens = {
  ...darkTokens,
  color: {
    ...darkTokens.color,
    bg: '#f6f7fa',
    bgPanel: '#ffffff',
    bgPanelHover: '#eef1f6',
    border: '#dde3ec',
    fg: '#1a1f2b',
    fgMuted: '#5c6577',
    fgDim: '#8b94a7',
    accent: '#0d9488',
    accentFg: '#ffffff',
    warn: '#d97706',
    danger: '#dc2626',
  },
};

export const vars = createGlobalTheme(':root', darkTokens);

export const breakpoints = {
  pi: '740px',
  tablet: '1100px',
} as const;

export const mq = {
  pi: `screen and (max-width: ${breakpoints.pi})`,
  tablet: `screen and (max-width: ${breakpoints.tablet})`,
  light: '(prefers-color-scheme: light)',
} as const;

globalStyle(':root', {
  fontFamily: vars.font.familyAlt,
  fontSize: '18px',
  lineHeight: vars.font.lineHeightBase,
  letterSpacing: vars.font.letterSpacingTight,
  colorScheme: 'dark',
  '@media': {
    [mq.light]: {
      vars: assignVars(vars, lightTokens),
      colorScheme: 'light',
    },
  },
});

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
});

globalStyle('html, body, #root', {
  margin: 0,
  padding: 0,
});

globalStyle('body', {
  background: vars.color.bg,
  color: vars.color.fg,
  WebkitFontSmoothing: 'antialiased',
});
