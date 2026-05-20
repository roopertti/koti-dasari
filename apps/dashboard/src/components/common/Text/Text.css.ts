import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const base = style({
  margin: 0,
});

export const tone = styleVariants({
  default: { color: vars.color.fg },
  muted: { color: vars.color.fgMuted },
});

export const size = styleVariants({
  sm: { fontSize: vars.font.sizeSm },
  md: { fontSize: vars.font.sizeMd },
});
