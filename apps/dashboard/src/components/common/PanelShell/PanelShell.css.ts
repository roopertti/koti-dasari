import { style, styleVariants } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

const panelBase = style({
  background: vars.color.bgPanel,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radii.md,
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  minWidth: 0,
  overflow: 'hidden',
  '@media': {
    [mq.pi]: {
      padding: '12px 14px',
      gap: vars.space.sm,
    },
  },
});

export const panel = styleVariants({
  // `fill` takes the leftover height; `auto` sizes to its content but stays
  // shrinkable, so three panels on a short page compress (their bodies scroll)
  // instead of overflowing it. The floor keeps `fill` from collapsing to a
  // title bar when the two `auto` panels are content-heavy.
  fill: [panelBase, { flex: '1 1 0', minHeight: '96px' }],
  auto: [panelBase, { flex: '0 1 auto', minHeight: 0 }],
});

export const head = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space.md,
  minWidth: 0,
});

export const body = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
});
