import { beforeEach, describe, expect, it } from "vitest";
import { useGame } from "./store";

const quiz = { type: "quiz", question: "?", options: ["a", "b"], answerIndex: 0, explanation: "x" } as const;

describe("store", () => {
  beforeEach(() => useGame.getState().reset());

  it("suma con bonus de racha y corta al errar", () => {
    const g = useGame.getState();
    g.answer("s1", { ...quiz, options: [...quiz.options] }, 0);
    g.answer("s2", { ...quiz, options: [...quiz.options] }, 0);
    expect(useGame.getState().score).toBe(100 + 125);
    useGame.getState().answer("s3", { ...quiz, options: [...quiz.options] }, 1);
    expect(useGame.getState().streak).toBe(0);
    expect(useGame.getState().bestStreak).toBe(2);
  });

  it("no puntúa dos veces la misma escena", () => {
    const c = { ...quiz, options: [...quiz.options] };
    useGame.getState().answer("s1", c, 0);
    useGame.getState().answer("s1", c, 0);
    expect(useGame.getState().score).toBe(100);
  });

  it("resetScene devuelve la escena a cero y descuenta sus puntos", () => {
    const c = { ...quiz, options: [...quiz.options] };
    useGame.getState().result("s1", true);
    useGame.getState().answer("s1:q", c, 0);
    expect(useGame.getState().score).toBe(225);
    useGame.getState().resetScene("s1");
    const g = useGame.getState();
    expect(g.score).toBe(0);
    expect("s1" in g.completed).toBe(false);
    expect("s1:q" in g.completed).toBe(false);
    g.result("s1", true);
    expect(useGame.getState().score).toBe(100);
  });
});
