import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

const blink = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.2 },
});

const rowBase = {
  display: 'grid',
  gridTemplateColumns: '40px 72px 1fr auto',
  alignItems: 'center',
  gap: '14px',
  padding: '10px',
  borderRadius: vars.radii.sm,
  minHeight: '56px',
  fontSize: '1.15rem',
  '@media': {
    [mq.pi]: {
      gridTemplateColumns: '36px 68px 1fr auto',
      gap: vars.space.md,
      minHeight: '60px',
    },
  },
} as const;

export const row = styleVariants({
  default: rowBase,
  soon: {
    ...rowBase,
    background: `color-mix(in srgb, ${vars.color.accent} 15%, transparent)`,
  },
});

export const vehicle = style({
  fontSize: '1.4rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.fgMuted,
});

export const route = style({
  fontWeight: 500,
  fontSize: '1.5rem',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
});

export const headsign = style({
  color: vars.color.fgMuted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '1.1rem',
  '@media': {
    [mq.pi]: {
      fontSize: '1.15rem',
    },
  },
});

const timeBase = {
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 500,
  fontSize: '1.25rem',
  '@media': {
    [mq.pi]: {
      fontSize: '1.3rem',
    },
  },
} as const;

export const time = styleVariants({
  default: timeBase,
  soon: { ...timeBase, color: vars.color.accent },
});

export const liveDot = style({
  display: 'inline-block',
  width: '10px',
  height: '10px',
  borderRadius: vars.radii.pill,
  background: vars.color.danger,
  boxShadow: `0 0 3px ${vars.color.danger}`,
  animation: `${blink} 2s ease-in-out infinite`,
  flexShrink: 0,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});
