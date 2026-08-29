import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

export const list = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: vars.space.lg,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const item = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  textAlign: 'center',
});

export const address = style({
  fontFamily: vars.font.familyMono,
  wordBreak: 'break-all',
  '@media': {
    [mq.pi]: {
      fontSize: vars.font.sizeXs,
    },
  },
});
