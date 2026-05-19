import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const shell = style({
  position: 'fixed',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  background: vars.color.bg,
  padding: vars.space.lg,
});

export const card = style({
  background: vars.color.bgPanel,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radii.md,
  padding: vars.space.xl,
  width: '100%',
  maxWidth: '360px',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});
