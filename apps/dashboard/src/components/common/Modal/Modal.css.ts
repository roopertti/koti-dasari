import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const dialog = style({
  border: 'none',
  borderRadius: vars.radii.md,
  background: vars.color.bgPanel,
  color: vars.color.fg,
  padding: vars.space.xl,
  maxWidth: '90vw',
  maxHeight: '90vh',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
  '::backdrop': {
    background: 'rgba(0, 0, 0, 0.6)',
  },
});

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.lg,
});
