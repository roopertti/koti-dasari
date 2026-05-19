import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const inputBase = style({
  font: 'inherit',
  color: 'inherit',
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radii.sm,
  padding: '10px 12px',
  minHeight: vars.size.touchMin,
  selectors: {
    '&:focus': {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: '2px',
    },
  },
});
