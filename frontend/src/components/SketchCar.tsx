/**
 * Pencil-sketch style side view of a car. The body outline is drawn twice
 * with a small offset, like a retraced pencil line, over a loose colour wash.
 * Decorative only (aria-hidden); `wash` tints it per category.
 */
const BODY =
  'M60 190 L52 170 Q54 156 70 151 L150 140 Q176 104 206 94 Q252 84 298 89 Q322 96 350 130 L418 140 Q446 146 452 162 L456 188 L408 190 A40 40 0 0 0 332 190 L178 190 A40 40 0 0 0 102 190 Z';

export function SketchCar({
  wash = 'var(--color-accent-300)',
  className = '',
  withScene = true,
}: {
  wash?: string;
  className?: string;
  /** Ground, shadow hatching, motion lines and sparkle around the car. */
  withScene?: boolean;
}) {
  return (
    <svg viewBox="0 0 480 250" className={className} aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Loose colour wash, deliberately off-register like a marker fill */}
      <path
        d="M78 176 Q70 150 112 146 L176 132 Q206 96 262 92 Q316 92 344 128 L414 140 Q444 150 440 176 Q380 186 300 182 Q180 190 78 176 Z"
        fill={wash}
        opacity="0.85"
      />

      {withScene && (
        <g stroke="var(--color-ink-900)" strokeWidth="2">
          {/* Motion lines */}
          <path d="M8 148 L42 148 M0 168 L36 168 M14 186 L40 186" opacity="0.55" />
          {/* Ground and shadow hatching */}
          <path d="M18 228 L196 228 M214 228 L470 228" />
          <path
            d="M96 236 L106 226 M118 236 L128 226 M140 236 L150 226 M162 236 L172 226 M300 236 L310 226 M322 236 L332 226 M344 236 L354 226 M366 236 L376 226 M388 236 L398 226"
            opacity="0.6"
          />
        </g>
      )}

      <g stroke="var(--color-ink-900)">
        {/* Retraced body outline */}
        <path d={BODY} strokeWidth="3" />
        <path d={BODY} strokeWidth="1.3" opacity="0.45" transform="translate(2 -1.5)" />
        {/* Windows, pillar, door and handle */}
        <path d="M170 139 L208 103 Q250 95 290 99 L328 135 Z" strokeWidth="2.4" fill="var(--color-card)" />
        <path d="M252 98 L252 186 M268 154 L286 154" strokeWidth="2.4" />
        <path d="M200 118 L214 106 M286 108 L300 122" strokeWidth="1.6" opacity="0.6" />
        {/* Wheels */}
        {[140, 370].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="192" r="30" strokeWidth="3" fill="var(--color-card)" />
            <circle cx={cx + 1.5} cy="190.5" r="30" strokeWidth="1.2" opacity="0.4" />
            <circle cx={cx} cy="192" r="10" strokeWidth="2.4" />
            <path d={`M${cx} 172 L${cx} 182 M${cx} 202 L${cx} 212 M${cx - 20} 192 L${cx - 10} 192 M${cx + 10} 192 L${cx + 20} 192`} strokeWidth="1.8" />
          </g>
        ))}
      </g>

      {/* Lights */}
      <circle cx="440" cy="157" r="6" fill="var(--color-accent-500)" stroke="var(--color-ink-900)" strokeWidth="2" />
      <path d="M56 160 L66 158 L66 170 L58 171 Z" fill="var(--color-accent-500)" stroke="var(--color-ink-900)" strokeWidth="2" />

      {withScene && (
        <path
          d="M430 56 L434 72 L450 76 L434 80 L430 96 L426 80 L410 76 L426 72 Z"
          fill="var(--color-accent-400)"
          stroke="var(--color-ink-900)"
          strokeWidth="1.8"
        />
      )}
    </svg>
  );
}
