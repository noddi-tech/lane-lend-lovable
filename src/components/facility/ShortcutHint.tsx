import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface ShortcutHintProps {
  show: boolean;
  hint: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  duration?: number;
}

/**
 * Floating hint that shows available keyboard shortcuts
 * Appears temporarily to guide users
 */
export function ShortcutHint({ 
  show, 
  hint, 
  position = 'bottom',
  duration = 3000 
}: ShortcutHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!visible) return null;

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2 z-50 animate-fade-in`}
    >
      <Badge
        variant="secondary"
        className="text-xs shadow-lg border border-border bg-background/95 backdrop-blur-sm"
      >
        {hint}
      </Badge>
    </div>
  );
}
