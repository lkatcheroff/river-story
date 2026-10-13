import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { EraSchema, SceneSchema } from "../src/lib/schema";

const dir = "src/content";
const eras = z.array(EraSchema).parse(JSON.parse(readFileSync(join(dir, "eras.json"), "utf8")));
const eraIds = new Set(eras.map((e) => e.id));
const errors: string[] = [];
const ids = new Set<string>();
let total = 0, verified = 0;

for (const f of readdirSync(join(dir, "events")).filter((f) => f.endsWith(".json"))) {
  const raw = JSON.parse(readFileSync(join(dir, "events", f), "utf8"));
  const parsed = z.array(SceneSchema).safeParse(raw);
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors.push(`${f}: ${i.path.join(".")} — ${i.message}`);
    continue;
  }
  for (const s of parsed.data) {
    total++;
    if (s.verified) verified++;
    if (ids.has(s.id)) errors.push(`${f}: id duplicado "${s.id}"`);
    ids.add(s.id);
    if (!eraIds.has(s.eraId)) errors.push(`${f}: ${s.id} — eraId desconocido "${s.eraId}"`);
    if (s.verified && s.sources.length < 2) console.warn(`warn: ${s.id} tiene <2 fuentes`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${total} escenas (${verified} verificadas, ${total - verified} pendientes)`);
