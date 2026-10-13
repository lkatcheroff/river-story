import { describe, expect, it } from "vitest";
import { choreo } from "./choreo";

describe("coreografía de jugadas", () => {
  it("un tiro libre pone la barrera y la pelota pasa por encima", () => {
    const c = choreo("Tiro al arco", "tiro-libre", ["Gallardo", "Arco"]);
    expect(c.wall).toBe(true);
    expect(Math.max(...c.ball!.bottom)).toBeGreaterThan(60);
    expect(c.figs[0].pose).toBe("kick");
    expect(c.keeper).toBe("dive");
  });
  it("sin variante no hay barrera", () => expect(choreo("Tiro al arco", undefined, ["A", "Arco"]).wall).toBe(false));
  it("un cabezazo salta con la cabeza y una palomita se tira en el aire", () => {
    const h = choreo("Cabezazo", undefined, ["Alonso", "Arco"]);
    expect(h.figs[0].pose).toBe("header");
    expect(Math.min(...h.figs[0].y!)).toBeLessThan(-20);
    const p = choreo("Cabezazo", "palomita", ["Alario", "Arco"]);
    expect(p.figs[0].rotate!.some((r) => Math.abs(r) > 60)).toBe(true);
  });
  it("el córner muestra el banderín y la pelota sale de la esquina", () => {
    const c = choreo("Centro", "corner", ["Pisculichi", "Mercado"]);
    expect(c.flag).toBe(true);
    expect(c.ball!.left[0]).toBeLessThan(10);
  });
  it("un pase va de quien da a quien recibe", () => {
    const c = choreo("Pase", undefined, ["Alonso", "Alzamendi"]);
    expect(c.ball!.left[0]).toBeLessThan(c.ball!.left[1]);
    expect(c.figs[0].pose).toBe("kick");
  });
  it("el gol deja al arquero vencido y a la pelota en la red", () => {
    const c = choreo("Gol", undefined, ["Pratto", "Arco"]);
    expect(c.keeper).toBe("beaten");
    expect(c.ball!.left[0]).toBe(c.ball!.left[1]);
  });
  it("taco, chilena y media vuelta tienen su movimiento", () => {
    expect(choreo("Tiro al arco", "taco", ["H", "Arco"]).figs[0].pose).toBe("backheel");
    expect(choreo("Tiro al arco", "chilena", ["H", "Arco"]).figs[0].rotate).toBeDefined();
    expect(choreo("Tiro al arco", "media-vuelta", ["F", "Arco"]).figs[0].rotate).toContain(360);
  });
  it("la gambeta zigzaguea", () => expect(choreo("Gambeta", undefined, ["Bruno"]).figs[0].pose).toBe("dribble"));
});
