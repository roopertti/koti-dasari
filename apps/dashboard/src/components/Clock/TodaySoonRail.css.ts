import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../styles/theme.css.js';

export const wrap = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  minWidth: 0,
  maxWidth: '460px',
  alignItems: 'flex-end',
  textAlign: 'right',
  '@media': {
    [mq.tablet]: {
      alignItems: 'center',
      textAlign: 'center',
      maxWidth: '100%',
    },
  },
});

export const label = style({
  fontSize: '0.85rem',
  color: vars.color.fgMuted,
  textTransform: 'uppercase',
  letterSpacing: vars.font.letterSpacingWide,
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '100%',
});

export const item = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
  justifyContent: 'flex-end',
  minWidth: 0,
  '@media': {
    [mq.tablet]: {
      justifyContent: 'center',
    },
  },
});

export const itemOverdue = style({
  color: vars.color.danger,
});

export const kindIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'center',
  fontSize: '1.05rem',
  color: vars.color.fgMuted,
  flexShrink: 0,
  selectors: {
    [`${itemOverdue} &`]: {
      color: vars.color.danger,
    },
  },
});

export const horizon = style({
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: vars.font.letterSpacingWide,
  color: vars.color.fgMuted,
  padding: '2px 8px',
  borderRadius: vars.radii.pill,
  background: vars.color.bgPanelHover,
  flexShrink: 0,
  selectors: {
    [`${itemOverdue} &`]: {
      background: `color-mix(in srgb, ${vars.color.danger} 24%, transparent)`,
      color: vars.color.danger,
    },
  },
});

export const when = style({
  fontSize: '0.9rem',
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.fgMuted,
  flexShrink: 0,
  selectors: {
    [`${itemOverdue} &`]: {
      color: vars.color.danger,
    },
  },
});

export const title = style({
  fontSize: '1.05rem',
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});

export const more = style({
  fontSize: '0.85rem',
  color: vars.color.fgMuted,
});
