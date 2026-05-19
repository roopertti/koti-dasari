import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../../../styles/theme.css.js';

export const root = style({
  display: 'grid',
  gap: vars.space.md,
  gridTemplateColumns: '1fr 1fr',
  '@media': {
    [mq.pi]: {
      gridTemplateColumns: '1fr',
    },
  },
});
