import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const groups = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const stopHead = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
  marginBottom: vars.space.sm,
  paddingBottom: '6px',
  borderBottom: `1px solid ${vars.color.border}`,
});

export const stopMeta = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
  fontVariantNumeric: 'tabular-nums',
});
