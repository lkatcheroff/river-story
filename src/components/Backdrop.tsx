import { useId } from "react";
import type { Kind } from "../lib/puzzle";
import type { Panel } from "../lib/schema";

const MOUNTAINS = new Set(["Santiago", "Cali", "Medellín", "Belo Horizonte", "Córdoba"]);
const TOWER = new Set(["Estadio Nacional de Tokio"]);
const SKY: Record<Panel["tone"], [string, string]> = {
  calma: ["#8ec9f0", "#e6f4fc"],
  tension: ["#f0a64a", "#fbe2a8"],
  drama: ["#5c6070", "#a9adb8"],
  gloria: ["#ff9f3d", "#ffe27a"],
};
const NIGHT: [string, string] = ["#14173a", "#3a3f78"];

function Crowd({ y, rows, seed }: { y: number; rows: number; seed: number }) {
  const cols = ["#d4101f", "#ffffff", "#1a1a1a", "#f3d2a8", "#d4101f", "#ffffff"];
  return (
    <g>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: 22 }).map((__, i) => (
          <circle key={`${r}-${i}`} cx={4 + i * 7.4 + (r % 2) * 3.6} cy={y + r * 5.4} r="2.5" fill={cols[(i * 3 + r * 5 + seed) % cols.length]} stroke="#111" strokeWidth=".5" />
        )),
      )}
    </g>
  );
}

