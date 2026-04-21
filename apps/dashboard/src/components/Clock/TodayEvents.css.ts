import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../styles/theme.css.js';

export const wrap = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  minWidth: 0,
  maxWidth: '420px',
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

export const event = style({
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

export const eventTime = style({
  fontSize: '1rem',
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.fgMuted,
  flexShrink: 0,
});

export const eventTitle = style({
  fontSize: '1.1rem',
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});

export const more = style({
  fontSize: '0.9rem',
  color: vars.color.fgMuted,
});
