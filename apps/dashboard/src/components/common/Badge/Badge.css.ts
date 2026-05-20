import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

const base = style({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: vars.radii.pill,
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightSemibold,
});

export const badge = styleVariants({
  default: [base, { background: vars.color.bgPanelHover, color: vars.color.fgMuted }],
  delay: [
    base,
    {
      background: `color-mix(in srgb, ${vars.color.warn} 30%, transparent)`,
      color: vars.color.warn,
    },
  ],
  success: [
    base,
    {
      background: `color-mix(in srgb, ${vars.color.success} 25%, transparent)`,
      color: vars.color.success,
    },
  ],
  danger: [
    base,
    {
      background: `color-mix(in srgb, ${vars.color.danger} 25%, transparent)`,
      color: vars.color.danger,
    },
  ],
});
