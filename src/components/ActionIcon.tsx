import { ORDERED_ACTIONS } from "../lib/schema";

const OUT = "#111";

/** Íconos dibujados de cada acción de una jugada. */
export function ActionIcon({ action, size = 40 }: { action: string; size?: number }) {
  const ball = (x: number, y: number, r = 5) => (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={OUT} strokeWidth="1.6" />
      <path d={`M${x - r * 0.4} ${y - r * 0.3} l${r * 0.5} ${-r * 0.3} l${r * 0.5} ${r * 0.3} l${-r * 0.2} ${r * 0.6} h${-r * 0.6} Z`} fill={OUT} />
    </g>
  );
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 60 42" aria-hidden>
      {action === "Pase" && (<g><path d="M8 30 L50 30" stroke={OUT} strokeWidth="2" strokeDasharray="4 3" />{ball(14, 30)}<path d="M44 24 L52 30 L44 36" fill="none" stroke="#d4101f" strokeWidth="3" /></g>)}
      {action === "Centro" && (<g><path d="M6 36 Q30 -4 54 24" fill="none" stroke={OUT} strokeWidth="2" strokeDasharray="4 3" />{ball(10, 33)}<path d="M46 20 L55 25 L48 32" fill="none" stroke="#d4101f" strokeWidth="3" /></g>)}
      {action === "Gambeta" && (<g><path d="M6 34 L20 12 L32 32 L46 10 L54 22" fill="none" stroke="#d4101f" strokeWidth="3" strokeLinejoin="round" />{ball(8, 34)}</g>)}
      {action === "Tiro al arco" && (<g><path d="M40 8 H56 V36 H40" fill="none" stroke={OUT} strokeWidth="2.5" /><path d="M42 12 H54 M42 18 H54 M42 24 H54 M42 30 H54" stroke="#999" strokeWidth="1" />{ball(10, 28)}<path d="M18 27 L36 20" stroke="#d4101f" strokeWidth="3" /></g>)}
      {action === "Cabezazo" && (<g><circle cx="22" cy="26" r="9" fill="#f3d2a8" stroke={OUT} strokeWidth="2" /><path d="M14 22 Q22 12 30 22" fill="#3a2616" stroke={OUT} strokeWidth="1.4" />{ball(40, 12)}<path d="M28 18 L36 14" stroke="#d4101f" strokeWidth="3" /></g>)}
      {action === "Penal" && (<g><ellipse cx="30" cy="34" rx="22" ry="5" fill="#5fae5a" stroke={OUT} strokeWidth="1.6" /><circle cx="30" cy="34" r="2" fill="#fff" />{ball(30, 26, 6)}<path d="M10 8 H50 V16" fill="none" stroke={OUT} strokeWidth="2.5" /></g>)}
      {action === "Gol" && (<g><path d="M6 8 H54 V36 H6 Z" fill="#fff" stroke={OUT} strokeWidth="2.5" />{[14, 22, 30, 38, 46].map((x) => <path key={x} d={`M${x} 8 V36`} stroke="#bbb" strokeWidth="1" />)}{[16, 24, 32].map((y) => <path key={y} d={`M6 ${y} H54`} stroke="#bbb" strokeWidth="1" />)}{ball(30, 26, 6)}<text x="30" y="7" textAnchor="middle" fontSize="9" fontWeight="800" fill="#d4101f">¡GOL!</text></g>)}
    </svg>
  );
}

export const isOrderedAction = (action: string | null) => !!action && ORDERED_ACTIONS.includes(action);
