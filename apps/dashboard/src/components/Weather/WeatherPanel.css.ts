import { globalStyle, style } from '@vanilla-extract/css';
import { mq, vars } from '../../styles/theme.css.js';

export const current = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gridTemplateRows: 'auto auto',
  alignItems: 'center',
  columnGap: vars.space.xl,
  rowGap: '6px',
  '@media': {
    [mq.pi]: {
      columnGap: '18px',
    },
  },
});

export const currentIcon = style({
  gridRow: 'span 2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.accent,
  fontSize: 'clamp(4rem, 9vw, 6rem)',
  lineHeight: 1,
  '@media': {
    [mq.pi]: {
      fontSize: '4.5rem',
    },
  },
});

export const currentTemp = style({
  fontSize: 'clamp(4rem, 8vw, 5.5rem)',
  fontWeight: 500,
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.03em',
  '@media': {
    [mq.pi]: {
      fontSize: '3.5rem',
    },
  },
});

export const currentLabel = style({
  color: vars.color.fgMuted,
  fontSize: 'clamp(1rem, 1.4vw, 1.3rem)',
  '@media': {
    [mq.pi]: {
      fontSize: '1.2rem',
    },
  },
});

export const stats = style({
  gridColumn: '1 / -1',
  display: 'flex',
  gap: '24px',
  margin: '10px 0 0',
  padding: 0,
  fontSize: vars.font.sizeMd,
  color: vars.color.fgMuted,
  '@media': {
    [mq.pi]: {
      gap: vars.space.xl,
      marginTop: vars.space.sm,
      fontSize: vars.font.sizeBase,
    },
  },
});

globalStyle(`${stats} > div`, {
  display: 'flex',
  flexDirection: 'column',
});

globalStyle(`${stats} dt`, {
  fontSize: vars.font.sizeXs,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.fgDim,
});

globalStyle(`${stats} dd`, {
  margin: 0,
  color: vars.color.fg,
  fontVariantNumeric: 'tabular-nums',
  fontSize: '1.1rem',
  fontWeight: 500,
});

globalStyle(`${stats} dd`, {
  '@media': {
    [mq.pi]: {
      fontSize: '1.2rem',
    },
  },
});

export const forecast = style({
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'minmax(56px, 1fr)',
  gap: '6px',
  paddingTop: vars.space.md,
  marginTop: '4px',
  borderTop: `1px solid ${vars.color.border}`,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  '@media': {
    [mq.pi]: {
      gridAutoColumns: 'minmax(auto, 1fr)',
      gap: '4px',
      paddingTop: '10px',
    },
  },
});

export const forecastHour = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 2px',
  fontVariantNumeric: 'tabular-nums',
});

export const forecastTime = style({
  fontSize: '0.85rem',
  color: vars.color.fgMuted,
  '@media': {
    [mq.pi]: {
      fontSize: '0.95rem',
    },
  },
});

export const forecastIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.fgMuted,
  fontSize: '1.6rem',
  lineHeight: 1,
});

export const forecastTemp = style({
  fontWeight: 600,
  fontSize: '1.15rem',
  '@media': {
    [mq.pi]: {
      fontSize: '1.2rem',
    },
  },
});

export const forecastPrecip = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.accent,
});
