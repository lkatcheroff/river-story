import { GOAL_PIECE, type Variant } from "./schema";

export type Pose = "none" | "kick" | "header" | "dribble" | "backheel" | "wall";
export type FigMove = { pose: Pose; x?: number[]; y?: number[]; rotate?: number[] };
export type Choreo = {
  figs: FigMove[];
  keeper?: "dive" | "beaten";
  /** Pelota: posiciones en % del ancho (left) y de la altura desde el piso (bottom). */
  ball?: { left: number[]; bottom: number[] };
  /** Barrera de defensores (tiro libre). */
  wall: boolean;
  /** Banderín del córner. */
  flag: boolean;
};

const pos = (i: number, n: number) => ((i + 0.5) / Math.max(n, 1)) * 100;

/**
 * Coreografía de una acción según lo documentado (variante): quién patea, salta o cabecea, hacia
 * dónde va la pelota, si hay barrera o córner. Es pura para poder testearla.
 */
export function choreo(action: string | null, variant: Variant | undefined, cast: string[]): Choreo {
  const n = cast.length;
  const goal = cast.indexOf(GOAL_PIECE);
  const xs = cast.map((_, i) => pos(i, n));
  const gx = goal >= 0 ? xs[goal] : (xs[n - 1] ?? 50);
  const idle: FigMove[] = cast.map(() => ({ pose: "none" }));
  const base: Choreo = { figs: idle, wall: false, flag: false };
  if (!action || n === 0) return base;

  const f = (i: number, m: FigMove) => idle.map((x, k) => (k === i ? m : x));
  const x0 = xs[0];
  const x1 = xs[1] ?? x0;

  switch (action) {
    case "Pase":
      return { ...base, figs: f(0, { pose: "kick", x: [0, 8, 0] }), ball: { left: [x0, x1], bottom: [14, 14] } };
    case "Centro": {
      if (variant === "corner") return { ...base, flag: true, figs: f(0, { pose: "kick" }), ball: { left: [4, x1], bottom: [8, 74, 42] } };
      const figs = f(0, { pose: "kick" });
      if (n > 1) figs[1] = { pose: "none", y: [0, -14, 0] };
      return { ...base, figs, ball: { left: [x0, x1], bottom: [18, 72, 46] } };
    }
    case "Cabezazo": {
      const dive = variant === "palomita";
      return {
        ...base,
        keeper: "dive",
        figs: f(0, dive ? { pose: "header", x: [0, 14, 0], y: [0, -10, 0], rotate: [0, -78, 0] } : { pose: "header", y: [0, -34, 0], rotate: [0, -8, 0] }),
        ball: { left: [Math.max(x0 - 22, 2), x0, gx], bottom: [64, 58, 40] },
      };
    }
    case "Tiro al arco": {
      const move: FigMove =
        variant === "taco" ? { pose: "backheel" }
        : variant === "volea" ? { pose: "kick", y: [0, -14, 0] }
        : variant === "chilena" ? { pose: "kick", y: [0, -28, 0], rotate: [0, -165, 0] }
        : variant === "media-vuelta" ? { pose: "kick", rotate: [0, 360, 360] }
        : { pose: "kick", x: [0, 8, 0] };
      const ball =
        variant === "tiro-libre" ? { left: [x0, gx], bottom: [14, 76, 46] }
        : variant === "rebote" ? { left: [x0, gx, gx - 18, gx], bottom: [14, 40, 30, 40] }
        : variant === "chilena" ? { left: [x0, gx], bottom: [50, 40] }
        : { left: [x0, gx], bottom: [14, 40] };
      return { ...base, keeper: "dive", wall: variant === "tiro-libre", figs: f(0, move), ball };
    }
    case "Penal":
      return { ...base, keeper: "dive", figs: f(0, { pose: "kick", x: [0, 10, 0] }), ball: { left: [Math.min(x0 + 14, gx - 8), gx], bottom: [12, 38] } };
    case "Gol":
      return { ...base, keeper: "beaten", figs: f(0, { pose: "none", y: [0, -16, 0] }), ball: { left: [gx, gx], bottom: [38, 34] } };
    case "Gambeta":
      return { ...base, figs: f(0, { pose: "dribble", x: [0, -10, 10, -10, 10, 0] }), ball: { left: [x0 + 9, x0 - 1, x0 + 9, x0 - 1, x0 + 7, x0 + 7], bottom: [10, 10, 10, 10, 10, 10] } };
    default:
      return base;
  }
}
