import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.lg,
});
