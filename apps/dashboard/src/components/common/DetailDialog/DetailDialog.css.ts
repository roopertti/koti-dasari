import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  minWidth: 'min(420px, 78vw)',
  maxWidth: '78vw',
});

export const description = style({
  margin: 0,
  fontSize: vars.font.sizeBase,
  lineHeight: vars.font.lineHeightBase,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  paddingTop: vars.space.md,
  borderTop: `1px solid ${vars.color.border}`,
});

export const empty = style([
  description,
  {
    color: vars.color.fgDim,
    fontStyle: 'italic',
  },
]);
