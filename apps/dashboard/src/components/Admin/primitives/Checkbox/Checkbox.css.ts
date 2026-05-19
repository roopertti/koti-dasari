import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minHeight: vars.size.touchMin,
});

export const input = style({
  width: '20px',
  height: '20px',
  flexShrink: 0,
});

export const hint = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
});
