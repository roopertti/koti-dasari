import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { mq, vars } from '../../../styles/theme.css.js';

const OPEN_MS = 180;

const dialogIn = keyframes({
  from: { opacity: 0, transform: 'translateY(10px) scale(0.97)' },
  to: { opacity: 1, transform: 'none' },
});

const backdropIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const dialogBase = style({
  border: 'none',
  // No padding: a click whose target is the <dialog> itself can then only be a
  // backdrop tap, which is how Modal detects tap-to-dismiss.
  padding: 0,
  borderRadius: vars.radii.md,
  background: vars.color.bgPanel,
  color: vars.color.fg,
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
  '::backdrop': {
    background: 'rgba(0, 0, 0, 0.6)',
    animation: `${backdropIn} ${OPEN_MS}ms ease-out`,
  },
  selectors: {
    // Runs when showModal() sets [open]; closing stays instant so the kiosk
    // still feels snappy under a finger.
    '&[open]': {
      animation: `${dialogIn} ${OPEN_MS}ms ease-out`,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      '::backdrop': {
        animation: 'none',
      },
      selectors: {
        '&[open]': {
          animation: 'none',
        },
      },
    },
  },
});

export const dialog = styleVariants({
  auto: [dialogBase, { maxWidth: '90vw', maxHeight: '90vh' }],
  full: [
    dialogBase,
    {
      width: '92vw',
      height: '88vh',
      maxWidth: '92vw',
      maxHeight: '88vh',
      '@media': {
        [mq.pi]: {
          width: '96vw',
          height: '92vh',
          maxWidth: '96vw',
          maxHeight: '92vh',
        },
      },
    },
  ],
});

export const surface = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  padding: vars.space.xl,
  height: '100%',
  minHeight: 0,
  '@media': {
    [mq.pi]: {
      padding: vars.space.lg,
      gap: vars.space.md,
    },
  },
});

export const head = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.lg,
  minWidth: 0,
});

export const body = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
});
