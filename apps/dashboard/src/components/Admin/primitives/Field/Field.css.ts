import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const fullWidth = style({
  gridColumn: '1 / -1',
});

export const label = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
  fontWeight: 500,
});
