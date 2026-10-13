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

  /**
   * hold > 0: con el dedo hay que mantener apretado ese tiempo antes de arrastrar, así un deslizamiento
   * normal sigue scrolleando la página. Con mouse el arrastre empieza al mover.
   */
  const start = useCallback((payload: Payload, e: React.PointerEvent, hold = 0) => {
    if (e.button !== undefined && e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY;
    const needsHold = hold > 0 && e.pointerType === "touch";
    let armed = !needsHold;
    let dragging = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (needsHold) timer = setTimeout(() => { armed = true; navigator.vibrate?.(15); }, hold);
    // Solo se frena el scroll del navegador en el "mantener apretado" de las viñetas. En las fichas de la bandeja
    // (touch-action: pan-x) el deslizamiento horizontal tiene que seguir siendo del navegador.
    const lock = (ev: TouchEvent) => { if (needsHold && armed && ev.cancelable) ev.preventDefault(); };
    window.addEventListener("touchmove", lock, { passive: false });
    const move = (ev: PointerEvent) => {
      const far = Math.hypot(ev.clientX - sx, ev.clientY - sy) >= THRESHOLD;
      if (!armed) { if (far) end(); return; }
      if (!dragging && !far) return;
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
      clearTimeout(timer);
      window.removeEventListener("touchmove", lock);
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
  const bind = (payload: Payload, touchAction: "none" | "pan-x" | "auto" = "none", hold = 0) => ({
    onPointerDown: (e: React.PointerEvent) => start(payload, e, hold),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); optsRef.current.onTap(payload); } },
    style: { touchAction, cursor: "grab", WebkitTouchCallout: "none" as const, userSelect: "none" as const },
  });

  return { ghost, over, bind };
}
