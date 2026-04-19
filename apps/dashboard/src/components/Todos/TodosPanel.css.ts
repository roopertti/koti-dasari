import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/theme.css.js';

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const todo = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: '6px 0',
  minHeight: vars.size.touchMin,
});

export const toggle = style({
  width: vars.size.touchMin,
  height: vars.size.touchMin,
  borderRadius: '50%',
  border: `2px solid ${vars.color.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.2rem',
  flexShrink: 0,
  padding: 0,
  color: 'transparent',
  transition: 'background-color 120ms ease, border-color 120ms ease',
  selectors: {
    '&:disabled': {
      opacity: 0.5,
    },
  },
});

export const toggleDone = style({
  background: vars.color.success,
  borderColor: vars.color.success,
  color: 'white',
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

export const due = style({});
