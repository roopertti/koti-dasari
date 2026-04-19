import { style } from '@vanilla-extract/css';
import { mq, vars } from '../../styles/theme.css.js';

export const clock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  lineHeight: 1,
  '@media': {
    [mq.tablet]: {
      alignItems: 'center',
      textAlign: 'center',
    },
  },
});

export const time = style({
  fontSize: 'clamp(4rem, 10vw, 7rem)',
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.03em',
  lineHeight: 1,
  '@media': {
    [mq.pi]: {
      fontSize: '4.5rem',
    },
  },
});

export const date = style({
  fontSize: 'clamp(1rem, 1.5vw, 1.3rem)',
  color: vars.color.fgMuted,
  textTransform: 'capitalize',
  '@media': {
    [mq.pi]: {
      fontSize: '1.1rem',
    },
  },
});
