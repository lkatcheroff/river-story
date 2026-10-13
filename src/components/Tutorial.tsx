import { useEffect, useMemo, useState } from "react";
import { scenes, eras } from "../lib/content";
import type { Scene } from "../lib/schema";
import { ComicScene, type SceneState } from "./ComicScene";

const TUTORIAL_SCENE_ID = "intercontinental-86-tokio";
const TOKIO = "Estadio Nacional de Tokio";
const CANCHA = "La cancha";
const FIXED = { settings: [CANCHA, TOKIO, "La tribuna"], cast: ["River", "Steaua Bucarest", "Antonio Alzamendi", "Hinchas"] };

export const TUTORIAL_KEY = "river-story-tutorial-done";
export const tutorialDone = () => { try { return localStorage.getItem(TUTORIAL_KEY) === "1"; } catch { return false; } };
const markDone = () => { try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch { /* sin almacenamiento */ } };

/** Escena de práctica armada con dos viñetas reales y verificadas de la final del '86. */
function buildScene(): Scene | null {
  const real = scenes.find((s) => s.id === TUTORIAL_SCENE_ID);
  const p = real?.panels;
  if (!real || !p || p.length < 3) return null;
  return { ...real, id: "tutorial", challenge: undefined, panels: [p[0], p[2]] as Scene["panels"] };
}

/** Lo que el tutorial sabe del jugador: el estado de la escena y qué logros ya pasaron. */
type Ctx = { s: SceneState; done: Set<string> };

type Step = {
  id: string;
  title: string;
  /** Qué es y para qué sirve (contexto). */
  why: string;
  /** Qué hacer exactamente. */
  action?: string;
  /** Lo único que se puede tocar en este paso (el resto queda bloqueado y atenuado). */
  targets: string[];
  /**
   * El paso está cumplido. El paso actual SIEMPRE es el primero que no se cumple, calculado desde el
   * estado real: si el jugador deshace algo (saca un personaje, vacía una viñeta), la guía vuelve sola
   * al paso que corresponde y no puede quedar trabada.
   */
  met: (c: Ctx) => boolean;
  /** Pasos que solo se muestran si hacen falta (ya cumplidos, no aparecen). */
  optional?: boolean;
};

const sameCast = (a: string[], b: string[]) => a.length === b.length && b.every((x) => a.includes(x));
const cast = (s: SceneState, i: number) => s.slots[i].cast;
const WRONG = "Probá a propósito algo que no es: así aprendés a leer las pistas.";

