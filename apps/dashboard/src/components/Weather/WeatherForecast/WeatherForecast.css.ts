import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

export const forecast = style({
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'minmax(56px, 1fr)',
  gap: '6px',
  margin: 0,
  paddingLeft: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingTop: vars.space.md,
  marginTop: '4px',
  listStyle: 'none',
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
      paddingTop: vars.space.sm,
    },
  },
});

export const hour = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 2px',
  fontVariantNumeric: 'tabular-nums',
  '@media': {
    [mq.pi]: {
      gap: '2px',
      padding: '2px',
    },
  },
});

export const time = style({
  fontSize: '0.85rem',
  color: vars.color.fgMuted,
  '@media': {
    [mq.pi]: {
      fontSize: '0.95rem',
    },
  },
});

export const icon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.fgMuted,
  fontSize: '1.6rem',
  lineHeight: 1,
  '@media': {
    [mq.pi]: {
      fontSize: '1.3rem',
    },
  },
});

export const temp = style({
  fontWeight: 600,
  fontSize: '1.15rem',
  '@media': {
    [mq.pi]: {
      fontSize: '1.2rem',
    },
  },
});

export const precip = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.accent,
});
