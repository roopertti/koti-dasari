import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

export const panel = style({
  background: vars.color.bgPanel,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radii.md,
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
  '@media': {
    [mq.pi]: {
      padding: '20px',
      gap: '15px',
    },
  },
});

export const head = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space.md,
  minWidth: 0,
});

export const title = style({
  fontSize: vars.font.sizeMd,
  letterSpacing: vars.font.letterSpacingWide,
  textTransform: 'uppercase',
  color: vars.color.fgMuted,
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