const STEPS: Step[] = [
  {
    id: "intro",
    title: "Así se juega",
    why: "Cada escena es una tira de cómic con viñetas vacías. Tu misión es contar la historia real de River: en cada viñeta ponés DÓNDE pasó (un lugar) y QUIÉN actuó (personajes). Vamos a armar juntos la final del mundo de 1986, en 2 viñetas.",
    targets: [],
    met: (c) => c.done.has("intro"),
  },
  {
    id: "a1",
    title: "Viñeta 1 · el lugar",
    why: "La final del mundo se jugó en Tokio. Los lugares están en la bandeja de abajo.",
    action: `Arrastrá «${TOKIO}» hasta la viñeta 1. (También podés tocarlo: va a la viñeta marcada.)`,
    targets: [`setting:${TOKIO}`, "panel:0"],
    met: ({ s }) => s.locked[0] || s.slots[0].setting === TOKIO,
  },
  {
    id: "a2",
    title: "Viñeta 1 · primer personaje",
    why: "Ahora, quiénes actúan. Los personajes están debajo de los lugares. Cada viñeta admite hasta 3. Si te equivocás, tocá un personaje dentro de la viñeta para sacarlo.",
    action: "Arrastrá (o tocá) a «River» hasta la viñeta 1.",
    targets: ["cast:River", "panel:0"],
    met: ({ s }) => s.locked[0] || cast(s, 0).includes("River"),
  },
  {
    id: "a3",
    title: "Viñeta 1 · segundo personaje",
    why: "En esta final River enfrentó al Steaua de Bucarest.",
    action: "Arrastrá (o tocá) a «Bucarest» (Steaua Bucarest) hasta la viñeta 1.",
    targets: ["cast:Steaua Bucarest", "panel:0"],
    met: ({ s }) => s.locked[0] || sameCast(cast(s, 0), ["River", "Steaua Bucarest"]),
  },
  {
    id: "a4",
    title: "Reproducir",
    why: "Con «Reproducir» el juego prueba tu viñeta: los personajes actúan y te dice si cuenta bien la historia.",
    action: "Tocá «Reproducir».",
    targets: ["play"],
    met: ({ s }) => s.locked[0],
  },
  {
    id: "locked",
    title: "¡Viñeta bloqueada!",
    why: "Cuando una viñeta es correcta se bloquea con un 🔒 y aparece su relato. Queda fija: no hay que volver a probarla. «Reproducir» ahora solo prueba las que faltan.",
    targets: [],
    met: (c) => c.done.has("locked"),
  },
  {
    id: "hint",
    title: "Pedir una pista",
    why: "Si no sabés qué va en una viñeta, usá «Pista». La primera te da el guion de esa viñeta (qué pasa), la segunda el lugar y la tercera los personajes. En el juego real, pedir pistas hace perder el bonus de puntos.",
    action: "Tocá «Pista» para leer el guion de la viñeta 2.",
    targets: ["clue"],
    met: ({ s }) => s.hints >= 1,
  },
  {
    id: "b1",
    title: "Viñeta 2 · probá equivocarte",
    why: `El guion habla del gol. ${WRONG} Vas a poner un lugar incorrecto a propósito.`,
    action: "Arrastrá (o tocá) «La cancha» hasta la viñeta 2.",
    targets: [`setting:${CANCHA}`, "panel:1"],
    met: ({ s, done }) => done.has("wrong") || s.slots[1].setting === CANCHA,
  },
  {
    id: "b2",
    title: "Viñeta 2 · el personaje",
    why: "Quien hizo el gol fue Antonio Alzamendi.",
    action: "Arrastrá (o tocá) a «Alzamendi» hasta la viñeta 2.",
    targets: ["cast:Antonio Alzamendi", "panel:1"],
    met: ({ s, done }) => done.has("wrong") || sameCast(cast(s, 1), ["Antonio Alzamendi"]),
  },
  {
    id: "b3",
    title: "Reproducir otra vez",
    why: "El personaje es el correcto, pero el lugar no. Veamos qué te dice el juego.",
    action: "Tocá «Reproducir».",
    targets: ["play"],
    met: ({ done }) => done.has("wrong"),
  },
  {
    id: "cartel",
    title: "Leé el cartel de la viñeta",
    why: "Debajo de la viñeta 2 el cartel te dice qué está bien y qué falta: si el reparto es correcto, si el lugar no es ese, cuántos personajes están bien, cuáles faltan o sobran, o si la escena existe pero va en otro momento.",
    targets: [],
    met: (c) => c.done.has("cartel"),
  },
  {
    id: "f1",
    title: "Corregí el lugar",
    why: "Las pistas dicen que el reparto está bien: lo que falla es el lugar. La final se jugó en Tokio.",
    action: `Arrastrá (o tocá) «${TOKIO}» hasta la viñeta 2.`,
    targets: [`setting:${TOKIO}`, "panel:1"],
    met: ({ s }) => s.slots[1].setting === TOKIO,
  },
  {
    id: "f2",
    optional: true,
    title: "Volvé a poner al goleador",
    why: "La viñeta 2 necesita a quien hizo el gol.",
    action: "Arrastrá (o tocá) a «Alzamendi» hasta la viñeta 2.",
    targets: ["cast:Antonio Alzamendi", "panel:1"],
    met: ({ s }) => sameCast(cast(s, 1), ["Antonio Alzamendi"]),
  },
  {
    id: "f3",
    title: "Reproducir de nuevo",
    why: "Si ahora cuenta bien la historia, se bloquea la última viñeta y la escena queda resuelta.",
    action: "Tocá «Reproducir».",
    targets: ["play"],
    met: ({ s }) => s.solved,
  },
  {
    id: "end",
    title: "¡Lo lograste!",
    why: "Con todas las viñetas bloqueadas, la escena está resuelta y ganás puntos (más si no usás pistas ni te equivocás). Tres cosas más: podés mover una viñeta entera agarrándola de su número ⠿ (o manteniéndola apretada) y soltándola sobre otra; las escenas se pueden jugar en cualquier orden; y siempre podés reiniciar una escena para volver a jugarla.",
    targets: [],
    met: () => false,
  },
];

const LAST = STEPS.length - 1;
/** Pasos que se cuentan en "Paso n de N" (los opcionales no). */
const COUNTED = STEPS.filter((x) => !x.optional);

/** El paso actual: el primero sin cumplir. Si la escena ya está resuelta, el cierre. */
export function currentStep(c: Ctx | null): number {
  if (!c) return 0;
  if (c.s.solved) return LAST;
  const i = STEPS.findIndex((st) => !st.met(c));
  return i < 0 ? LAST : i;
}

