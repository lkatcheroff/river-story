import { scenes } from "./content";

/** Aspecto de cada personaje. Dibujos propios: camisetas por colores/diseño, sin escudos ni marcas. */
export type Pattern = "sash" | "solid" | "vstripes" | "hband" | "halves";
export type Kit = { pattern: Pattern; c1: string; c2: string; shorts: string; socks: string };
export type Kind = "player" | "coach" | "exec" | "press" | "crowd" | "team";
export type Look = {
  kind: Kind;
  kit: Kit;
  skin: string;
  hair: string;
  hairStyle: "short" | "curly" | "bald" | "long";
  label: string;
};

export const RIVER_KIT: Kit = { pattern: "sash", c1: "#ffffff", c2: "#d4101f", shorts: "#151515", socks: "#ffffff" };

const k = (pattern: Pattern, c1: string, c2: string, shorts: string, socks: string): Kit => ({ pattern, c1, c2, shorts, socks });
/** Colores de camiseta de cada rival (información pública de los clubes). */
const CLUB_KITS: Record<string, Kit> = {
  "Racing Club": k("vstripes", "#8fd0f2", "#ffffff", "#ffffff", "#8fd0f2"),
  "Boca Juniors": k("hband", "#0d3b8e", "#f5c518", "#0d3b8e", "#0d3b8e"),
  Independiente: k("solid", "#d4101f", "#d4101f", "#1a1a1a", "#d4101f"),
  "San Lorenzo": k("vstripes", "#0d3b8e", "#b0152b", "#0d3b8e", "#0d3b8e"),
  "Estudiantes de La Plata": k("vstripes", "#d4101f", "#ffffff", "#1a1a1a", "#d4101f"),
  Belgrano: k("solid", "#6ec1ea", "#6ec1ea", "#ffffff", "#6ec1ea"),
  Juventus: k("vstripes", "#111111", "#ffffff", "#ffffff", "#111111"),
  "Steaua Bucarest": k("solid", "#c8102e", "#c8102e", "#1c3f94", "#1c3f94"),
  "América de Cali": k("solid", "#c8102e", "#c8102e", "#ffffff", "#c8102e"),
  Cruzeiro: k("solid", "#1c4fa0", "#1c4fa0", "#ffffff", "#ffffff"),
  Peñarol: k("vstripes", "#f5c518", "#111111", "#111111", "#f5c518"),
  Tigres: k("hband", "#f5c518", "#1c3f94", "#1c3f94", "#f5c518"),
  "Atlético Nacional": k("vstripes", "#1f8a3b", "#ffffff", "#ffffff", "#1f8a3b"),
  "Vélez Sarsfield": k("sash", "#ffffff", "#1c3f94", "#ffffff", "#ffffff"),
  "Unión de Santa Fe": k("vstripes", "#d4101f", "#ffffff", "#111111", "#d4101f"),
  Platense: k("vstripes", "#7a4a2a", "#ffffff", "#7a4a2a", "#7a4a2a"),
  "Chacarita Juniors": k("vstripes", "#d4101f", "#111111", "#111111", "#d4101f"),
  Huracán: k("halves", "#ffffff", "#d4101f", "#ffffff", "#ffffff"),
  "Almirante Brown": k("vstripes", "#f5c518", "#111111", "#111111", "#f5c518"),
  "Argentinos Juniors": k("solid", "#d4101f", "#ffffff", "#ffffff", "#d4101f"),
  "Rosario Central": k("vstripes", "#1c4fa0", "#f5c518", "#1c4fa0", "#1c4fa0"),
  "São Paulo": k("hband", "#ffffff", "#d4101f", "#ffffff", "#ffffff"),
  Gremio: k("vstripes", "#1c9fd6", "#111111", "#ffffff", "#ffffff"),
  "Independiente Rivadavia": k("solid", "#1c4fa0", "#1c4fa0", "#1c4fa0", "#1c4fa0"),
  Atlanta: k("vstripes", "#1c4fa0", "#f5c518", "#1c4fa0", "#1c4fa0"),
  "Universidad de Chile": k("solid", "#1c4fa0", "#1c4fa0", "#1c4fa0", "#ffffff"),
};
const NEUTRAL_KIT = k("solid", "#6b6b7a", "#6b6b7a", "#333", "#6b6b7a");

