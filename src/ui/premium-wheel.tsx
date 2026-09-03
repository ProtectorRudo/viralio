import type { Merchant, Reward } from "@/domain/types";

const center = 160;
const radius = 146;
export const SPIN_TURNS = 9;
export const SPIN_DURATION_MS = 6600;
export const REDUCED_SPIN_DURATION_MS = 1200;

function point(angle: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [center + radius * Math.cos(radians), center + radius * Math.sin(radians)];
}

function segmentPath(index: number, count: number): string {
  const start = -90 + (index * 360) / count;
  const end = -90 + ((index + 1) * 360) / count;
  const [x1, y1] = point(start);
  const [x2, y2] = point(end);
  return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
}

function shortLabel(label: string): [string, string?] {
  const words = label.replace(" en tu próxima visita", "").replace(" de regalo", "").split(" ");
  if (words.length < 3) return [words.join(" ")];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

function prizeIndex(merchant: Merchant, reward?: Reward): number {
  if (!reward) return 0;
  return Math.max(0, merchant.prizes.findIndex((prize) => prize.id === reward.prizeId));
}

function stopRotation(merchant: Merchant, reward?: Reward): number {
  if (!reward) return 0;
  return 360 - ((prizeIndex(merchant, reward) + 0.5) * 360) / merchant.prizes.length;
}

export function winningRotation(merchant: Merchant, reward?: Reward): number {
  if (!reward) return 0;
  return (SPIN_TURNS * 360) - ((prizeIndex(merchant, reward) + 0.5) * 360) / merchant.prizes.length;
}

export function PremiumWheel({ merchant, reward, spinning, reducedMotion }: {
  merchant: Merchant;
  reward?: Reward;
  spinning: boolean;
  reducedMotion: boolean;
}) {
  const rotation = reducedMotion ? stopRotation(merchant, reward) : winningRotation(merchant, reward);
  const prizeList = merchant.prizes.map((prize) => prize.name).join(", ");

  return (
    <div
      className={`wheel-frame${spinning ? " is-spinning" : ""}${reducedMotion ? " is-reduced" : ""}`}
      data-testid="premium-wheel"
      data-winning-prize={reward?.prizeName ?? ""}
      data-spin-turns={reducedMotion ? 1 : SPIN_TURNS}
      data-spin-duration-ms={reducedMotion ? REDUCED_SPIN_DURATION_MS : SPIN_DURATION_MS}
      role="img"
      aria-label={`Ruleta de ${merchant.name}. Premios: ${prizeList}`}
    >
      <div className="wheel-bezel" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} style={{ transform: `rotate(${index * 30}deg)` }} />)}
      </div>
      <div className="wheel-pointer" aria-hidden="true"><span /></div>
      <div className="wheel-aura" aria-hidden="true" />
      <svg
        className="wheel-svg"
        viewBox="0 0 320 320"
        style={{ transform: `rotate(${rotation}deg)` }}
        aria-hidden="true"
      >
        <circle cx="160" cy="160" r="154" className="wheel-rim" />
        {merchant.prizes.map((prize, index) => {
          const angle = (index + 0.5) * (360 / merchant.prizes.length);
          const [first, second] = shortLabel(prize.name);
          const fill = merchant.theme.palette.wheel[index % merchant.theme.palette.wheel.length];
          return (
            <g key={prize.id}>
              <path d={segmentPath(index, merchant.prizes.length)} fill={fill} className="wheel-segment" data-prize-id={prize.id} />
              <g transform={`rotate(${angle} 160 160)`}>
                <text
                  x="160"
                  y="49"
                  textAnchor="middle"
                  className="wheel-label"
                  transform={angle > 90 && angle < 270 ? "rotate(180 160 49)" : undefined}
                >
                  <tspan x="160" dy="0">{first}</tspan>
                  {second && <tspan x="160" dy="13">{second}</tspan>}
                </text>
              </g>
            </g>
          );
        })}
        <circle cx="160" cy="160" r="42" className="wheel-hub-ring" />
        <circle cx="160" cy="160" r="31" className="wheel-hub" />
        <text x="160" y="166" textAnchor="middle" className="wheel-monogram">{merchant.theme.monogram}</text>
      </svg>
      <div className="wheel-center-cap" aria-hidden="true">
        <span>{merchant.theme.monogram}</span>
        <small>V</small>
      </div>
    </div>
  );
}
