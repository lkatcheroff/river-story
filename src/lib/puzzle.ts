import { TEAM_NAMES, isRivalName } from "./characters";
import { ACTIONS, GOAL_PIECE, ORDERED_ACTIONS, type Panel, type Scene } from "./schema";

export type Slot = { setting: string | null; cast: string[] };
export type Verdict = "exact" | "duplicate" | "swapped" | "other-moment" | "partial" | "mismatch" | "empty";
export type Analysis = { verdict: Verdict; message: string };
export type Kind = Panel["setting"]["kind"];

export const MAX_CAST = 3;

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export const emptySlots = (n: number): Slot[] => Array.from({ length: n }, () => ({ setting: null, cast: [] }));

const isOrdered = (p: Panel) => ORDERED_ACTIONS.includes(p.setting.label);
const sameSeq = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const matches = (p: Panel, s: Slot) =>
  s.setting === p.setting.label && (isOrdered(p) ? sameSeq(s.cast, p.figures) : sameSet(s.cast, p.figures));

export const isSolved = (verdicts: Verdict[]) => verdicts.every((v) => v === "exact");

export function toggleCast(slot: Slot, name: string): Slot {
  if (slot.cast.includes(name)) return { ...slot, cast: slot.cast.filter((c) => c !== name) };
  if (slot.cast.length >= MAX_CAST) return slot;
  return { ...slot, cast: [...slot.cast, name] };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const sameSlot = (a: Slot, b: Slot) => a.setting === b.setting && sameSet(a.cast, b.cast);

/** Diferencia entre una combinación y una viñeta real: 0 = coincide. */
function distance(p: Panel, s: Slot) {
  const missing = p.figures.filter((f) => !s.cast.includes(f)).length;
  const extra = s.cast.filter((c) => !p.figures.includes(c)).length;
  const settingOk = s.setting === p.setting.label;
  // Pase y Centro: los jugadores son los correctos pero quien da y quien recibe están al revés.
  const reversed = isOrdered(p) && missing === 0 && extra === 0 && !sameSeq(s.cast, p.figures);
  return { missing, extra, settingOk, reversed, score: (settingOk ? 0 : 1) + missing + extra + (reversed ? 1 : 0) };
}

const isPlay = (p: Panel) => p.setting.kind === "jugada";
/** Palabras según el tipo de escena: lugar/personajes o acción/jugadores. */
const W = (p: Panel) => (isPlay(p) ? { place: "la acción", placeIs: "la acción es correcta", placeNot: "la acción no es esta", cast: "jugadores", castShort: "jugador" } : { place: "el lugar", placeIs: "el lugar es correcto", placeNot: "el lugar no es este", cast: "personajes", castShort: "personaje" });

/** Qué tan cerca está una combinación de una viñeta: lugar/acción, personajes bien, faltan y sobran. */
function detail(p: Panel, s: Slot): string {
  const d = distance(p, s);
  const w = W(p);
  const place = d.settingOk ? w.placeIs : w.placeNot;
  if (d.reversed) return `${d.settingOk ? `${w.placeIs} y los ${w.cast} también` : `${w.cast} correctos`}, pero está al revés: ¿quién da y quién recibe?`;
  if (d.missing === 0 && d.extra === 0) return d.settingOk ? `${w.place} y los ${w.cast} son correctos.` : `los ${w.cast} son los correctos, pero ${w.placeNot}.`;
  // En las jugadas el arco no es un jugador: se nombra aparte para no confundir ("falta 1 jugador" cuando falta el arco).
  const isGoal = (n: string) => n === GOAL_PIECE;
  const play = isPlay(p);
  const missingList = p.figures.filter((f) => !s.cast.includes(f));
  const extraList = s.cast.filter((c) => !p.figures.includes(c));
  const missPlayers = play ? missingList.filter((m) => !isGoal(m)).length : missingList.length;
  const extraPlayers = play ? extraList.filter((m) => !isGoal(m)).length : extraList.length;
  const right = p.figures.filter((f) => s.cast.includes(f) && !(play && isGoal(f))).length;
  const noun = (n: number) => (n === 1 ? w.castShort : w.cast);
  const cast = [
    right ? `${right} ${right === 1 ? `${w.castShort} bien` : `${w.cast} bien`}` : `ningún ${w.castShort} coincide`,
    missPlayers ? `falta${missPlayers > 1 ? "n" : ""} ${missPlayers} ${noun(missPlayers)}` : "",
    play && missingList.some(isGoal) ? "falta el arco" : "",
    extraPlayers ? `sobra${extraPlayers > 1 ? "n" : ""} ${extraPlayers} ${noun(extraPlayers)}` : "",
    play && extraList.some(isGoal) ? "sobra el arco" : "",
  ].filter(Boolean);
  return `${place}; ${cast.join(", ")}.`;
}
const forThis = (p: Panel, s: Slot) => ` Para esta viñeta: ${detail(p, s)}`;

/** Analiza todas las viñetas a la vez: orden, repetidas, intercambiadas y diferencias. */
export function analyze(panels: Panel[], slots: Slot[]): Analysis[] {
  const isEmpty = (s: Slot) => s.setting === null || s.cast.length === 0;
  const m = slots.map((s) => (isEmpty(s) ? -1 : panels.findIndex((p) => matches(p, s))));
  const dir = (from: number, to: number) => (to < from ? "antes" : "después");

  return slots.map((s, i): Analysis => {
    if (s.setting === null && s.cast.length === 0) return { verdict: "empty", message: isPlay(panels[0]) ? "Vacía: falta la acción y los jugadores." : "Vacía: falta el escenario y los personajes." };
    if (s.setting === null) return { verdict: "empty", message: isPlay(panels[0]) ? "Falta elegir la acción." : "Falta elegir el escenario." };
    if (s.cast.length === 0) return { verdict: "empty", message: isPlay(panels[0]) ? "Faltan jugadores." : "Faltan personajes." };
    if (m[i] === i) return { verdict: "exact", message: panels[i].caption };

    if (m[i] >= 0) {
      const j = m[i];
      if (m[j] === j) return { verdict: "duplicate", message: `Esta escena ya la pusiste bien en la viñeta ${j + 1}: no se repite, acá pasa otra cosa.${forThis(panels[i], s)}` };
      if (m[j] === i) return { verdict: "swapped", message: `Esta escena y la de la viñeta ${j + 1} están intercambiadas: cada una va en el lugar de la otra.${forThis(panels[i], s)}` };
      const twin = slots.findIndex((_, k) => k !== i && m[k] === j);
      if (twin >= 0) return { verdict: "duplicate", message: `Esta escena está repetida en las viñetas ${Math.min(i, twin) + 1} y ${Math.max(i, twin) + 1}: solo pasó una vez, y va ${dir(i, j)} de acá.${forThis(panels[i], s)}` };
      return { verdict: "other-moment", message: `Esta escena sí pasó, pero en otro momento: está en desorden y va ${dir(i, j)} de esta viñeta.${forThis(panels[i], s)}` };
    }

    const same = slots.findIndex((o, k) => k !== i && !isEmpty(o) && sameSlot(o, s));
    if (same >= 0) return { verdict: "duplicate", message: `Repetiste la misma combinación de la viñeta ${same + 1}. En cada viñeta pasa algo distinto.` };

    const own = distance(panels[i], s);
    let best = i;
    panels.forEach((p, k) => { if (distance(p, s).score < distance(panels[best], s).score) best = k; });
    if (best !== i && distance(panels[best], s).score < own.score && distance(panels[best], s).score <= 2)
      return { verdict: "partial", message: `Se parece a un momento ${dir(i, best)} de la historia (${detail(panels[best], s).replace(/\.$/, "")}). Para esta viñeta: ${detail(panels[i], s)}` };
    return { verdict: own.score <= 2 ? "partial" : "mismatch", message: `${detail(panels[i], s).replace(/^./, (c) => c.toUpperCase())}` };
  });
}

export const judge = (panels: Panel[], index: number, slot: Slot): Verdict => {
  const s = emptySlots(panels.length);
  s[index] = slot;
  return analyze(panels, s)[index].verdict;
};

/** Resumen global tras reproducir. */
export function summary(verdicts: Verdict[]): string {
  const n = (...vs: Verdict[]) => verdicts.filter((v) => vs.includes(v)).length;
  const ok = n("exact");
  const order = n("other-moment", "swapped");
  const dup = n("duplicate");
  const empty = n("empty");
  const bad = verdicts.length - ok - order - dup - empty;
  const parts = [`${ok} de ${verdicts.length} viñetas en su lugar`];
  if (order) parts.push(`${plural(order, "en desorden", "en desorden")}`);
  if (dup) parts.push(`${plural(dup, "repetida", "repetidas")}`);
  if (bad) parts.push(`${plural(bad, "por corregir", "por corregir")}`);
  if (empty) parts.push(`${plural(empty, "vacía", "vacías")}`);
  return parts.join(" · ") + ".";
}

export const MAX_CLUE = 3;

/** Escalera de pistas por viñeta: 1 = guion (qué pasa), 2 = escenario, 3 = personajes. */
export function clue(panel: Panel, level: 1 | 2 | 3): string {
  if (level === 1) return `Guion: «${panel.caption}»`;
  if (isPlay(panel)) {
    if (level === 2) return `Pista: la acción de esta viñeta es «${panel.setting.label}».`;
    return `Pista: «${panel.setting.label}» con ${isOrdered(panel) ? `${panel.figures[0]} dándosela a ${panel.figures[1]}` : panel.figures.join(" y ")}.`;
  }
  if (level === 2) return `Pista: esta viñeta transcurre en «${panel.setting.label}».`;
  return `Pista: actúan ${panel.figures.join(", ")} en «${panel.setting.label}».`;
}

/** Texto de ficción (what-if) para una combinación que no ocurrió. Siempre marcado como FICCIÓN. */
export function fiction(slot: Slot, rivals: Set<string>): string {
  const place = slot.setting ?? "";
  const r = slot.cast.filter((c) => rivals.has(c));
  const mine = slot.cast.filter((c) => !rivals.has(c));
  if (r.length && mine.length)
    return `FICCIÓN · ${mine.join(" y ")} y ${r.join(" y ")} se cruzan en ${place}… pero esa escena no ocurrió así.`;
  return `FICCIÓN · ${slot.cast.join(", ")} en ${place}: linda postal, pero no pasó así.`;
}

export type Registry = {
  settings: Map<string, Kind>;
  cast: Set<string>;
  rivals: Set<string>;
  /** Años de las escenas donde aparece cada escenario o personaje (para elegir señuelos verosímiles). */
  years: Map<string, number[]>;
};

/** Lugares que no son un estadio. Los partidos siempre se ubican en el estadio concreto. */
const GENERIC_SETTINGS = ["La tribuna", "La sede", "La ciudad"];
const yearOf = (s: Scene) => Number.parseInt(s.date, 10);

export function buildRegistry(scenes: Scene[]): Registry {
  const settings = new Map<string, Kind>();
  const cast = new Set<string>();
  const rivals = new Set<string>();
  const years = new Map<string, number[]>();
  const seen = (key: string, y: number) => years.set(key, [...(years.get(key) ?? []), y]);
  for (const s of scenes) {
    const y = yearOf(s);
    if (s.rival) rivals.add(s.rival);
    for (const p of s.panels ?? []) {
      settings.set(p.setting.label, p.setting.kind);
      seen(p.setting.label, y);
      p.figures.forEach((f) => {
        cast.add(f);
        seen(f, y);
        if (isRivalName(f)) rivals.add(f);
      });
    }
  }
  return { settings, cast, rivals, years };
}

/** Cercanía temporal de un elemento a un año: 0 si no hay datos de fechas. */
const nearness = (reg: Registry, key: string, year: number) => {
  const ys = (reg.years.get(key) ?? []).filter((y) => !Number.isNaN(y));
  if (Number.isNaN(year) || ys.length === 0) return 0;
  return Math.min(...ys.map((y) => Math.abs(y - year)));
};

function pick<T>(arr: T[], n: number, rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** Los n más cercanos en el tiempo, con algo de azar entre los parecidos. */
const MAX_YEARS_AWAY = 25;
const TIMELESS = new Set(["River", "River Plate", "Hinchas", "Árbitro"]);

function nearest(reg: Registry, keys: string[], year: number, n: number, rng: () => number): string[] {
  return keys
    .filter((k) => TIMELESS.has(k) || nearness(reg, k, year) <= MAX_YEARS_AWAY)
    .map((k) => ({ k, d: nearness(reg, k, year) + rng() * 8 }))
    .sort((x, y) => x.d - y.d)
    .slice(0, n)
    .map((x) => x.k);
}

/** Piezas de la bandeja: lo necesario + señuelos de la misma época, mezclados. */
export function buildPieces(scene: Scene, reg: Registry, rng: () => number = Math.random) {
  const panels = scene.panels ?? [];
  const year = yearOf(scene);
  const needS = [...new Set(panels.map((p) => p.setting.label))];
  const needC = [...new Set(panels.flatMap((p) => p.figures))];

  // Jugadas: siempre todas las acciones, y el arco con su arquero.
  if (panels.some(isPlay)) {
    const players = [...reg.cast].filter((k) => !needC.includes(k) && k !== GOAL_PIECE && !isTeam(k) && !reg.rivals.has(k) && k !== "Hinchas" && !k.startsWith("River"));
    const decoys = nearest(reg, players, year, 4, rng);
    return { settings: [...ACTIONS] as string[], cast: pick([...new Set([...needC, GOAL_PIECE, ...decoys])], 12, rng) };
  }

  // Escenarios: los lugares que no son estadio siempre son creíbles + estadios de la misma época.
  const generic = GENERIC_SETTINGS.filter((g) => reg.settings.has(g) && !needS.includes(g));
  const named = [...reg.settings.keys()].filter((k) => !needS.includes(k) && !GENERIC_SETTINGS.includes(k) && reg.settings.get(k) !== "jugada");
  const settings = pick([...needS, ...generic, ...nearest(reg, named, year, 3, rng)], 10, rng);

  // Personajes: rivales y compañeros de la misma época, más "Hinchas"/"River" si son creíbles.
  // "River Plate" y "River" son lo mismo: no se ofrecen como señuelo una de la otra.
  const others = [...reg.cast].filter((k) => !needC.includes(k) && k !== GOAL_PIECE && !(k.startsWith("River") && needC.some((n) => n.startsWith("River"))) && k !== "River Plate");
  const rivals = others.filter((k) => reg.rivals.has(k) && isTeam(k));
  const mine = others.filter((k) => !reg.rivals.has(k));
  const decoys = [...nearest(reg, rivals, year, 2, rng), ...nearest(reg, mine, year, 4, rng)];
  const cast = pick([...needC, ...decoys], 12, rng);
  return { settings, cast };
}

const isTeam = (name: string) => TEAM_NAMES.has(name);

