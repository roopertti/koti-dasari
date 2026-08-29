import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../styles/theme.css.js';

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  '@media': {
    [mq.pi]: {
      gap: vars.space.sm,
    },
  },
});
