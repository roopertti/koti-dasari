import { styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

const base = {
  display: 'flex',
  flexDirection: 'column',
} as const;

export const stack = styleVariants({
  tight: { ...base, gap: '6px' },
  sm: { ...base, gap: vars.space.sm },
  loose: { ...base, gap: '18px' },
});
