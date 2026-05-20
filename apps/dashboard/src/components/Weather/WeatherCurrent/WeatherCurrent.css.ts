import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

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

export const statsRow = style({
  gridColumn: '1 / -1',
  marginTop: vars.space.sm,
});
