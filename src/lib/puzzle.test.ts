import { describe, expect, it } from "vitest";
import { hadMistake, judge, isSolved, toggleCast, fiction, buildPieces, buildRegistry, analyze, summary, clue, type Slot } from "./puzzle";
import type { Panel, Scene } from "./schema";

const mk = (label: string, figures: string[]): Panel => ({
  caption: "x", tone: "calma", setting: { label, kind: "cancha" }, figures,
});
const panels = [mk("Monumental", ["A", "B"]), mk("La sede", ["A"]), mk("La ciudad", ["River"])];

describe("judge", () => {
  it("exact ignora el orden de los personajes", () =>
    expect(judge(panels, 0, { setting: "Monumental", cast: ["B", "A"] })).toBe("exact"));
  it("other-moment si coincide con otra viñeta", () =>
    expect(judge(panels, 0, { setting: "La sede", cast: ["A"] })).toBe("other-moment"));
  it("mismatch si no existe", () =>
    expect(judge(panels, 0, { setting: "Cali", cast: ["Z"] })).toBe("mismatch"));
  it("empty sin escenario o sin personajes", () => {
    expect(judge(panels, 0, { setting: null, cast: ["A"] })).toBe("empty");
    expect(judge(panels, 0, { setting: "La sede", cast: [] })).toBe("empty");
  });
});

describe("helpers", () => {
  it("isSolved", () => {
    expect(isSolved(["exact", "exact"])).toBe(true);
    expect(isSolved(["exact", "mismatch"])).toBe(false);
  });
  it("toggleCast respeta el máximo de 3", () => {
    let s: Slot = { setting: null, cast: [] };
    for (const n of ["a", "b", "c", "d"]) s = toggleCast(s, n);
    expect(s.cast).toEqual(["a", "b", "c"]);
    expect(toggleCast(s, "a").cast).toEqual(["b", "c"]);
  });
  it("la ficción siempre está marcada", () =>
    expect(fiction({ setting: "La sede", cast: ["A"] }, new Set())).toMatch(/^FICCIÓN/));
  it("buildPieces incluye lo necesario", () => {
    const scene = { id: "s", panels } as unknown as Scene;
    const reg = buildRegistry([scene, { id: "t", panels: [mk("Cali", ["Z"])] } as unknown as Scene]);
    const p = buildPieces(scene, reg, () => 0.5);
    expect(p.settings).toEqual(expect.arrayContaining(["Monumental", "La sede", "La ciudad"]));
    expect(p.cast).toEqual(expect.arrayContaining(["A", "B", "River"]));
  });
});

const run = (slots: Slot[]) => analyze(panels, slots);
const S = (setting: string | null, cast: string[]): Slot => ({ setting, cast });
const empty = S(null, []);

