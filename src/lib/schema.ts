import { z } from "zod";

export const ChallengeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("quiz"),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    answerIndex: z.number().int().min(0),
    explanation: z.string().min(1),
  }),
  z.object({
    type: z.literal("guess-year"),
    question: z.string().min(1),
    correctYear: z.number().int(),
    tolerance: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("who-scored"),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    answerIndex: z.number().int().min(0),
  }),
]);

/**
 * Acciones de las escenas de "jugada" (setting.kind = "jugada", label = acción).
 * En Pase y Centro el orden de `figures` importa: [quien da, quien recibe].
 * En Tiro al arco, Cabezazo, Penal y Gol, `figures` = [quien define, "Arco"] ("Arco" es el arco con su arquero).
 */
export const ACTIONS = ["Pase", "Centro", "Gambeta", "Tiro al arco", "Cabezazo", "Penal", "Gol"] as const;
export const ORDERED_ACTIONS: readonly string[] = ["Pase", "Centro"];
export const GOAL_PIECE = "Arco";

/**
 * Cómo se hizo la acción, solo si las fuentes lo documentan (define cómo se anima la jugada):
 * tiro-libre (aparece la barrera), corner (bandera y centro desde la esquina), taco, media-vuelta,
 * palomita (cabezazo en el aire), volea, chilena, rebote (la pelota vuelve y se define de nuevo).
 */
export const VARIANTS = ["tiro-libre", "corner", "taco", "media-vuelta", "palomita", "volea", "chilena", "rebote"] as const;
export type Variant = (typeof VARIANTS)[number];

/**
 * Dónde ocurre la acción, solo si las fuentes lo documentan.
 * side: banda desde la que actúa quien protagoniza la viñeta (desde su punto de vista de ataque).
 * zone: qué tan lejos del arco está (medio = mitad de cancha, lejos = unos 25 m, borde = borde del área,
 * area = dentro del área, area-chica = pegado al arco).
 */
export const SIDES = ["derecha", "izquierda"] as const;
export const ZONES = ["medio", "lejos", "borde", "area", "area-chica"] as const;
export type Side = (typeof SIDES)[number];
export type Zone = (typeof ZONES)[number];

export const PanelSchema = z.object({
  /** Viñeta: 1–2 oraciones que reformulan SOLO hechos ya presentes en la escena verificada. */
  caption: z.string().min(1).max(160),
  /** Escenario donde ocurre la viñeta. kind define el fondo dibujado. */
  setting: z.object({
    label: z.string().min(1).max(40),
    kind: z.enum(["cancha", "tribuna", "sede", "ciudad", "jugada"]),
  }),
  /** Personajes que actúan en la viñeta (1–3): protagonistas/rival de la escena, o "River", "Hinchas", "Árbitro" si el texto los menciona. */
  figures: z.array(z.string()).min(1).max(3),
  tone: z.enum(["calma", "tension", "drama", "gloria"]),
  /** Variante documentada de la acción (opcional). */
  variant: z.enum(VARIANTS).optional(),
  /** Banda desde la que actúa (derecha/izquierda), si está documentado. */
  side: z.enum(SIDES).optional(),
  /** Distancia al arco, si está documentada. */
  zone: z.enum(ZONES).optional(),
});

export const SceneSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    eraId: z.string(),
    order: z.number().int().min(1),
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
    headline: z.string().min(1),
    description: z.string().min(1).max(450),
    protagonists: z.array(z.string()),
    rival: z.string().optional(),
    result: z.string().optional(),
    /** Estadio donde ocurre la jugada: fondo fijo de todas las viñetas (solo escenas de jugada). */
    stadium: z.string().optional(),
    /** Tira de cómic: 3–4 viñetas en orden cronológico (las jugadas pueden tener 2). */
    panels: z.array(PanelSchema).min(2).max(4).optional(),
    challenge: ChallengeSchema.optional(),
    sources: z.array(z.object({ label: z.string(), url: z.url() })),
    verified: z.boolean(),
    imageAlt: z.string().optional(),
    imageCredit: z.string().optional(),
  })
  .superRefine((s, ctx) => {
    if (s.verified && s.sources.length < 1)
      ctx.addIssue({ code: "custom", message: "verified:true requiere al menos 1 fuente (idealmente 2)", path: ["sources"] });
    if (s.verified && !s.panels)
      ctx.addIssue({ code: "custom", message: "verified:true requiere panels (tira de cómic)", path: ["panels"] });
    if (s.panels) {
      const isPlay = s.panels.some((p) => p.setting.kind === "jugada");
      if (isPlay && !s.stadium) ctx.addIssue({ code: "custom", message: "las jugadas necesitan `stadium`", path: ["stadium"] });
      if (isPlay && !s.panels.every((p) => p.setting.kind === "jugada" && (ACTIONS as readonly string[]).includes(p.setting.label)))
        ctx.addIssue({ code: "custom", message: `en una jugada todas las viñetas usan una acción de ${ACTIONS.join("/")}`, path: ["panels"] });
      if (!isPlay && s.panels.length < 3) ctx.addIssue({ code: "custom", message: "una escena normal tiene 3–4 viñetas", path: ["panels"] });
      const keys = s.panels.map((p) => `${p.setting.label}|${(ORDERED_ACTIONS.includes(p.setting.label) ? [...p.figures] : [...p.figures].sort()).join(",")}`);
      if (new Set(keys).size !== keys.length)
        ctx.addIssue({ code: "custom", message: "dos viñetas con mismo escenario y personajes", path: ["panels"] });
    }
    const c = s.challenge;
    if (c && "answerIndex" in c && c.answerIndex >= c.options.length)
      ctx.addIssue({ code: "custom", message: "answerIndex fuera de rango", path: ["challenge"] });
  });

export const EraSchema = z.object({
  id: z.string(),
  name: z.string(),
  range: z.string(),
  order: z.number().int(),
});

export type Panel = z.infer<typeof PanelSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type Era = z.infer<typeof EraSchema>;
