import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

export const list = style({
  display: 'flex',
  gap: '24px',
  margin: 0,
  padding: 0,
  fontSize: vars.font.sizeMd,
  color: vars.color.fgMuted,
  '@media': {
    [mq.pi]: {
      gap: vars.space.xl,
      fontSize: vars.font.sizeBase,
    },
  },
});

export const item = style({
  display: 'flex',
  flexDirection: 'column',
});

export const label = style({
  fontSize: vars.font.sizeXs,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.fgDim,
});

export const value = style({
  margin: 0,
  color: vars.color.fg,
  fontVariantNumeric: 'tabular-nums',
  fontSize: '1.1rem',
  fontWeight: 500,
  '@media': {
    [mq.pi]: {
      fontSize: '1.2rem',
    },
  },
});