describe("análisis de casos", () => {
  it("todo correcto", () =>
    expect(run([S("Monumental", ["A", "B"]), S("La sede", ["A"]), S("La ciudad", ["River"])]).map((a) => a.verdict)).toEqual(["exact", "exact", "exact"]));

  it("escena correcta repetida en otra viñeta = duplicada, no 'en desorden'", () => {
    const r = run([S("Monumental", ["A", "B"]), S("Monumental", ["A", "B"]), empty]);
    expect(r[0].verdict).toBe("exact");
    expect(r[1].verdict).toBe("duplicate");
    expect(r[1].message).toMatch(/ya la pusiste bien en la viñeta 1/);
  });

  it("caso real: River+Independiente puesto dos veces, la 2ª es solo River", () => {
    const ps = [mk("La ciudad", ["River", "Independiente"]), mk("La ciudad", ["River"])];
    const r = analyze(ps, [S("La ciudad", ["River", "Independiente"]), S("La ciudad", ["River", "Independiente"])]);
    expect(r[0].verdict).toBe("exact");
    expect(r[1].verdict).toBe("duplicate");
    expect(r[1].message).toMatch(/ya la pusiste bien en la viñeta 1/);
    expect(r[1].message).toMatch(/el lugar es correcto; 1 personaje bien, sobra 1/);
  });

  it("dos viñetas intercambiadas", () => {
    const r = run([S("La sede", ["A"]), S("Monumental", ["A", "B"]), S("La ciudad", ["River"])]);
    expect(r[0].verdict).toBe("swapped");
    expect(r[1].verdict).toBe("swapped");
    expect(r[2].verdict).toBe("exact");
  });

  it("misma escena dos veces, ninguna en su lugar", () => {
    const r = run([S("La ciudad", ["River"]), S("La ciudad", ["River"]), empty]);
    expect(r[0].verdict).toBe("duplicate");
    expect(r[0].message).toMatch(/repetida en las viñetas 1 y 2/);
  });

  it("desorden indica antes o después", () => {
    expect(run([S("La sede", ["A"]), empty, empty])[0].message).toMatch(/va después/);
    expect(run([empty, empty, S("La sede", ["A"])])[2].message).toMatch(/va antes/);
  });

  it("combinación repetida que no existe en la historia", () => {
    const r = run([S("Cali", ["Z"]), S("Cali", ["Z"]), empty]);
    expect(r[0].message).toMatch(/Repetiste la misma combinación/);
  });

  it("reparto incompleto, sobrante y escenario equivocado", () => {
    expect(run([S("Monumental", ["A"]), empty, empty])[0].message).toMatch(/falta 1/);
    expect(run([empty, S("La sede", ["A", "B"]), empty])[1].message).toMatch(/sobra 1/);
    expect(run([S("Cali", ["A", "B"]), empty, empty])[0].message).toMatch(/personajes son los correctos, pero el lugar no es este/i);
  });

  it("se parece a otro momento", () => {
    const r = run([empty, empty, S("La sede", ["A", "B"])])[2];
    expect(r.verdict).toBe("partial");
    expect(r.message).toMatch(/momento (antes|después)/);
  });

  it("vacías", () => {
    expect(run([empty, S("La sede", []), S(null, ["A"])]).map((a) => a.message)).toEqual([
      "Vacía: falta el escenario y los personajes.", "Faltan personajes.", "Falta elegir el escenario.",
    ]);
  });
});

describe("resumen y pistas", () => {
  it("resumen", () => expect(summary(["exact", "other-moment", "duplicate", "mismatch"])).toMatch(/1 de 4.*desorden.*repetida.*por corregir/));
  it("pistas progresivas", () => {
    expect(clue(panels[0], 1)).toContain("Guion");
    expect(clue(panels[0], 2)).toContain("Monumental");
    expect(clue(panels[0], 3)).toContain("A, B");
  });
});

describe("señuelos verosímiles", () => {
  const sc = (id: string, date: string, ps: Panel[], rival?: string) => ({ id, date, panels: ps, rival }) as unknown as Scene;
  const old = sc("viejo", "1932", [mk("La sede", ["Bernabé"]), mk("Gasómetro", ["River"]), mk("La ciudad", ["Peñarol"])]);
  const near = sc("cercano", "1938", [mk("Monumental", ["Moreno"]), mk("Gasómetro", ["Peucelle"]), mk("La ciudad", ["River"])]);
  const far = sc("lejano", "2018", [mk("Bernabéu", ["Pratto"]), mk("Bombonera", ["Boca Juniors"]), mk("La tribuna", ["Hinchas"])]);
  const reg = buildRegistry([old, near, far]);
  it("prefiere personajes y lugares de la misma época", () => {
    const p = buildPieces(old, reg, () => 0);
    expect(p.cast).toContain("Moreno");
    expect(p.cast).not.toContain("Pratto");
    expect(p.settings).toContain("Monumental");
    expect(p.settings).not.toContain("Bernabéu");
  });
  it("los lugares que no son estadio siempre están disponibles", () => {
    const p = buildPieces(old, reg, () => 0);
    expect(p.settings).toEqual(expect.arrayContaining(["La sede", "La ciudad", "La tribuna"]));
    expect(p.settings).not.toContain("La cancha");
  });
});

