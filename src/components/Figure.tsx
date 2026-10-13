import { useId } from "react";
import { lookFor, type Kit, type Look } from "../lib/characters";
import { GOAL_PIECE } from "../lib/schema";

export type Mood = "idle" | "calma" | "tension" | "drama" | "gloria";
import type { Pose } from "../lib/choreo";
export type { Pose };

const OUT = "#111";
const SW = 1.8;

function KitFill({ kit, id, d }: { kit: Kit; id: string; d: string }) {
  const clip = `${id}-clip`;
  return (
    <g>
      <defs><clipPath id={clip}><path d={d} /></clipPath></defs>
      <path d={d} fill={kit.c1} />
      <g clipPath={`url(#${clip})`}>
        {kit.pattern === "sash" && <polygon points="10,30 24,30 50,70 36,70" fill={kit.c2} />}
        {kit.pattern === "vstripes" && [0, 1, 2, 3, 4].map((i) => <rect key={i} x={14 + i * 8.4} y="30" width="4.2" height="42" fill={kit.c2} />)}
        {kit.pattern === "hband" && <rect x="10" y="46" width="42" height="10" fill={kit.c2} />}
        {kit.pattern === "halves" && <rect x="30" y="30" width="22" height="42" fill={kit.c2} />}
      </g>
      <path d={d} fill="none" stroke={OUT} strokeWidth={SW} />
    </g>
  );
}

const ARMS: Record<Mood, { l: string; r: string }> = {
  idle: { l: "M17 35 L10 58", r: "M43 35 L50 58" },
  calma: { l: "M17 35 L10 58", r: "M43 35 L50 58" },
  tension: { l: "M17 35 L8 52 L17 46", r: "M43 35 L52 52 L43 46" },
  drama: { l: "M17 35 L14 60", r: "M43 35 L46 60" },
  gloria: { l: "M17 35 L6 12", r: "M43 35 L54 12" },
};

