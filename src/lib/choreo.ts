import { GOAL_PIECE, type Side, type Variant, type Zone } from "./schema";

export type Pose = "none" | "kick" | "header" | "dribble" | "backheel" | "wall";
export type FigMove = { pose: Pose; x?: number[]; y?: number[]; rotate?: number[] };

/** x: % del ancho (el arco está a la derecha). lane: profundidad (near = banda derecha del atacante). */
export type Spot = { x: number; lane: "near" | "mid" | "far" };
export const LANE_BOTTOM = { near: 3, mid: 14, far: 26 } as const;
export const LANE_SCALE = { near: 1.12, mid: 1, far: 0.88 } as const;
export type Spatial = { side?: Side; zone?: Zone };

export type Choreo = {
  figs: FigMove[];
  keeper?: "dive" | "beaten";
  /** Pelota: posiciones en % del ancho (left) y de la altura desde el piso (bottom). */
  ball?: { left: number[]; bottom: number[] };
  /** Barrera de defensores (tiro libre). */
  wall: boolean;
  /** Banderín del córner. */
  flag: boolean;
  /** Ubicación de cada jugador en la cancha; solo si hay banda o distancia documentadas. */
  layout?: Spot[];
};

const GOAL_X = 80;
const ZONE_X: Record<Zone, number> = { medio: 14, lejos: 28, borde: 40, area: 56, "area-chica": 66 };
const LANE_OF: Record<Side, Spot["lane"]> = { derecha: "near", izquierda: "far" };
const pos = (i: number, n: number) => ((i + 0.5) / Math.max(n, 1)) * 100;

/**
 * Ubicación de cada jugador cuando las fuentes documentan la banda o la distancia:
 * - Pase/Centro: quien da arranca en su banda; quien recibe espera en el área.
 * - Tiro/Cabezazo/Penal/Gol/Gambeta: quien define se ubica a la distancia documentada.
 * El arco siempre queda a la derecha.
 */
function layoutFor(action: string, cast: string[], goal: number, sp: Spatial): Spot[] | undefined {
  if (!sp.side && !sp.zone) return undefined;
  const lane = sp.side ? LANE_OF[sp.side] : "mid";
  const out: Spot[] = cast.map((_, i) => ({ x: pos(i, cast.length), lane: "mid" as const }));
  if (goal >= 0) out[goal] = { x: GOAL_X, lane: "mid" };
  const passing = action === "Pase" || action === "Centro";
  if (passing) {
    out[0] = { x: sp.zone ? ZONE_X[sp.zone] : 22, lane };
    if (cast.length > 1 && goal !== 1) out[1] = { x: action === "Centro" ? 56 : 46, lane: "mid" };
  } else {
    out[0] = { x: sp.zone ? ZONE_X[sp.zone] : goal >= 0 ? 52 : 40, lane };
  }
  return out;
}

/**
 * Coreografía de una acción según lo documentado (variante, banda, distancia): quién patea, salta o
 * cabecea, hacia dónde va la pelota, si hay barrera o córner. Es pura para poder testearla.
 */
export function choreo(action: string | null, variant: Variant | undefined, cast: string[], spatial: Spatial = {}): Choreo {
  const n = cast.length;
  const goal = cast.indexOf(GOAL_PIECE);
  const idle: FigMove[] = cast.map(() => ({ pose: "none" }));
  const base: Choreo = { figs: idle, wall: false, flag: false };
  if (!action || n === 0) return base;

  const spots = layoutFor(action, cast, goal, spatial);
  const xs = spots ? spots.map((s) => s.x) : cast.map((_, i) => pos(i, n));
  const gx = goal >= 0 ? xs[goal] : (xs[n - 1] ?? 50);
  const x0 = xs[0];
  const x1 = xs[1] ?? x0;
  // La pelota arranca a la altura del piso de la banda del primer jugador.
  const lift = spots ? LANE_BOTTOM[spots[0].lane] : 0;
  const f = (i: number, m: FigMove) => idle.map((x, k) => (k === i ? m : x));
  const out = (c: Choreo): Choreo => (spots ? { ...c, layout: spots } : c);

  switch (action) {
    case "Pase":
      return out({ ...base, figs: f(0, { pose: "kick", x: [0, 8, 0] }), ball: { left: [x0, x1], bottom: [14 + lift, 14] } });
    case "Centro": {
      if (variant === "corner")
        return out({ ...base, flag: true, figs: f(0, { pose: "kick" }), ball: { left: [Math.min(x0, 6), x1], bottom: [8 + lift, 74, 42] } });
      const figs = f(0, { pose: "kick" });
      if (n > 1) figs[1] = { pose: "none", y: [0, -14, 0] };
      return out({ ...base, figs, ball: { left: [x0, x1], bottom: [18 + lift, 72, 46] } });
    }
    case "Cabezazo": {
      const dive = variant === "palomita";
      return out({
        ...base,
        keeper: "dive",
        figs: f(0, dive ? { pose: "header", x: [0, 14, 0], y: [0, -10, 0], rotate: [0, -78, 0] } : { pose: "header", y: [0, -34, 0], rotate: [0, -8, 0] }),
        ball: { left: [Math.max(x0 - 22, 2), x0, gx], bottom: [64 + lift, 58 + lift, 40] },
      });
    }
    case "Tiro al arco": {
      const move: FigMove =
        variant === "taco" ? { pose: "backheel" }
        : variant === "volea" ? { pose: "kick", y: [0, -14, 0] }
        : variant === "chilena" ? { pose: "kick", y: [0, -28, 0], rotate: [0, -165, 0] }
        : variant === "media-vuelta" ? { pose: "kick", rotate: [0, 360, 360] }
        : { pose: "kick", x: [0, 8, 0] };
      const ball =
        variant === "tiro-libre" ? { left: [x0, gx], bottom: [14 + lift, 76, 46] }
        : variant === "rebote" ? { left: [x0, gx, gx - 18, gx], bottom: [14 + lift, 40, 30, 40] }
        : variant === "chilena" ? { left: [x0, gx], bottom: [50 + lift, 40] }
        : { left: [x0, gx], bottom: [14 + lift, 40] };
      return out({ ...base, keeper: "dive", wall: variant === "tiro-libre", figs: f(0, move), ball });
    }
    case "Penal":
      return out({ ...base, keeper: "dive", figs: f(0, { pose: "kick", x: [0, 10, 0] }), ball: { left: [Math.min(x0 + 14, gx - 8), gx], bottom: [12 + lift, 38] } });
    case "Gol":
      return out({ ...base, keeper: "beaten", figs: f(0, { pose: "none", y: [0, -16, 0] }), ball: { left: [gx, gx], bottom: [38, 34] } });
    case "Gambeta":
      return out({ ...base, figs: f(0, { pose: "dribble", x: [0, -10, 10, -10, 10, 0] }), ball: { left: [x0 + 9, x0 - 1, x0 + 9, x0 - 1, x0 + 7, x0 + 7], bottom: Array(6).fill(10 + lift) } });
    default:
      return base;
  }
}
