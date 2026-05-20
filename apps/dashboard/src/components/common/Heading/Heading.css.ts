import { styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

const base = {
  margin: 0,
  fontWeight: vars.font.weightSemibold,
  letterSpacing: vars.font.letterSpacingTight,
} as const;

export const level = styleVariants({
  page: { ...base, fontSize: '1.05rem' },
  section: { ...base, fontSize: '1rem' },
  panel: {
    ...base,
    fontSize: vars.font.sizeMd,
    fontWeight: vars.font.weightMedium,
    letterSpacing: vars.font.letterSpacingWide,
    textTransform: 'uppercase',
    color: vars.color.fgMuted,
  },
});
