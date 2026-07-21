'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteState {
  isOpen: boolean;
  commands: Command[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  registerCommand: (command: Command) => void;
  unregisterCommand: (commandId: string) => void;
  executeCommand: (commandId: string) => void;
}

const CommandPaletteContext = createContext<CommandPaletteState | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const registerCommand = useCallback((command: Command) => {
    setCommands((prev) => {
      if (prev.some((c) => c.id === command.id)) return prev;
      return [...prev, command];
    });
  }, []);

  const unregisterCommand = useCallback((commandId: string) => {
    setCommands((prev) => prev.filter((c) => c.id !== commandId));
  }, []);

  const executeCommand = useCallback(
    (commandId: string) => {
      const cmd = commands.find((c) => c.id === commandId);
      if (cmd) {
        cmd.action();
        close();
      }
    },
    [commands, close],
  );

  const value = useMemo(
    () => ({
      isOpen,
      commands,
      open,
      close,
      toggle,
      registerCommand,
      unregisterCommand,
      executeCommand,
    }),
    [isOpen, commands, open, close, toggle, registerCommand, unregisterCommand, executeCommand],
  );

  return (
    <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>
  );
}
