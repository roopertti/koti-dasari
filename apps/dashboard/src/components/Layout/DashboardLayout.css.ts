import { globalStyle, style } from '@vanilla-extract/css';
import { mq, vars } from '../../styles/theme.css.js';

export const dashboard = style({
  position: 'relative',
  zIndex: 1,
  height: '100dvh',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr) auto',
  gap: vars.space.md,
  paddingTop: vars.space.lg,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.lg,
  paddingRight: vars.space.lg,
  WebkitTapHighlightColor: 'transparent',
  WebkitUserSelect: 'none',
  userSelect: 'none',
  overscrollBehavior: 'none',
  touchAction: 'manipulation',
  '@media': {
    [mq.pi]: {
      paddingTop: vars.space.md,
      paddingBottom: vars.space.xs,
      paddingLeft: vars.space.md,
      paddingRight: vars.space.md,
      gap: vars.space.sm,
    },
  },
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.lg,
  flexWrap: 'wrap',
});

export const pages = style({
  display: 'flex',
  flexDirection: 'row',
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollSnapType: 'x mandatory',
  scrollbarWidth: 'none',
  minHeight: 0,
  overscrollBehaviorX: 'contain',
  // Leave horizontal gestures to usePointerSwipe; let vertical panning fall
  // through to the panel bodies that scroll natively.
  touchAction: 'pan-y',
});

globalStyle(`${pages}::-webkit-scrollbar`, {
  display: 'none',
});

export const page = style({
  flex: '0 0 100%',
  minWidth: 0,
  height: '100%',
  overflowY: 'auto',
  scrollSnapAlign: 'start',
  scrollSnapStop: 'always',
  scrollbarWidth: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  '@media': {
    [mq.pi]: {
      gap: vars.space.sm,
    },
  },
});

globalStyle(`${page}::-webkit-scrollbar`, {
  display: 'none',
});
