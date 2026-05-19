import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

const base = style({
  fontSize: vars.font.sizeSm,
});

export const tone = styleVariants({
  info: [base, { color: vars.color.fgMuted }],
  error: [base, { color: vars.color.danger }],
  empty: [
    base,
    {
      color: vars.color.fgMuted,
      fontStyle: 'italic',
      padding: vars.space.md,
    },
  ],
});

export const fullWidth = style({
  gridColumn: '1 / -1',
});
