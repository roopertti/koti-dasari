import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../styles/theme.css.js';

export const shell = style({
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  background: vars.color.bg,
  color: vars.color.fg,
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderBottom: `1px solid ${vars.color.border}`,
  background: vars.color.bgPanel,
  position: 'sticky',
  top: 0,
  zIndex: 5,
});

export const nav = style({
  display: 'flex',
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  borderBottom: `1px solid ${vars.color.border}`,
  background: vars.color.bgPanel,
  position: 'sticky',
  top: 56,
  zIndex: 4,
  overflowX: 'auto',
});

export const main = style({
  flex: 1,
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  maxWidth: '900px',
  width: '100%',
  margin: '0 auto',
  '@media': {
    [mq.pi]: {
      padding: vars.space.md,
      gap: vars.space.md,
    },
  },
});
