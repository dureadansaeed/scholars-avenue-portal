"use client";

import { useCallback, useRef, useState } from "react";
import type { PointerEvent } from "react";

const SLOP = 10;

/**
 * Press feedback lands on pointerdown; the commit happens on pointerup. Dragging
 * further than SLOP from the origin cancels, dragging back re-arms. Keep onClick
 * only for keyboard activation (event.detail === 0) so a pointer interaction
 * never fires twice.
 */
export function usePress(onPress?: () => void, disabled = false) {
  const [pressed, setPressed] = useState(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const armed = useRef(false);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (disabled || e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      origin.current = { x: e.clientX, y: e.clientY };
      armed.current = true;
      setPressed(true);
    },
    [disabled],
  );

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    if (!origin.current) return;
    const far = Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > SLOP;
    armed.current = !far;
    setPressed(!far);
  }, []);

  const end = useCallback(
    (commit: boolean) => {
      const fire = commit && armed.current;
      origin.current = null;
      armed.current = false;
      setPressed(false);
      if (fire) onPress?.();
    },
    [onPress],
  );

  return {
    pressed,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: () => end(true),
      onPointerCancel: () => end(false),
    },
  };
}
