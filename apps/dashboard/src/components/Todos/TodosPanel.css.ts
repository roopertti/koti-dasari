import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/theme.css.js';

export const todo = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: '10px 12px',
  borderRadius: vars.radii.sm,
  background: vars.color.bgPanelHover,
  minHeight: vars.size.touchMin,
});

export const todoDone = style({
  opacity: 0.6,
});

export const body = style({
  flex: 1,
  minWidth: 0,
});

export const titleBase = style({
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const titleDone = style({
  color: vars.color.fgDim,
  textDecoration: 'line-through',
});

export const meta = style({
  display: 'flex',
  gap: vars.space.sm,
  fontSize: '0.8rem',
  color: vars.color.fgMuted,
  marginTop: vars.space.xs,
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

export const toggle = style({
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

export const toggleUndo = style({
  background: 'transparent',
  borderColor: vars.color.border,
  color: vars.color.fgMuted,
});
