// the callouts' places. a column (left or right of the pad) keeps its labels in the order of their anchors from the
// top, at least a row apart, between a top and a bottom; a row (above or below the pad) keeps them in the order of
// their anchors from the left, a gap between their edges, between a left and a right. too many to fit: spread
// evenly

export interface Anchor {
  id: string;
  x: number;
  y: number;
  /// a label's width, for a row
  width?: number;
}

export interface Placed extends Anchor {
  /// the label's middle: along a column, its y; along a row, its x
  at: number;
}

export function column(anchors: Anchor[], top: number, bottom: number, row: number): Placed[] {
  const list = [...anchors].sort((a, b) => a.y - b.y || a.x - b.x);
  const n = list.length;
  let at = list.map((a) => a.y);
  if (n && (n - 1) * row > bottom - top) {
    at = list.map((_, i) => top + ((bottom - top) * i) / Math.max(1, n - 1));
  } else {
    for (let i = 0; i < n; i++) at[i] = Math.max(at[i], i ? at[i - 1] + row : top);
    for (let i = n - 1; i >= 0; i--) at[i] = Math.min(at[i], i < n - 1 ? at[i + 1] - row : bottom);
  }
  return list.map((a, i) => ({ ...a, at: at[i] }));
}

export function row(anchors: Anchor[], left: number, right: number, gap: number): Placed[] {
  const list = [...anchors].sort((a, b) => a.x - b.x || a.y - b.y);
  const half = (a: Anchor) => (a.width ?? 0) / 2;
  const n = list.length;
  const needed = list.reduce((sum, a) => sum + (a.width ?? 0), 0) + gap * Math.max(0, n - 1);
  let at = list.map((a) => a.x);
  if (needed > right - left) {
    let x = left;
    at = list.map((a) => {
      const middle = x + half(a);
      x += (a.width ?? 0) + gap;
      return middle;
    });
  } else {
    for (let i = 0; i < n; i++)
      at[i] = Math.max(at[i], i ? at[i - 1] + half(list[i - 1]) + gap + half(list[i]) : left + half(list[i]));
    for (let i = n - 1; i >= 0; i--)
      at[i] = Math.min(at[i], i < n - 1 ? at[i + 1] - half(list[i + 1]) - gap - half(list[i]) : right - half(list[i]));
  }
  return list.map((a, i) => ({ ...a, at: at[i] }));
}
