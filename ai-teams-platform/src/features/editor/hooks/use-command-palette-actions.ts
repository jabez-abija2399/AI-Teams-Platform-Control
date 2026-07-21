'use client';

import { useEffect, useMemo } from 'react';
import { useCommandPalette } from '../components/providers/command-palette-provider';
import type { EditorPreferences } from '../types';

interface UseCommandPaletteActionsProps {
  onSave: () => void;
  preferences: EditorPreferences;
  onUpdatePreferences: (updates: Partial<EditorPreferences>) => void;
}

export function useCommandPaletteActions({
  onSave,
  preferences,
  onUpdatePreferences,
}: UseCommandPaletteActionsProps) {
  const { registerCommand, unregisterCommand, toggle } = useCommandPalette();

  const commands = useMemo(
    () => [
      {
        id: 'editor.save',
        label: 'Save',
        category: 'Editor',
        shortcut: 'Ctrl+S',
        action: onSave,
      },
      {
        id: 'editor.toggle-minimap',
        label: `Toggle Minimap (${preferences.minimap ? 'On' : 'Off'})`,
        category: 'View',
        action: () => onUpdatePreferences({ minimap: !preferences.minimap }),
      },
      {
        id: 'editor.toggle-wordwrap',
        label: `Toggle Word Wrap (${preferences.wordWrap === 'on' ? 'On' : 'Off'})`,
        category: 'View',
        shortcut: 'Alt+Z',
        action: () =>
          onUpdatePreferences({
            wordWrap: preferences.wordWrap === 'on' ? 'off' : 'on',
          }),
      },
      {
        id: 'editor.toggle-linenumbers',
        label: `Toggle Line Numbers (${preferences.lineNumbers ? 'On' : 'Off'})`,
        category: 'View',
        action: () => onUpdatePreferences({ lineNumbers: !preferences.lineNumbers }),
      },
      {
        id: 'editor.font-size-increase',
        label: 'Increase Font Size',
        category: 'Editor',
        shortcut: 'Ctrl++',
        action: () => onUpdatePreferences({ fontSize: Math.min(preferences.fontSize + 1, 72) }),
      },
      {
        id: 'editor.font-size-decrease',
        label: 'Decrease Font Size',
        category: 'Editor',
        shortcut: 'Ctrl+-',
        action: () => onUpdatePreferences({ fontSize: Math.max(preferences.fontSize - 1, 8) }),
      },
      {
        id: 'editor.theme-dark',
        label: 'Theme: Dark',
        category: 'Preferences',
        action: () => onUpdatePreferences({ theme: 'vs-dark' }),
      },
      {
        id: 'editor.theme-light',
        label: 'Theme: Light',
        category: 'Preferences',
        action: () => onUpdatePreferences({ theme: 'vs-light' }),
      },
      {
        id: 'editor.theme-hc',
        label: 'Theme: High Contrast',
        category: 'Preferences',
        action: () => onUpdatePreferences({ theme: 'hc-black' }),
      },
    ],
    [onSave, preferences, onUpdatePreferences],
  );

  useEffect(() => {
    commands.forEach((cmd) => registerCommand(cmd));
    return () => {
      commands.forEach((cmd) => unregisterCommand(cmd.id));
    };
  }, [commands, registerCommand, unregisterCommand]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);
}
