import { describe, expect, it } from "vitest";
import { currentStep } from "./Tutorial";
import type { SceneState } from "./ComicScene";

const TOKIO = "Estadio Nacional de Tokio";
const base = (over: Partial<SceneState> = {}): SceneState => ({
  slots: [{ setting: null, cast: [] }, { setting: null, cast: [] }],
  locked: [false, false], attempts: 0, analysis: null, solved: false, hints: 0, ...over,
});
const step = (s: SceneState, done: string[] = []) => currentStep({ s, done: new Set(done) });
const id = (i: number) => ["intro", "a1", "a2", "a3", "a4", "locked", "hint", "b1", "b2", "b3", "cartel", "f1", "f2", "f3", "end"][i];

describe("guía del tutorial: el paso sale siempre del estado real", () => {
  it("empieza en la introducción", () => expect(id(step(base()))).toBe("intro"));
  it("sin estado todavía muestra la introducción", () => expect(currentStep(null)).toBe(0));

  it("avanza lugar → River → Steaua → reproducir", () => {
    const slot = (cast: string[], setting: string | null = TOKIO) => [{ setting, cast }, { setting: null, cast: [] }];
    expect(id(step(base({ slots: [{ setting: null, cast: [] }, { setting: null, cast: [] }] }), ["intro"]))).toBe("a1");
    expect(id(step(base({ slots: slot([]) }), ["intro"]))).toBe("a2");
    expect(id(step(base({ slots: slot(["River"]) }), ["intro"]))).toBe("a3");
    expect(id(step(base({ slots: slot(["River", "Steaua Bucarest"]) }), ["intro"]))).toBe("a4");
  });

  it("si se saca un personaje o se vacía la viñeta, vuelve al paso que corresponde", () => {
    const withBoth = base({ slots: [{ setting: TOKIO, cast: ["River", "Steaua Bucarest"] }, { setting: null, cast: [] }] });
    expect(id(step(withBoth, ["intro"]))).toBe("a4");
    const removedOne = base({ slots: [{ setting: TOKIO, cast: ["Steaua Bucarest"] }, { setting: null, cast: [] }] });
    expect(id(step(removedOne, ["intro"]))).toBe("a2");
    const cleared = base();
    expect(id(step(cleared, ["intro"]))).toBe("a1");
  });

  it("con la viñeta 1 bloqueada, los pasos de armarla ya no vuelven", () => {
    const s = base({ locked: [true, false] });
    expect(id(step(s, ["intro"]))).toBe("locked");
    expect(id(step(s, ["intro", "locked"]))).toBe("hint");
    expect(id(step({ ...s, hints: 1 }, ["intro", "locked"]))).toBe("b1");
  });

  it("equivocarse a propósito y luego corregir, aunque vacíe la viñeta 2", () => {
    const locked = { locked: [true, false] as boolean[], hints: 1 };
    const d = ["intro", "locked"];
    const s2 = (setting: string | null, cast: string[]) => base({ ...locked, slots: [{ setting: TOKIO, cast: ["River", "Steaua Bucarest"] }, { setting, cast }] });
    expect(id(step(s2("La cancha", []), d))).toBe("b2");
    expect(id(step(s2("La cancha", ["Antonio Alzamendi"]), d))).toBe("b3");
    const afterWrong = [...d, "wrong"];
    expect(id(step(s2("La cancha", ["Antonio Alzamendi"]), afterWrong))).toBe("cartel");
    expect(id(step(s2("La cancha", ["Antonio Alzamendi"]), [...afterWrong, "cartel"]))).toBe("f1");
    expect(id(step(s2(TOKIO, []), [...afterWrong, "cartel"]))).toBe("f2");
    expect(id(step(s2(null, []), [...afterWrong, "cartel"]))).toBe("f1");
    expect(id(step(s2(TOKIO, ["Antonio Alzamendi"]), [...afterWrong, "cartel"]))).toBe("f3");
  });

  it("escena resuelta = cierre, en cualquier punto", () => {
    expect(id(step(base({ solved: true, locked: [true, true] })))).toBe("end");
  });
});
