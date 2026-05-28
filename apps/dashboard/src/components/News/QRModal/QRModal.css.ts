import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const qrImage = style({
  width: 'min(60vw, 320px)',
  height: 'auto',
  background: '#ffffff',
  borderRadius: vars.radii.sm,
  padding: vars.space.md,
});
