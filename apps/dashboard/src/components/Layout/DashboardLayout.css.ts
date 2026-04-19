import { globalStyle, style } from '@vanilla-extract/css';
import { mq, vars } from '../../styles/theme.css.js';

export const dashboard = style({
  minHeight: '100%',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  gap: vars.space.lg,
  padding: vars.space.lg,
  '@media': {
    [mq.tablet]: {
      height: 'auto',
      minHeight: '100vh',
      gridTemplateRows: 'none',
      gridAutoRows: 'minmax(min-content, auto)',
    },
    [mq.pi]: {
      padding: vars.space.md,
      gap: vars.space.md,
    },
  },
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const hero = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)',
  gap: '12px',
  minHeight: 0,
  '@media': {
    [mq.tablet]: {
      gridTemplateColumns: '1fr',
      gridAutoRows: 'minmax(min-content, auto)',
    },
  },
});

export const heroItem = style({
  minHeight: 0,
  display: 'flex',
});

globalStyle(`${heroItem} > *`, {
  flex: 1,
});

export const secondary = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: vars.space.lg,
  selectors: {
    '&:empty': {
      display: 'none',
    },
  },
  '@media': {
    [mq.tablet]: {
      gridTemplateColumns: '1fr',
    },
  },
});