function Face({ mood }: { mood: Mood }) {
  const mouth = mood === "gloria" ? "M26 22 Q30 28 34 22 Z" : mood === "drama" ? "M26 25 Q30 21 34 25" : mood === "tension" ? "M27 24 L33 24" : "M27 23 Q30 25 33 23";
  return (
    <g>
      <circle cx="26.5" cy="16" r="1.3" fill={OUT} />
      <circle cx="33.5" cy="16" r="1.3" fill={OUT} />
      {mood === "tension" && <path d="M24 12 L28 13.5 M36 12 L32 13.5" stroke={OUT} strokeWidth="1.3" />}
      {mood === "drama" && <path d="M24 13 L28 12 M36 13 L32 12" stroke={OUT} strokeWidth="1.3" />}
      <path d={mouth} fill={mood === "gloria" ? "#fff" : "none"} stroke={OUT} strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

function Hair({ look }: { look: Look }) {
  if (look.hairStyle === "bald") return null;
  const d = look.hairStyle === "long" ? "M19 16 C18 4 42 4 41 16 L43 28 L38 18 L22 18 L17 28 Z" : look.hairStyle === "curly" ? "M19 15 C16 6 22 3 26 6 C28 2 34 3 35 6 C40 4 44 10 41 15 L37 12 L23 12 Z" : "M19.5 14 C19 5 41 5 40.5 14 L37 11 L23 11 Z";
  return <path d={d} fill={look.hair} stroke={OUT} strokeWidth="1.2" />;
}

function Person({ look, mood, id, pose = "none" }: { look: Look; mood: Mood; id: string; pose?: Pose }) {
  const { kit } = look;
  const arms = pose === "wall" ? { l: "M17 35 L27 64", r: "M43 35 L33 64" } : pose === "header" ? { l: "M17 35 L8 52", r: "M43 35 L52 44" } : ARMS[mood];
  const legPose = pose === "kick" ? "rotate(-66 36 84)" : pose === "backheel" ? "rotate(62 36 84)" : pose === "dribble" ? "rotate(-26 36 84)" : undefined;
  const lean = pose === "header" ? "rotate(-13 30 104)" : pose === "dribble" ? "rotate(-7 30 104)" : pose === "kick" ? "rotate(5 30 104)" : undefined;
  const suit = look.kind === "coach" || look.kind === "exec" || look.kind === "press";
  const sleeve = suit ? kit.c1 : kit.c1 === "#ffffff" || kit.pattern === "sash" ? "#ffffff" : kit.c1;
  const torso = "M16 33 Q30 30 44 33 L43 70 L17 70 Z";
  const tilt = mood === "drama" ? "rotate(7 30 28)" : undefined;
  return (
    <g transform={lean}>
      {/* piernas */}
      {suit ? (
        <>
          <rect x="18" y="70" width="10" height="34" fill={kit.shorts} stroke={OUT} strokeWidth={SW} />
          <rect x="32" y="70" width="10" height="34" fill={kit.shorts} stroke={OUT} strokeWidth={SW} />
        </>
      ) : (
        <>
          <rect x="20" y="82" width="7" height="22" fill={look.skin} stroke={OUT} strokeWidth={SW} />
          <rect x="20" y="92" width="7" height="12" fill={kit.socks} stroke={OUT} strokeWidth={SW} />
          <g transform={legPose}>
            <rect x="33" y="82" width="7" height="22" fill={look.skin} stroke={OUT} strokeWidth={SW} />
            <rect x="33" y="92" width="7" height="12" fill={kit.socks} stroke={OUT} strokeWidth={SW} />
            <path d="M31 104 h11 l1 6 h-13 Z" fill={OUT} />
          </g>
          <path d="M17 70 H43 L41 85 H31 L30 78 L29 85 H19 Z" fill={kit.shorts} stroke={OUT} strokeWidth={SW} />
        </>
      )}
      <path d="M17 104 h11 l1 6 h-13 Z" fill={OUT} />
      {suit && <path d="M31 104 h11 l1 6 h-13 Z" fill={OUT} />}
      {/* brazos */}
      {[arms.l, arms.r].map((d, i) => (
        <g key={i}>
          <path d={d} stroke={OUT} strokeWidth="9.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={d} stroke={sleeve} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      ))}
      {/* torso */}
      {suit ? (
        <g>
          <path d={torso} fill={kit.c1} stroke={OUT} strokeWidth={SW} />
          <path d="M25 32 L30 46 L35 32 Z" fill="#fff" stroke={OUT} strokeWidth="1.2" />
          {look.kind === "coach" && <path d="M30 34 L28.5 46 L30 52 L31.5 46 Z" fill="#d4101f" stroke={OUT} strokeWidth="0.8" />}
        </g>
      ) : (
        <KitFill kit={kit} id={id} d={torso} />
      )}
      {/* manos */}
      {mood === "gloria" ? <><circle cx="6" cy="12" r="4" fill={look.skin} stroke={OUT} strokeWidth="1.4" /><circle cx="54" cy="12" r="4" fill={look.skin} stroke={OUT} strokeWidth="1.4" /></> : null}
      {/* cuello y cabeza */}
      <g transform={pose === "header" ? "translate(5 -1) rotate(-8 30 28)" : tilt}>
        <rect x="26" y="26" width="8" height="8" fill={look.skin} stroke={OUT} strokeWidth="1.4" />
        <circle cx="30" cy="17" r="11" fill={look.skin} stroke={OUT} strokeWidth={SW} />
        <Hair look={look} />
        {look.kind === "press" && <path d="M16 12 H44 L40 7 H20 Z M14 13 H46" fill="#5a4630" stroke={OUT} strokeWidth="1.4" />}
        <Face mood={mood} />
      </g>
    </g>
  );
}

function Crowd({ look, mood }: { look: Look; mood: Mood }) {
  const bust = (x: number, y: number, shirt: string, hair: string, flag?: string) => (
    <g transform={`translate(${x} ${y})`}>
      {flag && <><line x1="30" y1="-2" x2="30" y2="34" stroke={OUT} strokeWidth="2" /><path d="M30 -2 H52 V14 H30 Z" fill={flag} stroke={OUT} strokeWidth="1.5" /></>}
      <path d="M10 70 Q10 36 30 36 Q50 36 50 70 Z" fill={shirt} stroke={OUT} strokeWidth={SW} />
      <path d="M22 38 L30 48 L38 38 L38 44 L30 54 L22 44 Z" fill="#d4101f" stroke={OUT} strokeWidth="1" />
      <circle cx="30" cy="24" r="11" fill={look.skin} stroke={OUT} strokeWidth={SW} />
      <path d="M19.5 22 C19 11 41 11 40.5 22 L37 18 L23 18 Z" fill={hair} stroke={OUT} strokeWidth="1.2" />
      <Face mood={mood === "idle" ? "calma" : mood} />
    </g>
  );
  return (
    <g>
      {bust(-14, 40, "#ffffff", "#2a1b10")}
      {bust(34, 40, "#d4101f", "#6b4423", "#ffffff")}
      {bust(10, 32, "#ffffff", "#1b1b1b", "#d4101f")}
    </g>
  );
}

/** Personaje dibujado a mano. Los equipos se muestran como un grupo de tres jugadores. */
function Goal({ mood, keeper = "idle" }: { mood: Mood; keeper?: "idle" | "dive" | "beaten" }) {
  // Arco con red y arquero (guantes, camiseta verde). En festejo el arquero baja la cabeza.
  const sad = mood === "gloria";
  return (
    <g>
      <rect x="2" y="12" width="116" height="84" fill="#fff" stroke={OUT} strokeWidth="4" />
      {Array.from({ length: 10 }).map((_, i) => <line key={`v${i}`} x1={14 + i * 11} y1="12" x2={14 + i * 11} y2="96" stroke="#c9c9c9" strokeWidth="1.2" />)}
      {Array.from({ length: 6 }).map((_, i) => <line key={`h${i}`} x1="2" y1={26 + i * 12} x2="118" y2={26 + i * 12} stroke="#c9c9c9" strokeWidth="1.2" />)}
      <g transform={keeper === "dive" ? "translate(34 36) rotate(-72 30 60) scale(.62)" : keeper === "beaten" ? "translate(32 40) scale(.62)" : `translate(32 ${sad ? 30 : 22}) scale(.62)`}>
        <rect x="18" y="82" width="9" height="22" fill="#f3d2a8" stroke={OUT} strokeWidth={SW} />
        <rect x="33" y="82" width="9" height="22" fill="#f3d2a8" stroke={OUT} strokeWidth={SW} />
        <path d="M17 70 H43 L41 85 H19 Z" fill="#222" stroke={OUT} strokeWidth={SW} />
        <path d="M17 35 L6 12 M43 35 L54 12" stroke={OUT} strokeWidth="9.4" strokeLinecap="round" />
        <path d="M17 35 L6 12 M43 35 L54 12" stroke="#2e9d4f" strokeWidth="6.4" strokeLinecap="round" />
        <circle cx="6" cy="12" r="5.5" fill="#f5c518" stroke={OUT} strokeWidth="1.6" />
        <circle cx="54" cy="12" r="5.5" fill="#f5c518" stroke={OUT} strokeWidth="1.6" />
        <path d="M16 33 Q30 30 44 33 L43 70 L17 70 Z" fill="#2e9d4f" stroke={OUT} strokeWidth={SW} />
        <circle cx="30" cy="17" r="11" fill="#e8b98a" stroke={OUT} strokeWidth={SW} />
        <path d="M19.5 14 C19 5 41 5 40.5 14 L37 11 L23 11 Z" fill="#1b1b1b" />
        <circle cx="26.5" cy="16" r="1.3" fill={OUT} /><circle cx="33.5" cy="16" r="1.3" fill={OUT} />
        <path d={sad ? "M27 24 Q30 21 33 24" : "M27 23 L33 23"} stroke={OUT} strokeWidth="1.3" fill="none" />
      </g>
    </g>
  );
}

export function Figure({ name, sceneId, mood = "idle", size = 64, rival, pose = "none", keeper = "idle" }: { name: string; sceneId?: string; mood?: Mood; size?: number; rival?: boolean; pose?: Pose; keeper?: "idle" | "dive" | "beaten" }) {
  const id = useId().replace(/:/g, "");
  const look = lookFor(name, sceneId);
  void rival;
  if (name === GOAL_PIECE)
    return (
      <svg width={size * 1.5} height={size * 1.2} viewBox="-2 8 124 92" role="img" aria-label="Arco con arquero">
        <title>Arco con arquero</title>
        <Goal mood={mood} keeper={keeper} />
      </svg>
    );
  const anim = mood === "gloria" ? "anim-gloria" : mood === "tension" ? "anim-tension" : mood === "drama" ? "anim-drama" : "anim-idle";
  if (look.kind === "team") {
    return (
      <svg width={size * 1.5} height={size * 1.2} viewBox="-10 0 130 114" role="img" aria-label={name} className={anim}>
        <title>{name}</title>
        <g transform="translate(0 6) scale(.9)"><Person look={look} mood={mood} id={`${id}a`} /></g>
        <g transform="translate(56 6) scale(.9)"><Person look={{ ...look, skin: "#d79c6e", hair: "#3a2616" }} mood={mood} id={`${id}b`} /></g>
        <g transform="translate(26 0)"><Person look={{ ...look, skin: "#f3d2a8", hair: "#1b1b1b", hairStyle: "curly" }} mood={mood} id={`${id}c`} /></g>
      </svg>
    );
  }
  if (look.kind === "crowd") {
    return (
      <svg width={size * 1.6} height={size * 1.2} viewBox="-20 -4 130 112" role="img" aria-label={name} className={anim}>
        <title>{name}</title>
        <Crowd look={look} mood={mood} />
      </svg>
    );
  }
  return (
    <svg width={size * 0.62} height={size * 1.15} viewBox="0 0 60 112" role="img" aria-label={name} className={anim}>
      <title>{name}</title>
      <Person look={look} mood={mood} id={id} pose={pose} />
    </svg>
  );
}

/** Defensor de la barrera: un jugador con la camiseta del equipo (brazos cruzados abajo). */
export function Defender({ team, size = 30, index = 0 }: { team?: string; size?: number; index?: number }) {
  const id = useId().replace(/:/g, "");
  const base = lookFor(team ?? "", "");
  const look: Look = { ...base, kind: "player", skin: ["#f3d2a8", "#d79c6e", "#e8b98a", "#b97b52"][index % 4], hair: ["#1b1b1b", "#3a2616", "#6b4423", "#1b1b1b"][index % 4] };
  return (
    <svg width={size * 0.62} height={size * 1.15} viewBox="0 0 60 112" aria-hidden>
      <Person look={look} mood="idle" id={id} pose="wall" />
    </svg>
  );
}
