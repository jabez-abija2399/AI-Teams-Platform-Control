'use client';

import { useCallback, useRef } from 'react';

interface UseResizablePanelOptions {
  direction: 'horizontal' | 'vertical';
  onResize: (size: number) => void;
  min: number;
  max: number;
  invert?: boolean;
}

export function useResizablePanel({
  direction,
  onResize,
  min,
  max,
  invert,
}: UseResizablePanelOptions) {
  const startPos = useRef(0);
  const startSize = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent, currentSize: number) => {
      e.preventDefault();
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
      startSize.current = currentSize;

      function onMouseMove(moveEvent: MouseEvent) {
        const pos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
        const delta = invert ? startPos.current - pos : pos - startPos.current;
        const next = Math.min(max, Math.max(min, startSize.current + delta));
        onResize(next);
      }
      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [direction, onResize, min, max, invert],
  );

  return { onMouseDown };
}
