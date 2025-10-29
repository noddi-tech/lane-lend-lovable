import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
  allowInInput?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Custom hook for managing keyboard shortcuts
 * Handles key combinations and prevents conflicts with input fields
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      for (const shortcut of shortcuts) {
        // Skip if in input field and shortcut doesn't allow it
        if (isInputField && !shortcut.allowInInput) {
          continue;
        }

        // Check if key matches
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        
        // Check modifier keys
        const ctrlMatches = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatches = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        const altMatches = shortcut.altKey ? e.altKey : !e.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          e.preventDefault();
          shortcut.handler(e);
          break; // Only execute first matching shortcut
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Helper to create shortcut objects with proper typing
 */
export function createShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  description: string,
  options?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    allowInInput?: boolean;
  }
): KeyboardShortcut {
  return {
    key,
    handler,
    description,
    ctrlKey: options?.ctrl,
    metaKey: options?.meta,
    shiftKey: options?.shift,
    altKey: options?.alt,
    allowInInput: options?.allowInInput,
  };
}
