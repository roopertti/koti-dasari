import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

export const link = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radii.sm,
  textDecoration: 'none',
  color: vars.color.fgMuted,
  fontWeight: 500,
  whiteSpace: 'nowrap',
});

export const linkActive = style({
  color: vars.color.fg,
  background: vars.color.bgPanelHover,
});
