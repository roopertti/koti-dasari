import { styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

const base = {
  fontSize: vars.font.sizeSm,
  padding: '8px 0',
} as const;

export const message = styleVariants({
  empty: { ...base, color: vars.color.fgDim },
  loading: { ...base, color: vars.color.fgDim },
  error: { ...base, color: vars.color.danger },
});
