import type { Challenge } from "./schema";

export const BASE_POINTS = 100;
export const STREAK_BONUS = 25;
export const MAX_STREAK_BONUS = 100;
/** Poné en true para navegar todas las épocas sin bloqueo. */
export const FREE_NAVIGATION = true;

export function isCorrect(c: Challenge, answer: number): boolean {
  switch (c.type) {
    case "quiz":
    case "who-scored":
      return answer === c.answerIndex;
    case "guess-year":
      return Math.abs(answer - c.correctYear) <= c.tolerance;
  }
}

/** Puntos por un acierto dado el streak *previo* a responder. */
export function pointsFor(correct: boolean, previousStreak: number): number {
  if (!correct) return 0;
  return BASE_POINTS + Math.min(previousStreak * STREAK_BONUS, MAX_STREAK_BONUS);
}

export function nextStreak(correct: boolean, streak: number): number {
  return correct ? streak + 1 : 0;
}

export function isEraComplete(sceneIds: string[], completed: Record<string, unknown>): boolean {
  return sceneIds.length > 0 && sceneIds.every((id) => id in completed);
}

/** Una época se desbloquea al completar la anterior (la primera siempre está abierta). */
export function isEraUnlocked(
  index: number,
  eraSceneIds: string[][],
  completed: Record<string, unknown>,
  free = FREE_NAVIGATION,
): boolean {
  if (free || index === 0) return true;
  return isEraComplete(eraSceneIds[index - 1], completed);
}

/** Devolución de una respuesta de año, teniendo en cuenta el margen aceptado. */
export function yearFeedback(correctYear: number, tolerance: number, guess: number): { ok: boolean; text: string } {
  const diff = guess - correctYear;
  if (diff === 0) return { ok: true, text: `¡Exacto! Fue en ${correctYear}.` };
  const margin = Math.abs(diff);
  const years = `${margin} ${margin === 1 ? "año" : "años"}`;
  if (margin <= tolerance)
    return { ok: true, text: `¡Casi, y cuenta! Fue en ${correctYear}: ${diff > 0 ? `te pasaste por ${years}` : `te quedaste ${years} corto`}, pero se acepta un margen de ±${tolerance} ${tolerance === 1 ? "año" : "años"}.` };
  return {
    ok: false,
    text: `No era esa. Fue en ${correctYear}, ${years} ${diff > 0 ? "antes" : "después"} de lo que pusiste.${tolerance > 0 ? ` (Se aceptaba un margen de ±${tolerance} ${tolerance === 1 ? "año" : "años"}.)` : ""}`,
  };
}

export type EraStats = {
  total: number;
  /** Escenas resueltas (con o sin ayuda). */
  solved: number;
  /** Resueltas a la primera: sin intentos incorrectos ni pistas (armar de a tandas no cuenta como error). */
  firstTry: number;
  /** Preguntas extra acertadas / preguntas extra respondidas. */
  quizHits: number;
  quizAnswered: number;
  /** Puntos ganados en esta época (tira + pregunta extra). */
  points: number;
};

/** Cuenta de una época: cada número sale de lo realmente guardado, sin mezclar épocas ni conceptos. */
export function eraStats(
  sceneIds: string[],
  completed: Record<string, boolean>,
  points: Record<string, number> = {},
): EraStats {
  const has = (k: string) => k in completed;
  return {
    total: sceneIds.length,
    solved: sceneIds.filter(has).length,
    firstTry: sceneIds.filter((id) => completed[id] === true).length,
    quizHits: sceneIds.filter((id) => completed[`${id}:q`] === true).length,
    quizAnswered: sceneIds.filter((id) => has(`${id}:q`)).length,
    points: sceneIds.reduce((sum, id) => sum + (points[id] ?? 0) + (points[`${id}:q`] ?? 0), 0),
  };
}
