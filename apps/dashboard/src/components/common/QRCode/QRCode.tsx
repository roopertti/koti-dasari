import { useQuery } from '@tanstack/react-query';
import QRCodeLib from 'qrcode';
import * as styles from './QRCode.css.js';

type Size = keyof typeof styles.size;

interface QRCodeProps {
  value: string;
  alt: string;
  size?: Size;
  testId?: string;
}

// Encoded at a fixed module resolution and scaled down by CSS, so the same
// bitmap stays crisp whether it renders large (one code) or small (a row of them).
const ENCODE_WIDTH = 320;

/**
 * Renders a URL as a scannable QR code. Encoding happens locally via `qrcode`
 * — no network call — and is cached forever per value, since a given URL always
 * produces the same bitmap.
 */
export function QRCode({ value, alt, size = 'md', testId }: QRCodeProps) {
  const qr = useQuery({
    queryKey: ['qr', value],
    queryFn: () => QRCodeLib.toDataURL(value, { margin: 1, width: ENCODE_WIDTH }),
    staleTime: Infinity,
  });

  if (!qr.data) {
    return null;
  }

  return (
    <img
      className={`${styles.image} ${styles.size[size]}`}
      src={qr.data}
      alt={alt}
      data-testid={testId}
    />
  );
}
