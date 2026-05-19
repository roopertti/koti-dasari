import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

export const root = style({
  display: 'flex',
  gap: vars.space.md,
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${vars.space.sm} 0`,
  borderTop: `1px solid ${vars.color.border}`,
  selectors: {
    '&:first-child': { borderTop: 'none' },
  },
});

export const main = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  flex: 1,
  minWidth: 0,
});

export const title = style({
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const meta = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
});

export const actions = style({
  display: 'flex',
  gap: vars.space.sm,
  flexShrink: 0,
});
