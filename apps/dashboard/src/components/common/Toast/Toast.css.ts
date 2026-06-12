import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateY(12px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const viewport = style({
  position: 'fixed',
  insetInlineEnd: vars.space.lg,
  insetBlockEnd: vars.space.lg,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  maxWidth: 'min(420px, calc(100vw - 2 * 20px))',
  pointerEvents: 'none',
});

const toastBase = style({
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.md,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderRadius: vars.radii.sm,
  background: vars.color.bgPanel,
  border: `1px solid ${vars.color.border}`,
  borderInlineStartWidth: '4px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
  fontSize: vars.font.sizeSm,
  color: vars.color.fg,
  animation: `${slideIn} 180ms ease-out`,
});

export const toast = styleVariants({
  success: [toastBase, { borderInlineStartColor: vars.color.success }],
  error: [toastBase, { borderInlineStartColor: vars.color.danger }],
});

export const message = style({
  flex: 1,
  margin: 0,
  wordBreak: 'break-word',
});

export const dismiss = style({
  flexShrink: 0,
  font: 'inherit',
  lineHeight: 1,
  color: vars.color.fgMuted,
  background: 'transparent',
  border: 'none',
  borderRadius: vars.radii.sm,
  minHeight: vars.size.touchMin,
  minWidth: vars.size.touchMin,
  cursor: 'pointer',
  selectors: {
    '&:active': {
      background: vars.color.bgPanelHover,
    },
  },
});
