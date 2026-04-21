import type { SVGProps } from 'react';

interface MetroMarkProps extends SVGProps<SVGSVGElement> {
  size?: string | number;
}

export function MetroMark({ size = 24, ...props }: MetroMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M7 16 V8 L12 14 L17 8 V16" />
    </svg>
  );
}
