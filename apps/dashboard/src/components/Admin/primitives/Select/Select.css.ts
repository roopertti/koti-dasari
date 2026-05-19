import { style } from '@vanilla-extract/css';
import { inputBase } from '../inputBase.css.js';

export const root = style([
  inputBase,
  {
    appearance: 'none',
  },
]);
