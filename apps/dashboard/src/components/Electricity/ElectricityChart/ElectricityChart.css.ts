import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const chart = style({
  display: 'block',
  width: '100%',
  height: 'auto',
  maxHeight: '260px',
});

export const axis = style({
  stroke: vars.color.border,
  strokeWidth: 1,
});

export const bar = style({
  transition: 'opacity 120ms ease',
});

export const barCheap = style({
  fill: vars.color.success,
});

export const barNeutral = style({
  fill: vars.color.accent,
});

export const barExpensive = style({
  fill: vars.color.danger,
});

export const barCurrent = style({
  opacity: 1,
  stroke: vars.color.fg,
  strokeWidth: 1.5,
});

export const barFuture = style({
  opacity: 0.85,
});

export const barTomorrow = style({
  opacity: 0.45,
});

export const barPast = style({
  opacity: 0.3,
});

export const hourLabel = style({
  fill: vars.color.fgMuted,
  fontSize: vars.font.sizeXs,
  fontVariantNumeric: 'tabular-nums',
});

const priceLabelBase = style({
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightSemibold,
  fontVariantNumeric: 'tabular-nums',
});

export const priceLabelCheap = style([priceLabelBase, { fill: vars.color.success }]);
export const priceLabelNeutral = style([priceLabelBase, { fill: vars.color.fg }]);
export const priceLabelExpensive = style([priceLabelBase, { fill: vars.color.danger }]);
