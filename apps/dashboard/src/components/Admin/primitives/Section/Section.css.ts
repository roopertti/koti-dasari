import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

export const root = style({
  background: vars.color.bgPanel,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radii.md,
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
});