export function Tutorial({ onFinish }: { onFinish: () => void }) {
  const scene = useMemo(buildScene, []);
  const [state, setState] = useState<SceneState | null>(null);
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [run, setRun] = useState(0);
  const era = eras.find((e) => e.id === scene?.eraId) ?? eras[0];

  // Logros que no se pierden aunque el jugador después cambie el estado.
  useEffect(() => {
    if (!state) return;
    const add: string[] = [];
    if (state.locked[0]) add.push("lock0");
    if (state.attempts >= 2 && state.analysis && state.analysis[1] && state.analysis[1].verdict !== "exact") add.push("wrong");
    if (add.some((k) => !done.has(k))) setDone((d) => new Set([...d, ...add]));
  }, [state, done]);

  if (!scene) return <p className="comic-box">El tutorial no está disponible.</p>;

  const idx = currentStep(state ? { s: state, done } : { s: EMPTY, done });
  const cur = STEPS[idx];
  const isInfo = !cur.action;
  const last = idx === LAST;
  const ack = (id: string) => setDone((d) => new Set([...d, id]));
  const finish = () => { markDone(); onFinish(); };
  const restart = () => { setRun((r) => r + 1); setDone(new Set()); setState(null); };
  const allow = cur.targets.map((t) => `.tut-scope [data-tut="${t}"], .tut-scope [data-tut="${t}"] *`).join(",");
  const highlight = cur.targets.map((t) => `.tut-scope [data-tut="${t}"]`).join(",");
  const number = COUNTED.indexOf(cur) >= 0 ? COUNTED.indexOf(cur) + 1 : COUNTED.filter((x) => STEPS.indexOf(x) < idx).length + 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Todo lo de la escena queda bloqueado y atenuado, salvo lo que este paso pide tocar. */}
      {!last && <style>{`
        .tut-scope button, .tut-scope [role="button"], .tut-scope [data-tut], .tut-scope [data-drop] { pointer-events: none !important; ${cur.action ? "opacity: .3;" : ""} }
        ${allow ? `${allow} { pointer-events: auto !important; opacity: 1 !important; }` : ""}
        ${highlight ? `${highlight} { outline: 4px solid #2563eb; outline-offset: 2px; animation: tut-pulse 1s ease-in-out infinite; }` : ""}
      `}</style>}
      <div className="sticky top-2 z-30 border-4 border-ink bg-white p-3 shadow-[4px_4px_0_#111]" role="status" aria-live="polite">
        <div className="flex items-center justify-between text-xs font-bold uppercase text-river">
          <span>Tutorial · paso {Math.min(number, COUNTED.length)} de {COUNTED.length}</span>
          <button className="underline" onClick={finish}>Saltar tutorial</button>
        </div>
        <div className="my-1 h-1.5 border border-ink bg-neutral-200"><div className="h-full bg-river transition-all" style={{ width: `${(Math.min(number, COUNTED.length) / COUNTED.length) * 100}%` }} /></div>
        <p className="font-display text-xl leading-none">{cur.title}</p>
        <p className="mt-1 text-[13px] font-semibold leading-snug">{cur.why}</p>
        {cur.action && <p className="mt-1.5 border-2 border-blue-600 bg-blue-50 p-1.5 text-[13px] font-extrabold leading-snug">👉 {cur.action}</p>}
        {cur.action && <p className="mt-1 text-[11px] font-semibold text-neutral-600">Por ahora solo se puede tocar lo marcado en azul. Si algo sale mal, se puede deshacer y la guía te lleva de nuevo al paso que corresponde.</p>}
        {isInfo && (
          <button className="btn mt-2 w-full !py-2" onClick={last ? finish : () => ack(cur.id)}>
            {last ? "¡A jugar!" : "Entendido"}
          </button>
        )}
        {!last && (
          <div className="mt-1 text-xs font-bold underline">
            <button onClick={restart}>Reiniciar práctica</button>
          </div>
        )}
      </div>
      <div className="tut-scope">
        <ComicScene
          key={run}
          era={era} scene={scene} index={0} total={1}
          practice fixedPieces={FIXED} onState={setState}
          onNext={finish} nextLabel="Terminar tutorial ▶"
          onReplay={restart}
        />
      </div>
    </div>
  );
}

const EMPTY: SceneState = {
  slots: [{ setting: null, cast: [] }, { setting: null, cast: [] }],
  locked: [false, false], attempts: 0, analysis: null, solved: false, hints: 0,
};
