// 1up's logo, from design/logo.py's paths: the d-pad with its up arm lit and popping, and the wordmark. coloured by
// the page's own ink and live lime, so it follows the theme

import { ARROWS, DIMPLE, MARK_TRANSFORM, POP, REST, UP, UP_ARROW, WIDTH, WORD, WORD_SHIFT } from './logo-paths';

export function Logo({ height = 40 }: { height?: number }) {
  return (
    <svg className="logo" viewBox={`-12 -32 ${WIDTH + 24} 162`} height={height} role="img" aria-label="1up">
      <g transform={MARK_TRANSFORM}>
        <path d={REST} className="logo-ink" />
        <path d={ARROWS} className="logo-engraved" />
        <circle cx={DIMPLE[0]} cy={DIMPLE[1]} r={DIMPLE[2]} className="logo-engraved" opacity="0.55" />
        <path d={UP} className="logo-live" />
        <path d={UP_ARROW} className="logo-ink" />
        {POP && <path d={POP} className="logo-live" />}
      </g>
      <path d={WORD} className="logo-ink" transform={`translate(${WORD_SHIFT} 0)`} />
    </svg>
  );
}
