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
