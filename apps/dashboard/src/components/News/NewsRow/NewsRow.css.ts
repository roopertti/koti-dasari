import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const row = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radii.sm,
  background: vars.color.bgPanelHover,
  minHeight: vars.size.touchMin,
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit',
  width: '100%',
  ':focus-visible': {
    outline: `2px solid ${vars.color.accent}`,
    outlineOffset: '2px',
  },
});

export const title = style({
  fontWeight: vars.font.weightMedium,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const meta = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
  fontVariantNumeric: 'tabular-nums',
});
