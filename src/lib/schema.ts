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
    correctYear: z.number().int(),
    tolerance: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("who-scored"),
    options: z.array(z.string().min(1)).min(2),
    answerIndex: z.number().int().min(0),
  }),
]);

export const PanelSchema = z.object({
  /** Viñeta: 1–2 oraciones que reformulan SOLO hechos ya presentes en la escena verificada. */
  caption: z.string().min(1).max(160),
  /** Escenario donde ocurre la viñeta. kind define el fondo dibujado. */
  setting: z.object({
    label: z.string().min(1).max(40),
    kind: z.enum(["cancha", "tribuna", "sede", "ciudad"]),
  }),
  /** Personajes que actúan en la viñeta (1–3): protagonistas/rival de la escena, o "River", "Hinchas", "Árbitro" si el texto los menciona. */
  figures: z.array(z.string()).min(1).max(3),
  tone: z.enum(["calma", "tension", "drama", "gloria"]),
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
    /** Tira de cómic: 3–4 viñetas en orden cronológico. */
    panels: z.array(PanelSchema).min(3).max(4).optional(),
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
      const keys = s.panels.map((p) => `${p.setting.label}|${[...p.figures].sort().join(",")}`);
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
