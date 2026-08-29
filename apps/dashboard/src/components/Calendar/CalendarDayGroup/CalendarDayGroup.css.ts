import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';
import { rowButtonBase } from '../../common/rowButtonBase.css.js';

export const dayLabel = style({
  fontSize: '0.85rem',
  color: vars.color.fgMuted,
  textTransform: 'uppercase',
  letterSpacing: vars.font.letterSpacingWide,
  marginBottom: '6px',
  '@media': {
    [mq.pi]: {
      marginBottom: '2px',
    },
  },
});

export const dayEvents = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const event = style([
  rowButtonBase,
  {
    display: 'flex',
    gap: vars.space.md,
    padding: '10px 12px',
    borderRadius: vars.radii.sm,
    background: vars.color.bgPanelHover,
    minHeight: vars.size.touchMin,
    '@media': {
      [mq.pi]: {
        padding: '6px 10px',
      },
    },
    selectors: {
      '&:active': {
        background: vars.color.border,
      },
    },
  },
]);

export const eventBar = style({
  width: '4px',
  borderRadius: '2px',
  flexShrink: 0,
  background: `var(--event-color, ${vars.color.accent})`,
});

export const eventText = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

export const eventTitle = style({
  fontWeight: 500,
});

export const sourceFlag = style({
  marginRight: vars.space.xs,
  fontSize: '0.95em',
});

export const eventWhen = style({
  fontSize: '0.85rem',
  color: vars.color.fgMuted,
  marginTop: vars.space.xs,
  fontVariantNumeric: 'tabular-nums',
});

export const eventDescription = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
  marginTop: vars.space.sm,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});
