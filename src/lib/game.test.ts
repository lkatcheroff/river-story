import type { Challenge } from "./schema";
import { describe, expect, it } from "vitest";
import { yearFeedback, isCorrect, pointsFor, nextStreak, isEraUnlocked, isEraComplete } from "./game";

describe("isCorrect", () => {
  it("quiz", () => {
    const c = { type: "quiz", question: "?", options: ["a", "b"], answerIndex: 1, explanation: "x" } satisfies Challenge;
    expect(isCorrect(c, 1)).toBe(true);
    expect(isCorrect(c, 0)).toBe(false);
  });
  it("guess-year sin tolerancia: 1996 no es 1995", () => {
    const c = { type: "guess-year", question: "?", correctYear: 1995, tolerance: 0 } satisfies Challenge;
    expect(isCorrect(c, 1995)).toBe(true);
    expect(isCorrect(c, 1996)).toBe(false);
  });
  it("guess-year respeta tolerancia", () => {
    const c = { type: "guess-year", question: "?", correctYear: 1986, tolerance: 2 } satisfies Challenge;
    expect(isCorrect(c, 1988)).toBe(true);
    expect(isCorrect(c, 1989)).toBe(false);
  });
});

describe("puntaje y racha", () => {
  it("bonus por racha con tope", () => {
    expect(pointsFor(true, 0)).toBe(100);
    expect(pointsFor(true, 2)).toBe(150);
    expect(pointsFor(true, 10)).toBe(200);
    expect(pointsFor(false, 3)).toBe(0);
  });
  it("racha se corta al errar", () => {
    expect(nextStreak(true, 2)).toBe(3);
    expect(nextStreak(false, 2)).toBe(0);
  });
});

describe("desbloqueo", () => {
  const eras = [["a1", "a2"], ["b1"]];
  it("primera siempre abierta", () => expect(isEraUnlocked(0, eras, {}, false)).toBe(true));
  it("segunda requiere completar la primera", () => {
    expect(isEraUnlocked(1, eras, { a1: 1 }, false)).toBe(false);
    expect(isEraUnlocked(1, eras, { a1: 1, a2: 1 }, false)).toBe(true);
  });
  it("flag libre", () => expect(isEraUnlocked(1, eras, {}, true)).toBe(true));
  it("época vacía no cuenta como completa", () => expect(isEraComplete([], {})).toBe(false));
});

describe("devolución del año con margen", () => {
  it("exacto", () => expect(yearFeedback(1995, 0, 1995)).toMatchObject({ ok: true, text: expect.stringContaining("Exacto") }));
  it("sin margen, 1996 no es 1995 y dice hacia dónde", () => {
    const f = yearFeedback(1995, 0, 1996);
    expect(f.ok).toBe(false);
    expect(f.text).toContain("1 año antes de lo que pusiste");
    expect(yearFeedback(1995, 0, 1990).text).toContain("5 años después de lo que pusiste");
  });
  it("dentro del margen cuenta y lo aclara", () => {
    const f = yearFeedback(1995, 1, 1996);
    expect(f.ok).toBe(true);
    expect(f.text).toMatch(/Casi.*te pasaste por 1 año.*±1 año/);
    expect(yearFeedback(1995, 1, 1994).text).toMatch(/te quedaste 1 año corto/);
  });
  it("fuera del margen recuerda el margen", () => expect(yearFeedback(1995, 1, 1998).text).toContain("±1"));
});
