import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Era, Panel, Scene } from "../lib/schema";
import { scenes as allScenes } from "../lib/content";
import { isCorrect } from "../lib/game";
import { isRivalName } from "../lib/characters";
import {
  MAX_CLUE, analyze, buildPieces, buildRegistry, clue, emptySlots, summary, toggleCast,
  type Analysis, type Slot, type Verdict,
} from "../lib/puzzle";
import { useDrag, type Payload } from "../lib/useDrag";
import { useGame } from "../lib/store";
import { Backdrop } from "./Backdrop";
import { Figure, type Mood } from "./Figure";

const registry = buildRegistry(allScenes);
const BUBBLE: Record<Panel["tone"], string> = {
  calma: "bg-sky-100", tension: "bg-amber-200", drama: "bg-neutral-300", gloria: "bg-yellow-200",
};
const BUBBLE_VERDICT: Record<Verdict, string> = {
  exact: "bg-green-100", duplicate: "bg-sky-100", swapped: "bg-amber-100", "other-moment": "bg-amber-100",
  partial: "bg-orange-100", mismatch: "bg-red-50", empty: "bg-neutral-100",
};
/** Cómo reacciona un personaje según el momento de la historia (tono de la viñeta). */
const REACT: Record<Panel["tone"], { mood: Mood; say: string }> = {
  gloria: { mood: "gloria", say: "¡Vamos!" },
  tension: { mood: "tension", say: "¡Ojo!" },
  drama: { mood: "drama", say: "Qué golpe…" },
  calma: { mood: "calma", say: "Tranqui" },
};

type Reaction = { panel: number; key: number } | null;

