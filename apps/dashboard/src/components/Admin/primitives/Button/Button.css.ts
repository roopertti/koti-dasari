import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

const base = style({
  font: 'inherit',
  color: 'inherit',
  background: 'transparent',
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radii.sm,
  minHeight: vars.size.touchMin,
  minWidth: vars.size.touchMin,
  padding: '8px 14px',
  cursor: 'pointer',
  selectors: {
    '&:active': {
      background: vars.color.bgPanelHover,
    },
  },
});

export const variant = styleVariants({
  primary: [
    base,
    {
      background: vars.color.accent,
      color: vars.color.accentFg,
      border: 'none',
      fontWeight: 600,
    },
  ],
  subtle: [
    base,
    {
      borderColor: vars.color.border,
      color: vars.color.fgMuted,
    },
  ],
  danger: [
    base,
    {
      color: vars.color.danger,
      borderColor: vars.color.danger,
    },
  ],
});
