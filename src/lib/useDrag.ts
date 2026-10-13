import { useCallback, useEffect, useRef, useState } from "react";

export type Payload =
  | { kind: "setting"; value: string }
  | { kind: "cast"; value: string; from?: number }
  | { kind: "panel"; value: number };

type Ghost = { payload: Payload; x: number; y: number };
const THRESHOLD = 6;

/**
 * Arrastrar con puntero (mouse y táctil) y soltar sobre elementos con [data-drop="<índice>"].
 * Un toque sin movimiento llama a onTap; un arrastre llama a onDrop (target null = soltó afuera).
 */
export function useDrag(opts: {
  onTap: (p: Payload) => void;
  onDrop: (p: Payload, target: number | null) => void;
}) {
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);

  const targetAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest("[data-drop]");
    return el ? Number(el.getAttribute("data-drop")) : null;
  };

  const start = useCallback((payload: Payload, e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY;
    let dragging = false;
    const move = (ev: PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) < THRESHOLD) return;
      dragging = true;
      ev.preventDefault();
      setGhost({ payload, x: ev.clientX, y: ev.clientY });
      setOver(targetAt(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      end();
      if (dragging) optsRef.current.onDrop(payload, targetAt(ev.clientX, ev.clientY));
      else optsRef.current.onTap(payload);
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", end);
      cleanup.current = null;
      setGhost(null);
      setOver(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", end);
    cleanup.current = end;
  }, []);

  /** Props para un elemento arrastrable/tocable (también con teclado). */
  const bind = (payload: Payload, touchAction: "none" | "pan-x" = "none") => ({
    onPointerDown: (e: React.PointerEvent) => start(payload, e),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); optsRef.current.onTap(payload); } },
    style: { touchAction, cursor: "grab" },
  });

  return { ghost, over, bind };
}