function Stadium({ label, tone }: { label: string; tone: Panel["tone"] }) {
  const monumental = label === "Monumental";
  return (
    <g>
      {/* tribunas con público */}
      <path d="M0 40 L160 40 L160 62 L0 62 Z" fill="#7d8190" />
      <Crowd y={44} rows={3} seed={label.length} />
      <path d="M0 40 H160" stroke="#111" strokeWidth="1.5" />
      {monumental && (
        <>
          <path d="M0 24 L160 24 L160 40 L0 40 Z" fill="#9aa0b0" />
          <Crowd y={28} rows={2} seed={3} />
          <path d="M0 24 H160" stroke="#111" strokeWidth="1.5" />
        </>
      )}
      {/* torres de luz */}
      {[14, 146].map((x) => (
        <g key={x}>
          <line x1={x} y1="14" x2={x} y2="40" stroke="#333" strokeWidth="1.6" />
          <rect x={x - 7} y="8" width="14" height="7" fill="#ececec" stroke="#111" strokeWidth="1" />
          {tone === "gloria" && <path d={`M${x - 7} 15 L${x - 28} 60 L${x + 28} 60 L${x + 7} 15 Z`} fill="#fff6" />}
        </g>
      ))}
      {/* césped con franjas y perspectiva */}
      <path d="M0 62 L160 62 L160 110 L0 110 Z" fill="#4f9d4a" />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${-20 + i * 36} 110 L${58 + i * 9} 62 L${72 + i * 9} 62 L${16 + i * 36} 110 Z`} fill="#5cae56" />)}
      <g fill="none" stroke="#fff" strokeWidth="1.6">
        <path d="M14 108 L48 66 H112 L146 108 Z" />
        <path d="M80 66 L80 108" />
        <ellipse cx="80" cy="88" rx="16" ry="7" />
        <path d="M60 108 L66 96 H94 L100 108" />
      </g>
      <circle cx="80" cy="88" r="2" fill="#fff" />
    </g>
  );
}

function Tribuna({ label }: { label: string }) {
  const flag = (x: number, y: number, c: string) => (
    <g key={x}>
      <line x1={x} y1={y} x2={x} y2={y + 38} stroke="#111" strokeWidth="1.8" />
      <path d={`M${x} ${y} Q${x + 12} ${y - 4} ${x + 24} ${y + 2} V${y + 16} Q${x + 12} ${y + 10} ${x} ${y + 14} Z`} fill={c} stroke="#111" strokeWidth="1.2" />
    </g>
  );
  return (
    <g>
      <rect width="160" height="110" fill="#aeb2c0" />
      <Crowd y={50} rows={5} seed={label.length + 1} />
      {flag(22, 22, "#d4101f")}
      {flag(70, 14, "#ffffff")}
      {flag(120, 20, "#d4101f")}
      <path d="M0 18 H160" stroke="#111" strokeWidth="1.5" />
      {/* escalera / puerta */}
      <rect x="140" y="30" width="16" height="30" fill="#333" stroke="#111" strokeWidth="1.5" />
      <path d="M0 106 H160" stroke="#111" strokeWidth="3" />
    </g>
  );
}

function Sede() {
  return (
    <g>
      <rect width="160" height="110" fill="#d9ccb0" />
      <rect y="86" width="160" height="24" fill="#8b6f4a" />
      <path d="M18 34 H142 L150 44 H10 Z" fill="#b34a3a" stroke="#111" strokeWidth="1.6" />
      <rect x="14" y="44" width="132" height="42" fill="#efe3c6" stroke="#111" strokeWidth="1.6" />
      {[26, 52, 98, 124].map((x) => <rect key={x} x={x} y="52" width="14" height="22" fill="#9fd1ec" stroke="#111" strokeWidth="1.4" />)}
      <rect x="68" y="56" width="24" height="30" fill="#6b3f22" stroke="#111" strokeWidth="1.6" />
      <circle cx="88" cy="72" r="1.4" fill="#f5c518" />
      {[16, 40, 114, 138].map((x) => <rect key={x} x={x} y="44" width="4" height="42" fill="#fff" stroke="#111" strokeWidth="1" />)}
      <line x1="150" y1="10" x2="150" y2="44" stroke="#111" strokeWidth="2" />
      <path d="M150 10 H132 V22 H150 Z" fill="#fff" stroke="#111" strokeWidth="1.2" />
      <path d="M150 10 L132 22" stroke="#d4101f" strokeWidth="5" />
    </g>
  );
}

function Ciudad({ tone }: { tone: Panel["tone"] }) {
  const b: [number, number, number][] = [[2, 44, 22], [26, 28, 20], [48, 52, 18], [68, 34, 24], [94, 48, 20], [116, 24, 22], [140, 42, 20]];
  return (
    <g>
      <rect y="86" width="160" height="24" fill="#4a4a58" />
      <path d="M0 98 H160" stroke="#f5c518" strokeWidth="1.5" strokeDasharray="8 6" />
      {b.map(([x, y, w], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={86 - y} fill={i % 2 ? "#3b3b4f" : "#505068"} stroke="#111" strokeWidth="1.4" />
          {Array.from({ length: Math.floor((86 - y) / 10) }).map((_, r) => (
            <rect key={r} x={x + 4} y={y + 5 + r * 10} width={w - 8} height="4" fill={(r + i) % 3 ? "#ffe27a" : "#2a2a3a"} />
          ))}
        </g>
      ))}
      {tone === "gloria" && Array.from({ length: 18 }).map((_, i) => <rect key={i} x={(i * 37) % 156} y={(i * 23) % 70} width="3" height="6" fill={["#d4101f", "#fff", "#f5c518"][i % 3]} transform={`rotate(${i * 40} ${(i * 37) % 156} ${(i * 23) % 70})`} />)}
    </g>
  );
}

/** Fondos dibujados a mano (SVG propio, sin material con copyright). */
export function Backdrop({ kind, label = "", tone = "calma" }: { kind: Kind; label?: string; tone?: Panel["tone"] }) {
  const gid = useId().replace(/:/g, "");
  const night = TOWER.has(label) || tone === "drama" && kind === "cancha";
  const [top, bottom] = night ? NIGHT : SKY[tone];
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 110" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient>
      </defs>
      <rect width="160" height="110" fill={`url(#${gid})`} />
      {MOUNTAINS.has(label) && (
        <g>
          <path d="M0 40 L24 14 L44 34 L66 8 L96 38 L120 16 L160 42 V60 H0 Z" fill="#7b8aa5" stroke="#111" strokeWidth="1.2" />
          <path d="M66 8 L58 20 L66 17 L72 22 Z M24 14 L18 22 L24 20 L29 24 Z" fill="#fff" />
        </g>
      )}
      {TOWER.has(label) && (
        <g stroke="#111" strokeWidth="1.2">
          <path d="M122 4 L128 26 L116 26 Z" fill="#d4101f" />
          <path d="M116 26 L112 62 H132 L128 26 Z" fill="#e8553a" />
          <path d="M112 62 L106 62 M132 62 L138 62" />
        </g>
      )}
      {kind === "cancha" && <Stadium label={label} tone={tone} />}
      {kind === "tribuna" && <Tribuna label={label} />}
      {kind === "sede" && <Sede />}
      {kind === "ciudad" && <Ciudad tone={tone} />}
      {tone === "drama" && Array.from({ length: 26 }).map((_, i) => <line key={i} x1={(i * 29) % 160} y1={(i * 17) % 100} x2={((i * 29) % 160) - 4} y2={((i * 17) % 100) + 10} stroke="#dfe7f2" strokeWidth="1" opacity=".7" />)}
    </svg>
  );
}
