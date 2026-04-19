import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/theme.css.js';

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
});

export const dayLabel = style({
  fontSize: '0.85rem',
  color: vars.color.fgMuted,
  textTransform: 'uppercase',
  letterSpacing: vars.font.letterSpacingWide,
  marginBottom: '6px',
});

export const dayEvents = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const event = style({
  display: 'flex',
  gap: vars.space.md,
  padding: '10px 12px',
  borderRadius: vars.radii.sm,
  background: vars.color.bgPanelHover,
  minHeight: vars.size.touchMin,
});

export const eventBar = style({
  width: '4px',
  borderRadius: '2px',
  flexShrink: 0,
});

export const eventTitle = style({
  fontWeight: 500,
});

export const eventWhen = style({
  fontSize: '0.85rem',
  color: vars.color.fgMuted,
  marginTop: vars.space.xs,
  fontVariantNumeric: 'tabular-nums',
});
