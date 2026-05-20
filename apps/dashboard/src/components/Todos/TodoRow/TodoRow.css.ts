import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

const rowBase = {
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: '10px 12px',
  borderRadius: vars.radii.sm,
  background: vars.color.bgPanelHover,
  minHeight: vars.size.touchMin,
} as const;

export const row = styleVariants({
  active: rowBase,
  done: { ...rowBase, opacity: 0.6 },
});

const titleBase = {
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

export const body = style({
  flex: 1,
  minWidth: 0,
});

export const meta = style({
  display: 'flex',
  gap: vars.space.sm,
  fontSize: '0.8rem',
  color: vars.color.fgMuted,
  marginTop: vars.space.xs,
});
