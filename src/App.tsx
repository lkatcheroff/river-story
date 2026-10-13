import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { eras, scenesForEra } from "./lib/content";
import { isEraComplete, isEraUnlocked } from "./lib/game";
import { useGame } from "./lib/store";
import type { Era, Scene } from "./lib/schema";
import { ComicScene } from "./components/ComicScene";

type View =
  | { name: "home" }
  | { name: "map" }
  | { name: "era"; eraId: string }
  | { name: "scene"; eraId: string; index: number }
  | { name: "summary"; eraId: string }
  | { name: "collection" }
  | { name: "about" };

type Go = ((v: View) => void) & { back: (fallback: View) => void; replace: (v: View) => void };

const toHash = (v: View): string => {
  switch (v.name) {
    case "home": return "#/";
    case "map": return "#/mapa";
    case "era": return `#/epoca/${v.eraId}`;
    case "scene": return `#/escena/${v.eraId}/${v.index}`;
    case "summary": return `#/resumen/${v.eraId}`;
    case "collection": return "#/album";
    case "about": return "#/acerca";
  }
};

/** Lee la vista desde la URL; si es inválida vuelve al inicio. */
const fromHash = (hash: string): View => {
  const [, page, a, b] = hash.split("/");
  const known = (id?: string) => !!id && eras.some((e) => e.id === id);
  if (page === "mapa") return { name: "map" };
  if (page === "epoca" && known(a)) return { name: "era", eraId: a };
  if (page === "escena" && known(a) && Number(b) >= 0 && Number(b) < scenesForEra(a).length) return { name: "scene", eraId: a, index: Number(b) };
  if (page === "resumen" && known(a)) return { name: "summary", eraId: a };
  if (page === "album") return { name: "collection" };
  if (page === "acerca") return { name: "about" };
  return { name: "home" };
};

const playable = eras.filter((e) => scenesForEra(e.id).length > 0);
const sceneIdsByEra = playable.map((e) => scenesForEra(e.id).map((s) => s.id));

function Hud() {
  const { score, streak } = useGame();
  return (
    <div className="flex justify-between text-sm font-semibold text-neutral-600">
      <span>⭐ {score} pts</span>
      <span>🔥 racha {streak}</span>
    </div>
  );
}

