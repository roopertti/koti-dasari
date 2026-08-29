import { style, styleVariants } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';
import { rowButtonBase } from '../../common/rowButtonBase.css.js';

const rowBase = {
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: '10px 12px',
  borderRadius: vars.radii.sm,
  background: vars.color.bgPanelHover,
  minHeight: vars.size.touchMin,
  '@media': {
    [mq.pi]: {
      padding: '4px 10px',
    },
  },
} as const;

export const row = styleVariants({
  active: rowBase,
  done: { ...rowBase, opacity: 0.6 },
});

const titleBase = {
  display: 'block',
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const title = styleVariants({
  active: titleBase,
  done: {
    ...titleBase,
    color: vars.color.fgDim,
    textDecoration: 'line-through',
  },
});

const priorityBase = {
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 600,
} as const;

export const priority = styleVariants({
  high: { ...priorityBase, color: vars.color.danger },
  medium: priorityBase,
  low: { ...priorityBase, color: vars.color.fgDim },
});

export const body = style([
  rowButtonBase,
  {
    flex: 1,
    minWidth: 0,
    padding: 0,
    // Stretch to the row's full height so the whole row area opens the detail
    // dialog. Without this the button is only as tall as its text, leaving dead
    // zones above and below it inside the row.
    alignSelf: 'stretch',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
]);

export const meta = style({
  display: 'flex',
  gap: vars.space.sm,
  fontSize: '0.8rem',
  color: vars.color.fgMuted,
  marginTop: vars.space.xs,
});

export const description = style({
  display: 'block',
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
  marginTop: vars.space.sm,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});
