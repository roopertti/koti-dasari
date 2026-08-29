import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

// The light ground is deliberately not themed: a QR code only scans as dark
// modules on a light field, so it must stay light even in the dark kiosk theme.
export const image = style({
  height: 'auto',
  background: '#ffffff',
  borderRadius: vars.radii.sm,
  padding: vars.space.md,
});

export const size = styleVariants({
  sm: { width: 'min(24vw, 190px)' },
  md: { width: 'min(60vw, 320px)' },
});