function Shell({ children, onBack, hud = true }: { children: React.ReactNode; onBack?: () => void; hud?: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4">
      <header className="flex items-center gap-3">
        {onBack && <button aria-label="Volver" onClick={onBack} className="text-2xl">←</button>}
        <div className="flex-1">{hud && <Hud />}</div>
      </header>
      <motion.div key={String(children && (children as { key?: string }).key)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col gap-4">
        {children}
      </motion.div>
    </main>
  );
}

function Home({ go }: { go: Go }) {
  return (
    <Shell hud={false}>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <h1 className="font-display text-7xl leading-none text-river">River<br />Story</h1>
        <p className="text-lg">Revivi la historia del Millonario, época por época. Proyecto de fans, sin fines comerciales.</p>
        <button className="btn" onClick={() => go({ name: "map" })}>Empezar</button>
        <button className="btn-ghost" onClick={() => go({ name: "collection" })}>Mi álbum</button>
        <button className="text-sm underline" onClick={() => go({ name: "about" })}>Acerca de / Fuentes</button>
      </div>
    </Shell>
  );
}

function EraMap({ go }: { go: Go }) {
  const completed = useGame((s) => s.completed);
  return (
    <Shell onBack={() => go.back({ name: "home" })}>
      <h2 className="font-display text-4xl">Línea de tiempo</h2>
      <ol className="flex flex-col gap-3 border-l-4 border-river pl-4">
        {playable.map((e, i) => {
          const unlocked = isEraUnlocked(i, sceneIdsByEra, completed);
          const done = isEraComplete(sceneIdsByEra[i], completed);
          const n = sceneIdsByEra[i].filter((id) => id in completed).length;
          return (
            <li key={e.id}>
              <button
                disabled={!unlocked}
                onClick={() => go({ name: "era", eraId: e.id })}
                className="w-full rounded-lg border-2 border-ink bg-white p-3 text-left disabled:opacity-40"
              >
                <div className="font-display text-2xl">{unlocked ? "" : "🔒 "}{e.name} {done && "✅"}</div>
                <div className="text-sm text-neutral-600">{e.range} · {n}/{sceneIdsByEra[i].length}</div>
              </button>
            </li>
          );
        })}
      </ol>
    </Shell>
  );
}

function EraScenes({ era, go }: { era: Era; go: Go }) {
  const completed = useGame((s) => s.completed);
  const scenes = scenesForEra(era.id);
  return (
    <Shell onBack={() => go.back({ name: "map" })}>
      <div className="comic-title"><small>{era.range}</small>{era.name}</div>
      <p className="text-sm font-semibold">Elegí la escena que quieras: no hace falta seguir el orden.</p>
      <ol className="flex flex-col gap-3">
        {scenes.map((s, i) => (
          <li key={s.id}>
            <div className="flex items-stretch gap-2">
              <button onClick={() => go({ name: "scene", eraId: era.id, index: i })} className="comic-card min-w-0 flex-1">
                <div className="font-display text-2xl">{s.id in completed ? (completed[s.id] ? "⭐ " : "✅ ") : ""}{s.title}</div>
                <div className="text-xs text-neutral-600">{s.date} · {s.headline}</div>
              </button>
              {s.id in completed && (
                <button
                  aria-label={`Jugar de nuevo ${s.title}`}
                  onClick={() => { useGame.getState().resetScene(s.id); go({ name: "scene", eraId: era.id, index: i }); }}
                  className="comic-card shrink-0 text-center text-xs font-extrabold uppercase"
                >↻<br />Jugar<br />de nuevo</button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

function SceneView({ era, scenes, index, go }: { era: Era; scenes: Scene[]; index: number; go: Go }) {
  const scene = scenes[index];
  const [run, setRun] = useState(0);
  const replay = () => {
    useGame.getState().resetScene(scene.id);
    setRun((r) => r + 1);
    window.scrollTo({ top: 0 });
  };
  const next = () =>
    go.replace(index + 1 < scenes.length ? { name: "scene", eraId: era.id, index: index + 1 } : { name: "summary", eraId: era.id });
  return (
    <Shell onBack={() => go.back({ name: "era", eraId: era.id })}>
      <ComicScene key={`${scene.id}-${run}`} onReplay={replay} era={era} scene={scene} index={index} total={scenes.length} onNext={next} />
    </Shell>
  );
}

function Summary({ era, go }: { era: Era; go: Go }) {
  const { completed, score } = useGame();
  const scenes = scenesForEra(era.id);
  const hits = scenes.filter((s) => completed[s.id]).length;
  const text = `Completé "${era.name}" en River Story: ${hits}/${scenes.length} aciertos, ${score} puntos. ¡Vamos River!`;
  const [copied, setCopied] = useState(false);
  return (
    <Shell onBack={() => go.back({ name: "map" })}>
      <h2 className="font-display text-5xl">{era.name}</h2>
      <p className="text-xl">{hits}/{scenes.length} aciertos · {score} pts</p>
      <ul className="list-disc pl-5">{scenes.map((s) => <li key={s.id}>{completed[s.id] ? "⭐" : "·"} {s.title}</li>)}</ul>
      <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { /* sin permiso */ } }}>
        {copied ? "¡Copiado!" : "Copiar resultado"}
      </button>
      <button className="btn-ghost" onClick={() => go.back({ name: "map" })}>Volver al mapa</button>
    </Shell>
  );
}

function Collection({ go }: { go: Go }) {
  const completed = useGame((s) => s.completed);
  return (
    <Shell onBack={() => go.back({ name: "home" })}>
      <h2 className="font-display text-4xl">Álbum de figuritas</h2>
      {playable.map((e) => {
        const ss = scenesForEra(e.id);
        return (
          <section key={e.id}>
            <h3 className="font-semibold">{e.name} ({ss.filter((s) => s.id in completed).length}/{ss.length})</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {ss.map((s) => (
                <div key={s.id} className={`flex aspect-[3/4] items-center justify-center rounded-lg border-2 p-1 text-center text-xs font-bold ${s.id in completed ? "border-river bg-white" : "border-dashed border-neutral-400 text-neutral-400"}`}>
                  {s.id in completed ? s.title : "?"}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </Shell>
  );
}

function About({ go }: { go: Go }) {
  const sources = useMemo(() => {
    const m = new Map<string, string>();
    eras.forEach((e) => scenesForEra(e.id).forEach((s) => s.sources.forEach((x) => m.set(x.url, x.label))));
    return [...m];
  }, []);
  return (
    <Shell hud={false} onBack={() => go.back({ name: "home" })}>
      <h2 className="font-display text-4xl">Acerca de</h2>
      <p>River Story es un proyecto de fans, sin fines comerciales ni vínculo oficial con el club. No usa escudos ni imágenes con copyright.</p>
      <h3 className="font-semibold">Fuentes</h3>
      <ul className="list-disc pl-5 text-sm">
        {sources.map(([url, label]) => <li key={url}><a className="underline" href={url} target="_blank" rel="noreferrer">{label}</a></li>)}
      </ul>
      <button className="text-sm underline" onClick={() => { if (confirm("¿Borrar todo tu progreso?")) useGame.getState().reset(); }}>Reiniciar progreso</button>
    </Shell>
  );
}

export default function App() {
  const [view, setView] = useState<View>(() => fromHash(window.location.hash));

  // Cada pantalla es una entrada del historial: "atrás" del celu o del navegador vuelve a la pantalla anterior.
  useEffect(() => {
    if (history.state?.idx === undefined) history.replaceState({ idx: 0 }, "", toHash(view));
    const onPop = () => { setView(fromHash(window.location.hash)); window.scrollTo({ top: 0 }); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useMemo<Go>(() => {
    const push = (v: View) => {
      history.pushState({ idx: (history.state?.idx ?? 0) + 1 }, "", toHash(v));
      setView(v);
      window.scrollTo({ top: 0 });
    };
    const replace = (v: View) => {
      history.replaceState({ idx: history.state?.idx ?? 0 }, "", toHash(v));
      setView(v);
      window.scrollTo({ top: 0 });
    };
    /** Flecha de la app: retrocede en el historial si hay pantalla anterior; si no (link directo), va al padre. */
    const back = (fallback: View) => ((history.state?.idx ?? 0) > 0 ? history.back() : replace(fallback));
    return Object.assign(push, { back, replace });
  }, []);

  const era = (id: string) => eras.find((e) => e.id === id)!;
  return (
    <AnimatePresence mode="wait">
      <div key={view.name + ("index" in view ? view.index : "")}>
        {view.name === "home" && <Home go={go} />}
        {view.name === "map" && <EraMap go={go} />}
        {view.name === "era" && <EraScenes era={era(view.eraId)} go={go} />}
        {view.name === "scene" && <SceneView era={era(view.eraId)} scenes={scenesForEra(view.eraId)} index={view.index} go={go} />}
        {view.name === "summary" && <Summary era={era(view.eraId)} go={go} />}
        {view.name === "collection" && <Collection go={go} />}
        {view.name === "about" && <About go={go} />}
      </div>
    </AnimatePresence>
  );
}
