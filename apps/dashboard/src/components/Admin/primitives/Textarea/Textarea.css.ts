import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';
import { inputBase } from '../inputBase.css.js';

export const root = style([
  inputBase,
  {
    fontFamily: vars.font.familyAlt,
    minHeight: '88px',
    resize: 'vertical',
  },
]);