/** Club de cada jugador rival según las escenas. El resto de los nombres personales son de River. */
const PLAYER_CLUB: Record<string, string> = {
  "Alberto Spencer": "Peñarol",
  "César Mansanelli": "Belgrano",
  "César Pereyra": "Belgrano",
  "Guillermo Farré": "Belgrano",
  "Darío Benedetto": "Boca Juniors",
  "Mario Boyé": "Boca Juniors",
};

const COACHES = new Set(["Renato Cesarini", "Héctor Veira", "Ramón Díaz"]);
/** Gallardo: jugador hasta 2009 y director técnico desde 2014. */
const COACH_FROM_YEAR: Record<string, number> = { "Marcelo Gallardo": 2014 };
/** Ángel Labruna: jugador en los años 30/40 y director técnico desde 1975. */
const COACH_BY_SCENE: Record<string, string[]> = {
  /** Matías Almeyda: jugador en los años 90 y técnico en el ascenso de 2012. */
  "Matías Almeyda": ["ascenso-river-2012"],
  "Ángel Labruna": ["labruna-vuelve-1975", "metropolitano-1975", "nacional-1975", "balance-labruna"],
};
const EXECS = new Set(["Antonio Vespucio Liberti"]);
const PRESS = new Set(["Borocotó"]);

export const TEAM_NAMES = new Set(["River", "River Plate", ...Object.keys(CLUB_KITS)]);

const SKINS = ["#f3d2a8", "#e8b98a", "#d79c6e", "#b97b52"];
const HAIRS = ["#1b1b1b", "#3a2616", "#6b4423", "#a67c3d", "#7d7d7d"];
const STYLES: Look["hairStyle"][] = ["short", "short", "curly", "long", "bald"];
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const sceneYear = (sceneId: string) => Number.parseInt(scenes.find((s) => s.id === sceneId)?.date ?? "", 10);

export function lookFor(name: string, sceneId = ""): Look {
  const h = hash(name);
  const base = { skin: SKINS[h % SKINS.length], hair: HAIRS[(h >> 3) % HAIRS.length], hairStyle: STYLES[(h >> 5) % STYLES.length], label: name };
  if (name === "Hinchas") return { ...base, kind: "crowd", kit: RIVER_KIT };
  if (TEAM_NAMES.has(name)) return { ...base, kind: "team", kit: name.startsWith("River") ? RIVER_KIT : CLUB_KITS[name] ?? NEUTRAL_KIT };
  if (EXECS.has(name)) return { ...base, kind: "exec", kit: k("solid", "#243b63", "#243b63", "#243b63", "#111") };
  if (PRESS.has(name)) return { ...base, kind: "press", kit: k("solid", "#8a6a3f", "#8a6a3f", "#4b3b24", "#111") };
  if (COACHES.has(name) || COACH_BY_SCENE[name]?.includes(sceneId) || (name in COACH_FROM_YEAR && sceneYear(sceneId) >= COACH_FROM_YEAR[name]))
    return { ...base, kind: "coach", kit: k("solid", "#2b2f3a", "#2b2f3a", "#2b2f3a", "#111") };
  const club = PLAYER_CLUB[name];
  return { ...base, kind: "player", kit: club ? CLUB_KITS[club] ?? NEUTRAL_KIT : RIVER_KIT };
}

/** ¿Está del lado del rival? (equipos rivales o jugadores de otros clubes) */
export const isRivalName = (name: string) =>
  (TEAM_NAMES.has(name) && !name.startsWith("River")) || name in PLAYER_CLUB;
