import { useEffect, useMemo, useState } from "react";
import { scenes, eras } from "../lib/content";
import type { Scene } from "../lib/schema";
import { ComicScene, type SceneState } from "./ComicScene";

const TUTORIAL_SCENE_ID = "intercontinental-86-tokio";
const TOKIO = "Estadio Nacional de Tokio";
const FIXED = { settings: ["La cancha", TOKIO, "La tribuna"], cast: ["River", "Steaua Bucarest", "Antonio Alzamendi", "Hinchas"] };

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

type Step = {
  title: string;
  text: string;
  targets: string[];
  /** Condición para pasar sola al siguiente paso. Sin condición = botón "Entendido". */
  done?: (s: SceneState) => boolean;
};

const sameCast = (a: string[], b: string[]) => a.length === b.length && b.every((x) => a.includes(x));

const STEPS: Step[] = [
  {
    title: "¡Bienvenido a River Story!",
    text: "Cada escena es una tira de cómic con viñetas vacías. Tu misión: contar la historia real poniendo en cada viñeta el LUGAR y los PERSONAJES correctos. Vamos con un ejemplo corto: la final del mundo de 1986.",
    targets: [],
  },
  {
    title: "1 · Elegí el lugar",
    text: `Abajo están los lugares. Arrastrá (o tocá) «${TOKIO}» hasta la viñeta 1. Si lo tocás, se pone en la viñeta marcada.`,
    targets: [`setting:${TOKIO}`, "panel:0"],
    done: (s) => s.slots[0].setting === TOKIO,
  },
  {
    title: "2 · Sumá personajes",
    text: "Ahora los protagonistas de esa viñeta: River y el Steaua Bucarest, el rival de esa final. Arrastralos (o tocalos) a la viñeta 1. Si te equivocás, tocá un personaje dentro de la viñeta para sacarlo.",
    targets: ["cast:River", "cast:Steaua Bucarest", "panel:0"],
    done: (s) => sameCast(s.slots[0].cast, ["River", "Steaua Bucarest"]),
  },
  {
    title: "3 · Reproducí",
    text: "Apretá «Reproducir» para ver si la viñeta cuenta bien la historia.",
    targets: ["play"],
    done: (s) => s.locked[0],
  },
  {
    title: "¡Viñeta bloqueada!",
    text: "Cuando una viñeta es correcta se bloquea con el 🔒 y aparece su relato. No hay que volver a probarla. Ahora la viñeta 2 trata del gol. Probá a propósito con «La cancha» y «Antonio Alzamendi», y reproducí: vas a ver cómo te ayuda el juego cuando algo no cierra.",
    targets: ["setting:La cancha", "cast:Antonio Alzamendi", "play"],
    done: (s) => s.attempts >= 2 && !s.solved,
  },
  {
    title: "Leé las pistas",
    text: "Debajo de la viñeta, el cartel te dice qué está bien y qué falta: si el lugar es correcto, cuántos personajes están bien, y si algo sobra o va en otro momento. Corregí el lugar de la viñeta 2 y reproducí otra vez.",
    targets: [`setting:${TOKIO}`, "play"],
    done: (s) => s.solved,
  },
  {
    title: "¡Lo lograste!",
    text: "Cuando se bloquean todas las viñetas, la escena está resuelta. Si te trabás, el botón «Pista» te da primero el guion, después el lugar y después los personajes (pierde el bonus). También podés mover una viñeta agarrándola del número. ¡A jugar!",
    targets: [],
  },
];

export function Tutorial({ onFinish }: { onFinish: () => void }) {
  const scene = useMemo(buildScene, []);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<SceneState | null>(null);
  const [run, setRun] = useState(0);
  const era = eras.find((e) => e.id === scene?.eraId) ?? eras[0];

  if (!scene) return <p className="comic-box">El tutorial no está disponible.</p>;

  const cur = STEPS[Math.min(step, STEPS.length - 1)];
  const last = step >= STEPS.length - 1;
  // Avanza sola cuando se cumple la condición del paso (incluso si ya se cumplía al llegar).
  useEffect(() => {
    if (!state) return;
    if (state.solved && step < STEPS.length - 1) setStep(STEPS.length - 1);
    else if (STEPS[step]?.done?.(state)) setStep((x) => Math.min(x + 1, STEPS.length - 1));
  }, [state, step]);
  const finish = () => { markDone(); onFinish(); };
  const css = cur.targets.map((t) => `[data-tut="${t}"]`).join(",");

  return (
    <div className="flex flex-col gap-3">
      {css && <style>{`${css}{outline:4px solid #2563eb;outline-offset:2px;animation:tut-pulse 1s ease-in-out infinite}`}</style>}
      <div className="sticky top-2 z-30 border-4 border-ink bg-white p-3 shadow-[4px_4px_0_#111]" role="status" aria-live="polite">
        <div className="flex items-center justify-between text-xs font-bold uppercase text-river">
          <span>Tutorial · paso {Math.min(step + 1, STEPS.length)} de {STEPS.length}</span>
          <button className="underline" onClick={finish}>Saltar tutorial</button>
        </div>
        <p className="font-display text-xl leading-none">{cur.title}</p>
        <p className="mt-1 text-[13px] font-semibold leading-snug">{cur.text}</p>
        {!cur.done && (
          <button className="btn mt-2 w-full !py-2" onClick={last ? finish : () => setStep((x) => x + 1)}>
            {last ? "¡A jugar!" : "Entendido"}
          </button>
        )}
        {cur.done && (
          <button className="mt-2 text-xs font-bold underline" onClick={() => setStep((x) => x + 1)}>Saltar este paso</button>
        )}
      </div>
      <ComicScene
        key={run}
        era={era} scene={scene} index={0} total={1}
        practice fixedPieces={FIXED} onState={setState}
        onNext={finish} nextLabel="Terminar tutorial ▶"
        onReplay={() => { setRun((r) => r + 1); setStep(1); setState(null); }}
      />
    </div>
  );
}