function PanelView({
  index, tone, slot, locked, active, over, playing, reacting, scene, drag, onClear,
}: {
  index: number; tone: Panel["tone"]; slot: Slot; locked: boolean; active: boolean; over: boolean; playing: boolean;
  reacting: boolean; scene: Scene; drag: ReturnType<typeof useDrag>;
  onClear: () => void;
}) {
  const kind = slot.setting ? registry.settings.get(slot.setting) : undefined;
  const clash = playing && slot.cast.some(isRivalName) && slot.cast.some((c) => !isRivalName(c));
  const mood: Mood = locked || playing || reacting ? REACT[tone].mood : "idle";
  return (
    <div
      data-drop={locked ? undefined : index}
      data-tut={`panel:${index}`}
      role="button" tabIndex={0}
      {...(locked ? {} : drag.bind({ kind: "panel", value: index }, "auto", 280))}
      className={`comic-panel ${locked ? "" : "cursor-grab"} ${active ? "ring-4 ring-river" : ""} ${over ? "ring-4 ring-blue-600 scale-[1.03]" : ""} ${locked ? "outline outline-4 outline-green-600" : ""} transition-transform`}
      aria-label={`Viñeta ${index + 1}${locked ? " (correcta)" : ""}`}
    >
      {kind ? (
        <motion.div key={slot.setting} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Backdrop kind={kind} label={slot.setting ?? ""} tone={locked || playing || reacting ? tone : "calma"} />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-white/70" />
      )}
      {locked ? (
        <span className="panel-num bg-green-700">🔒 {index + 1}</span>
      ) : (
        <span
          {...drag.bind({ kind: "panel", value: index })}
          onPointerDown={(e) => { e.stopPropagation(); drag.bind({ kind: "panel", value: index }).onPointerDown(e); }}
          className="panel-num z-30 cursor-grab !px-2 !py-1 !text-lg"
          title="Arrastrá para mover la viñeta entera"
          aria-label={`Mover viñeta ${index + 1}`}
        >
          ⠿ {index + 1}
        </span>
      )}
      {slot.setting && <span className="absolute right-1 top-1 z-10 border-2 border-ink bg-white px-1 text-[10px] font-extrabold uppercase">{slot.setting}</span>}
      {!locked && (slot.cast.length > 0 || slot.setting) && (
        <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onClear(); }} aria-label="Vaciar viñeta" className="absolute bottom-1 right-1 z-30 border-2 border-ink bg-white px-1 text-xs font-bold">✕</button>
      )}
      {reacting && (
        <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute left-8 top-6 z-20 rounded-xl border-2 border-ink bg-white px-2 py-0.5 text-xs font-extrabold">
          {REACT[tone].say}
        </motion.span>
      )}
      <div className="relative z-[1] flex min-h-32 flex-1 items-end justify-center gap-0 px-1 pt-8">
        {slot.cast.length === 0 && <span className="m-auto font-display text-3xl text-ink/40">{slot.setting ? "¿quién?" : "¿dónde y quién?"}</span>}
        {slot.cast.map((c, i) => (
          <motion.div
            key={c}
            initial={{ y: -40, opacity: 0, scale: 0.7 }}
            animate={clash ? { x: [0, isRivalName(c) ? -12 : 12, 0], y: 0, opacity: 1, scale: 1 } : { y: 0, opacity: 1, scale: 1 }}
            transition={clash ? { repeat: 2, duration: 0.5, delay: i * 0.1 } : { type: "spring", stiffness: 300, damping: 18 }}
            {...(locked ? {} : drag.bind({ kind: "cast", value: c, from: index }))}
            onPointerDown={locked ? undefined : (e) => { e.stopPropagation(); drag.bind({ kind: "cast", value: c, from: index }).onPointerDown(e); }}
            onClick={(e) => e.stopPropagation()}
            title={locked ? c : `${c} — tocá para sacar, o arrastrá a otra viñeta`}
            className="flex flex-col items-center"
          >
            <Figure name={c} sceneId={scene.id} mood={mood} size={46} />
            <span className="-mt-1 max-w-16 truncate border border-ink bg-white px-0.5 text-[9px] font-bold leading-tight">{c.split(" ").slice(-1)[0]}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export type SceneState = { slots: Slot[]; locked: boolean[]; attempts: number; analysis: Analysis[] | null; solved: boolean; hints: number };

export function ComicScene({ era, scene, index, total, onNext, onReplay, practice = false, fixedPieces, onState, nextLabel }: {
  era: Era; scene: Scene; index: number; total: number; onNext: () => void; onReplay: () => void;
  /** Modo práctica (tutorial): no suma puntos ni guarda progreso. */
  practice?: boolean;
  fixedPieces?: { settings: string[]; cast: string[] };
  onState?: (s: SceneState) => void;
  nextLabel?: string;
}) {
  const { completed, result, answer } = useGame();
  const panels = scene.panels;
  const n = panels?.length ?? 0;
  const alreadyDone = scene.id in completed;
  const pieces = useMemo(() => fixedPieces ?? buildPieces(scene, registry), [scene, fixedPieces]);
  const [slots, setSlots] = useState<Slot[]>(() => (panels && alreadyDone ? panels.map((p) => ({ setting: p.setting.label, cast: [...p.figures] })) : emptySlots(n)));
  const [locked, setLocked] = useState<boolean[]>(() => Array(n).fill(alreadyDone));
  const [active, setActive] = useState(0);
  const [result_, setResult] = useState<Analysis[] | null>(null);
  const [played, setPlayed] = useState<Analysis[] | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState(false);
  const [clues, setClues] = useState<Record<number, number>>({});
  const [reaction, setReaction] = useState<Reaction>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [year, setYear] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const solved = n > 0 && locked.every(Boolean);
  useEffect(() => {
    onState?.({ slots, locked, attempts, analysis: result_, solved, hints: Object.values(clues).reduce((a, b) => a + b, 0) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, locked, attempts, result_, solved, clues]);
  const busy = playing !== null;
  const c = scene.challenge;
  const quizKey = `${scene.id}:q`;
  const quizDone = quizKey in completed;
  const quizAnswered = quizDone || pick !== null;
  const firstFree = (from = 0) => { const k = locked.findIndex((l, j) => j >= from && !l); return k >= 0 ? k : locked.findIndex((l) => !l); };

  const react = (panel: number) => {
    setReaction({ panel, key: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReaction(null), 1700);
  };
  const change = (i: number, fn: (s: Slot) => Slot) => {
    if (locked[i] || busy) return;
    setResult(null);
    setSlots((cur) => cur.map((s, j) => (j === i ? fn(s) : s)));
  };
  const addCast = (i: number, name: string) => {
    if (locked[i] || slots[i].cast.includes(name)) return;
    change(i, (s) => toggleCast(s, name));
    setActive(i);
    react(i);
  };
  const putSetting = (i: number, name: string) => {
    if (locked[i]) return;
    change(i, (s) => ({ ...s, setting: name }));
    setActive(i);
    react(i);
  };
  const swap = (a: number, b: number) => {
    if (a === b || locked[a] || locked[b] || busy) return;
    setResult(null);
    setSlots((cur) => cur.map((s, j) => (j === a ? cur[b] : j === b ? cur[a] : s)));
    setActive(b);
  };

  const drag = useDrag({
    onTap: (p: Payload) => {
      if (p.kind === "setting") change(active, (s) => ({ ...s, setting: s.setting === p.value ? null : p.value }));
      if (p.kind === "setting" && slots[active]?.setting !== p.value) react(active);
      if (p.kind === "cast") {
        if (p.from !== undefined) change(p.from, (s) => ({ ...s, cast: s.cast.filter((x) => x !== p.value) }));
        else if (slots[active]?.cast.includes(p.value)) change(active, (s) => toggleCast(s, p.value));
        else addCast(active, p.value);
      }
      if (p.kind === "panel") setActive(p.value);
    },
    onDrop: (p: Payload, target: number | null) => {
      if (p.kind === "panel") return target !== null ? swap(p.value, target) : undefined;
      if (p.kind === "setting") return target !== null ? putSetting(target, p.value) : undefined;
      if (p.from !== undefined && p.from !== target) change(p.from, (s) => ({ ...s, cast: s.cast.filter((x) => x !== p.value) }));
      if (target !== null && target !== p.from) addCast(target, p.value);
    },
  });

  if (!panels) {
    return (
      <div className="flex flex-col gap-3">
        <div className="comic-title">{scene.title}</div>
        <p className="comic-box">Esta escena todavía no tiene tira de cómic.</p>
        <button className="btn" onClick={() => { useGame.getState().complete(scene.id); onNext(); }}>Siguiente</button>
      </div>
    );
  }

  const play = async () => {
    const an = analyze(panels, slots);
    const v = an.map((a) => a.verdict);
    setPlayed(an);
    setResult(null);
    for (let i = 0; i < n; i++) {
      if (locked[i] || v[i] === "empty") continue;
      setPlaying(i);
      setActive(i);
      await new Promise((r) => setTimeout(r, 1500));
    }
    setPlaying(null);
    setResult(an);
    setAttempts((a) => a + 1);
    const nextLocked = locked.map((l, i) => l || v[i] === "exact");
    setLocked(nextLocked);
    if (nextLocked.every(Boolean)) {
      if (!practice) result(scene.id, attempts === 0 && !hint);
    } else {
      const k = nextLocked.findIndex((l, i) => !l && v[i] !== "exact");
      if (k >= 0) setActive(k);
    }
  };

  const bubble = (i: number): { text: string; kind: Verdict } | null => {
    if (locked[i]) return { text: panels[i].caption, kind: "exact" };
    const a = result_?.[i] ?? (playing !== null && i <= playing ? played?.[i] : undefined);
    return a ? { text: a.message, kind: a.verdict } : null;
  };
  const askClue = () => {
    const at = locked[active] ? firstFree() : active;
    if (at < 0) return;
    setHint(true);
    setActive(at);
    const level = (clues[at] ?? 0) + 1;
    if (level <= MAX_CLUE) setClues({ ...clues, [at]: level });
  };
  const submitQuiz = (k: number) => {
    if (!c || pick !== null || quizDone) return;
    setPick(k);
    answer(quizKey, c, k);
  };

  const cur = slots[active] ?? slots[0];
  const activeFree = !locked[active];
  const nothingToPlay = slots.every((s, i) => locked[i] || (s.setting === null && s.cast.length === 0));
  const lockedCount = locked.filter(Boolean).length;
  const verdicts = result_ ? result_.map((a) => a.verdict) : null;

  return (
    <div className="flex flex-col gap-4">
      {!practice && (
        <>
      <div className="h-3 overflow-hidden border-2 border-ink bg-white">
          <div className="h-full bg-river transition-all" style={{ width: `${((index + lockedCount / n) / total) * 100}%` }} />
        </div>
        <div className="comic-title">
          <small>{era.name} · {scene.date}</small>
          {scene.title}
        </div>
        {!scene.verified && <p className="comic-box text-xs">⚠️ Sin verificar (solo visible en desarrollo)</p>}
        {!solved && (
          <>
            <p className="comic-box">
              <span className="font-extrabold">Objetivo: {scene.headline}</span>
              <span className="mt-1 block text-xs font-semibold">Arrastrá o tocá lugares y personajes hacia las viñetas. Para mover una viñeta entera, agarrala del número ⠿ (o mantenela apretada) y soltala sobre otra. Las correctas se bloquean.</span>
            </p>
            <button className="text-left text-sm font-bold underline" onClick={() => setHint(true)}>
              📖 {hint ? "Libro de historia (pista usada)" : "Abrir el libro de historia (pierde el bonus)"}
            </button>
            {hint && <p className="comic-box text-sm">{scene.description}</p>}
          </>
        )}
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        {panels.map((p, i) => {
          const b = bubble(i);
          return (
            <div key={i} className={n === 3 && i === 2 ? "col-span-2" : ""}>
              <PanelView
                index={i} tone={p.tone} slot={slots[i]} locked={locked[i]} active={!solved && active === i}
                over={drag.over === i && drag.ghost !== null}
                playing={playing === i} reacting={reaction?.panel === i} scene={scene} drag={drag}
                onClear={() => change(i, () => ({ setting: null, cast: [] }))}
              />
              {b && (
                <motion.p
                  key={`${b.kind}-${b.text}`}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-1 border-2 border-ink p-1.5 text-xs font-semibold ${locked[i] ? BUBBLE[p.tone] : BUBBLE_VERDICT[b.kind]}`}
                >
                  {b.text}
                </motion.p>
              )}
            </div>
          );
        })}
      </div>

      {!solved && (
        <>
          <section className="comic-box sticky bottom-2 z-20 flex flex-col gap-1 p-2">
            <p className="font-display text-lg leading-none">Lugares {activeFree && <span className="text-xs font-sans">→ viñeta {active + 1}</span>}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pieces.settings.map((st) => (
                <div key={st} data-tut={`setting:${st}`} {...drag.bind({ kind: "setting", value: st }, "pan-x")} role="button" tabIndex={0}
                  className={`relative h-12 w-20 shrink-0 select-none overflow-hidden border-2 border-ink ${cur.setting === st && activeFree ? "ring-4 ring-river" : ""}`}>
                  <Backdrop kind={registry.settings.get(st) ?? "cancha"} label={st} />
                  <span className="absolute inset-x-0 bottom-0 bg-white/90 px-0.5 text-center text-[10px] font-extrabold uppercase leading-tight">{st}</span>
                </div>
              ))}
            </div>
            <p className="font-display text-lg leading-none">Personajes <span className="text-xs font-sans">(máx. 3 por viñeta)</span></p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pieces.cast.map((nm) => (
                <div key={nm} data-tut={`cast:${nm}`} {...drag.bind({ kind: "cast", value: nm }, "pan-x")} role="button" tabIndex={0} title={nm}
                  className={`flex w-16 shrink-0 select-none flex-col items-center border-2 border-ink bg-white px-0.5 pt-1 ${cur.cast.includes(nm) && activeFree ? "ring-4 ring-river" : ""}`}>
                  <Figure name={nm} sceneId={scene.id} size={30} />
                  <span className="w-full truncate text-center text-[10px] font-bold leading-tight">{nm.split(" ").slice(-1)[0]}</span>
                </div>
              ))}
            </div>
          </section>
          <button data-tut="play" className="btn" disabled={busy || nothingToPlay} onClick={play}>{busy ? "Reproduciendo…" : "▶ Reproducir lo que falta"}</button>
          <button data-tut="clue" className="btn-ghost text-sm" disabled={busy || firstFree() < 0 || (clues[locked[active] ? firstFree() : active] ?? 0) >= MAX_CLUE} onClick={askClue}>
            💡 {(clues[active] ?? 0) === 0 ? "Pista" : "Otra pista"} para la viñeta {(locked[active] ? firstFree() : active) + 1} (pierde el bonus)
          </button>
          {[...Array(clues[locked[active] ? firstFree() : active] ?? 0)].map((_, k) => (
            <p key={k} className="comic-box text-sm">{clue(panels[locked[active] ? firstFree() : active], (k + 1) as 1 | 2 | 3)}</p>
          ))}
          {attempts >= 3 && <p className="text-center text-sm font-semibold">¿Trabado? Las pistas te llevan viñeta por viñeta: primero el guion, después el lugar y el reparto.</p>}
          <button className="text-sm font-bold underline" disabled={busy} onClick={onReplay}>↻ Reiniciar esta escena</button>
          {verdicts && <p className="comic-box text-sm">{summary(verdicts)} Las correctas quedaron bloqueadas: ajustá solo las demás.</p>}
        </>
      )}

      {solved && (
        <>
          <p className="comic-box">{scene.description}</p>
          {c && !practice && (
            <section className="comic-box flex flex-col gap-2">
              <p className="font-display text-2xl">Pregunta extra</p>
              {c.type === "quiz" && <p className="font-semibold">{c.question}</p>}
              {c.type === "guess-year" && <p className="font-semibold">¿En qué año fue?</p>}
              {c.type === "who-scored" && <p className="font-semibold">¿Quién la metió?</p>}
              {c.type !== "guess-year" ? c.options.map((o, k) => (
                <button key={o} disabled={quizAnswered} onClick={() => submitQuiz(k)}
                  className={`border-2 p-2 text-left ${quizAnswered && k === c.answerIndex ? "border-green-700 bg-green-100" : pick === k ? "border-river bg-red-50" : "border-ink bg-white"}`}>{o}</button>
              )) : (
                <div className="flex gap-2">
                  <input inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} disabled={quizAnswered} aria-label="Año" placeholder="Año" className="w-full border-2 border-ink p-2" />
                  <button className="btn" disabled={quizAnswered || !/^\d{4}$/.test(year)} onClick={() => submitQuiz(Number(year))}>OK</button>
                </div>
              )}
              {quizAnswered && (
                <p className="text-sm">
                  {pick !== null && !isCorrect(c, pick) ? "No era esa. " : pick !== null ? "¡Bien! " : ""}
                  {c.type === "quiz" ? c.explanation : c.type === "guess-year" ? `Fue en ${c.correctYear}.` : ""}
                </p>
              )}
            </section>
          )}
          <button className="btn" disabled={!!c && !practice && !quizAnswered} onClick={onNext}>
            {nextLabel ?? (index + 1 < total ? "Siguiente tira ▶" : "Terminar época")}
          </button>
          {!practice && <button className="btn-ghost" onClick={onReplay}>↻ Jugar de nuevo esta escena</button>}
        </>
      )}

      {drag.ghost && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-3/4 opacity-90" style={{ left: drag.ghost.x, top: drag.ghost.y }}>
          {drag.ghost.payload.kind === "cast" && <Figure name={drag.ghost.payload.value} sceneId={scene.id} size={56} />}
          {drag.ghost.payload.kind === "setting" && (
            <div className="relative h-16 w-28 overflow-hidden border-2 border-ink shadow-lg">
              <Backdrop kind={registry.settings.get(drag.ghost.payload.value) ?? "cancha"} label={drag.ghost.payload.value} />
            </div>
          )}
          {drag.ghost.payload.kind === "panel" && (
            <div className="comic-title text-xl">
              Viñeta {drag.ghost.payload.value + 1}
              <small className="!mb-0 normal-case">{slots[drag.ghost.payload.value]?.setting ?? "sin lugar"} · {slots[drag.ghost.payload.value]?.cast.join(", ") || "sin personajes"}</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
