import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/theme.css.js';

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});
