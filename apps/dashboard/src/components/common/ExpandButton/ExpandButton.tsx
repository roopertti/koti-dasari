import { Maximize2 } from 'lucide-react';
import { Button } from '../Button/Button.js';

interface ExpandButtonProps {
  onClick: () => void;
  label: string;
  testId?: string;
}

/** Opens a panel's full-screen view. Icon-only to keep the panel header compact. */
export function ExpandButton({ onClick, label, testId }: ExpandButtonProps) {
  return (
    <Button variant="subtle" onClick={onClick} aria-label={label} data-testid={testId}>
      <Maximize2 size="1.1em" aria-hidden="true" />
    </Button>
  );
}
