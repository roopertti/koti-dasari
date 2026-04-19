import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/theme.css.js';

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const reminder = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: '10px 12px',
  borderRadius: vars.radii.sm,
  background: vars.color.bgPanelHover,
  minHeight: vars.size.touchMin,
});

export const reminderDue = style({
  background: `color-mix(in srgb, ${vars.color.warn} 20%, transparent)`,
  border: `1px solid color-mix(in srgb, ${vars.color.warn} 40%, transparent)`,
});

export const body = style({
  flex: 1,
  minWidth: 0,
});

export const title = style({
  fontWeight: 500,
});

export const when = style({
  fontSize: '0.85rem',
  color: vars.color.fgMuted,
  marginTop: vars.space.xs,
  fontVariantNumeric: 'tabular-nums',
});

export const ack = style({
  minHeight: vars.size.touchMin,
  padding: `0 ${vars.space.lg}`,
  background: vars.color.accent,
  borderColor: vars.color.accent,
  color: vars.color.accentFg,
  fontWeight: 600,
  selectors: {
    '&:disabled': {
      opacity: 0.5,
    },
  },
});
