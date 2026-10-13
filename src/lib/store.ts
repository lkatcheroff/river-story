import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isCorrect, nextStreak, pointsFor } from "./game";
import type { Challenge } from "./schema";

type State = {
  score: number;
  streak: number;
  bestStreak: number;
  /** sceneId -> acertó el desafío (true también si no tenía desafío) */
  completed: Record<string, boolean>;
  /** Puntos ganados por escena (clave de la escena o `<id>:q` para la pregunta extra). */
  points: Record<string, number>;
  answer: (sceneId: string, challenge: Challenge, answer: number) => boolean;
  /** Resultado de armar la tira (acierto a la primera = true). */
  result: (sceneId: string, ok: boolean) => void;
  complete: (sceneId: string) => void;
  /** Vuelve a dejar una escena sin jugar: quita su estado y los puntos que dio. */
  resetScene: (sceneId: string) => void;
  reset: () => void;
};

const initial = { score: 0, streak: 0, bestStreak: 0, completed: {} as Record<string, boolean>, points: {} as Record<string, number> };

export const useGame = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      answer: (sceneId, challenge, a) => {
        const s = get();
        const ok = isCorrect(challenge, a);
        if (sceneId in s.completed) return ok; // sin doble puntaje
        const streak = nextStreak(ok, s.streak);
        const pts = pointsFor(ok, s.streak);
        set({
          score: s.score + pts,
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
          completed: { ...s.completed, [sceneId]: ok },
          points: { ...(s.points ?? {}), [sceneId]: pts },
        });
        return ok;
      },
      result: (sceneId, ok) => {
        const s = get();
        if (sceneId in s.completed) return;
        const streak = nextStreak(ok, s.streak);
        const pts = pointsFor(ok, s.streak);
        set({
          score: s.score + pts,
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
          completed: { ...s.completed, [sceneId]: ok },
          points: { ...(s.points ?? {}), [sceneId]: pts },
        });
      },
      resetScene: (sceneId) =>
        set((s) => {
          const keys = [sceneId, `${sceneId}:q`];
          const back = keys.reduce((sum, k) => sum + (s.points?.[k] ?? 0), 0);
          const completed = { ...s.completed };
          const points = { ...(s.points ?? {}) };
          keys.forEach((k) => { delete completed[k]; delete points[k]; });
          return { completed, points, score: Math.max(0, s.score - back), streak: 0 };
        }),
      complete: (sceneId) =>
        set((s) => (sceneId in s.completed ? s : { completed: { ...s.completed, [sceneId]: false } })),
      reset: () => set(initial),
    }),
    { name: "river-story-v1" },
  ),
);
