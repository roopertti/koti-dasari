import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

export const root = style({
  display: 'flex',
  gap: vars.space.sm,
  justifyContent: 'flex-end',
  gridColumn: '1 / -1',
});