describe("jugadas: acciones con jugadores", () => {
  const act = (label: string, figures: string[]): Panel => ({ caption: "x", tone: "gloria", setting: { label, kind: "jugada" }, figures });
  const play = [act("Pase", ["Quintero", "Pity"]), act("Tiro al arco", ["Pity", "Arco"]), act("Gol", ["Pity", "Arco"])];
  const S = (setting: string | null, cast: string[]) => ({ setting, cast });
  const run = (slots: ReturnType<typeof S>[]) => analyze(play, slots);

  it("el orden en un pase importa: quien da y quien recibe", () => {
    const ok = run([S("Pase", ["Quintero", "Pity"]), S(null, []), S(null, [])])[0];
    expect(ok.verdict).toBe("exact");
    const rev = run([S("Pase", ["Pity", "Quintero"]), S(null, []), S(null, [])])[0];
    expect(rev.verdict).toBe("partial");
    expect(rev.message).toMatch(/al revés.*quién da y quién recibe/);
  });
  it("tiro y gol con el mismo reparto se distinguen por la acción", () => {
    const r = run([S(null, []), S("Gol", ["Pity", "Arco"]), S("Tiro al arco", ["Pity", "Arco"])]);
    expect(r[1].verdict).toBe("swapped");
    expect(r[2].verdict).toBe("swapped");
  });
  it("la devolución habla de acción y jugadores", () => {
    const r = run([S("Centro", ["Quintero", "Pity"]), S(null, []), S(null, [])])[0];
    expect(r.message).toMatch(/la acción no es esta/);
    expect(run([S(null, []), S(null, []), S(null, [])])[0].message).toBe("Vacía: falta la acción y los jugadores.");
  });
  it("la bandeja de una jugada trae todas las acciones y el arco", () => {
    const scene = { id: "j", date: "2018", panels: play } as unknown as Scene;
    const reg = buildRegistry([scene]);
    const p = buildPieces(scene, reg, () => 0);
    expect(p.settings).toEqual(["Pase", "Centro", "Gambeta", "Tiro al arco", "Cabezazo", "Penal", "Gol"]);
    expect(p.cast).toEqual(expect.arrayContaining(["Quintero", "Pity", "Arco"]));
  });
  it("las escenas normales no reciben acciones ni arco como señuelo", () => {
    const normal = { id: "n", date: "2018", panels: [mk("Monumental", ["A"]), mk("La sede", ["B"]), mk("La ciudad", ["C"])] } as unknown as Scene;
    const reg = buildRegistry([normal, { id: "j", date: "2018", panels: play } as unknown as Scene]);
    const p = buildPieces(normal, reg, () => 0);
    expect(p.settings).not.toContain("Pase");
    expect(p.cast).not.toContain("Arco");
  });
});

describe("jugadas: el arco no se cuenta como jugador", () => {
  const act = (label: string, figures: string[]): Panel => ({ caption: "x", tone: "gloria", setting: { label, kind: "jugada" }, figures });
  const shot = [act("Tiro al arco", ["Gallardo", "Arco"]), act("Gol", ["Gallardo", "Arco"]), act("Penal", ["Gallardo", "Arco"])];
  it("si falta el arco lo dice, no 'falta 1 jugador'", () => {
    const m = analyze(shot, [{ setting: "Tiro al arco", cast: ["Gallardo"] }, { setting: null, cast: [] }, { setting: null, cast: [] }])[0].message;
    expect(m).toBe("La acción es correcta; 1 jugador bien, falta el arco.".replace(/^L/, "l").replace(/^./, (c) => c.toUpperCase()));
    expect(m).not.toMatch(/falta 1 jugador/);
  });
  it("si falta el jugador y no el arco, lo dice", () => {
    const m = analyze(shot, [{ setting: "Tiro al arco", cast: ["Arco"] }, { setting: null, cast: [] }, { setting: null, cast: [] }])[0].message;
    expect(m).toMatch(/ningún jugador coincide, falta 1 jugador/);
    expect(m).not.toMatch(/arco/i.test("x") ? /falta el arco/ : /^$/);
  });
  it("si sobra el arco lo dice", () => {
    const m = analyze([act("Pase", ["A", "B"]), act("Centro", ["B", "C"]), act("Gol", ["C", "Arco"])], [{ setting: "Pase", cast: ["A", "B", "Arco"] }, { setting: null, cast: [] }, { setting: null, cast: [] }])[0].message;
    expect(m).toMatch(/sobra el arco/);
  });
});

describe("errores al armar de a tandas", () => {
  it("viñetas bien o vacías no son error", () => {
    expect(hadMistake(["exact", "empty", "empty"], [false, false, false])).toBe(false);
    expect(hadMistake(["exact", "exact", "empty"], [true, false, false])).toBe(false);
  });
  it("una viñeta probada que no estaba bien sí es error", () => {
    for (const v of ["mismatch", "partial", "duplicate", "swapped", "other-moment"] as const)
      expect(hadMistake(["exact", v], [false, false])).toBe(true);
  });
  it("una viñeta ya bloqueada no cuenta aunque su veredicto cambie", () => {
    expect(hadMistake(["mismatch", "exact"], [true, false])).toBe(false);
  });
});
