import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

const rootBase = {
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
} as const;

export const root = styleVariants({
  default: rootBase,
  fullWidth: { ...rootBase, gridColumn: '1 / -1' },
});

export const label = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
  fontWeight: 500,
});
