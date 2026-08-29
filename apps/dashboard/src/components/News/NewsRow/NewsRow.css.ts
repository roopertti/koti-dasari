import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';
import { rowButtonBase } from '../../common/rowButtonBase.css.js';

export const row = style([
  rowButtonBase,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: vars.space.xs,
    padding: `${vars.space.sm} ${vars.space.md}`,
    borderRadius: vars.radii.sm,
    background: vars.color.bgPanelHover,
  },
]);

export const title = style({
  fontWeight: vars.font.weightMedium,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const titleFull = style({
  fontWeight: vars.font.weightMedium,
});

export const summary = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
  overflowWrap: 'anywhere',
});

export const meta = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
  fontVariantNumeric: 'tabular-nums',
});
