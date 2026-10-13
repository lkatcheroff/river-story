import { z } from "zod";
import { EraSchema, SceneSchema, type Scene } from "./schema";
import erasRaw from "../content/eras.json";

const files = import.meta.glob("../content/events/*.json", { eager: true, import: "default" });

export const eras = z.array(EraSchema).parse(erasRaw).sort((a, b) => a.order - b.order);

const all: Scene[] = Object.values(files).flatMap((f) => z.array(SceneSchema).parse(f));

/** En producción solo se renderizan escenas verified:true. */
export const scenes = all.filter((s) => import.meta.env.DEV || s.verified);

export const scenesForEra = (eraId: string) =>
  scenes.filter((s) => s.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
