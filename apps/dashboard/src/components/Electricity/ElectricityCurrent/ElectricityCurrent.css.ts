import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

export const current = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const priceRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
  fontVariantNumeric: 'tabular-nums',
});

export const priceValue = style({
  fontSize: 'clamp(4rem, 8vw, 5.5rem)',
  fontWeight: 500,
  lineHeight: 1,
  letterSpacing: '-0.03em',
  color: vars.color.fg,
  '@media': {
    [mq.pi]: {
      fontSize: '3.5rem',
    },
  },
});

export const caption = style({
  color: vars.color.fgMuted,
  fontSize: 'clamp(1rem, 1.4vw, 1.3rem)',
  '@media': {
    [mq.pi]: {
      fontSize: '1.1rem',
    },
  },
});

export const labelRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexWrap: 'wrap',
});

export const statsRow = style({
  marginTop: vars.space.sm,
});
