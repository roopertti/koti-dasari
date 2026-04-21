import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/theme.css.js';

export const pagination = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.sm} 0`,
});

const dotBase = {
  display: 'block',
  width: '8px',
  height: '8px',
  borderRadius: vars.radii.pill,
  transition: 'background-color 200ms ease, width 200ms ease',
} as const;

export const dot = style({
  ...dotBase,
  background: vars.color.border,
});

export const dotActive = style({
  ...dotBase,
  background: vars.color.fg,
  width: '24px',
});
