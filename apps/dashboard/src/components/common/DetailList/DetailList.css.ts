import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

export const list = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  columnGap: vars.space.lg,
  rowGap: vars.space.sm,
  margin: 0,
  alignItems: 'baseline',
  '@media': {
    [mq.pi]: {
      columnGap: vars.space.md,
    },
  },
});

export const label = style({
  fontSize: vars.font.sizeXs,
  textTransform: 'uppercase',
  letterSpacing: vars.font.letterSpacingWide,
  color: vars.color.fgDim,
  whiteSpace: 'nowrap',
});

export const value = style({
  margin: 0,
  color: vars.color.fg,
  fontSize: vars.font.sizeBase,
  overflowWrap: 'anywhere',
});
