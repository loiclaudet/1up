import { describe, expect, it } from 'vitest';
import { column, row, type Anchor } from './callouts';

const at = (id: string, y: number, x = 0, width?: number): Anchor => ({ id, x, y, width });
const ys = (anchors: Anchor[], top = 0, bottom = 500, step = 30) =>
  Object.fromEntries(column(anchors, top, bottom, step).map((p) => [p.id, p.at]));
const xs = (anchors: Anchor[], left = 0, right = 500, gap = 10) =>
  Object.fromEntries(row(anchors, left, right, gap).map((p) => [p.id, p.at]));

describe('a column of callouts', () => {
  it('sits level with its anchors when there is room', () => {
    expect(ys([at('a', 100), at('b', 200)])).toEqual({ a: 100, b: 200 });
  });

  it('keeps a row apart, in its anchors’ order', () => {
    expect(ys([at('b', 105), at('a', 100), at('c', 110)])).toEqual({ a: 100, b: 130, c: 160 });
  });

  it('stays above the bottom, pushing the ones above up', () => {
    expect(ys([at('a', 480), at('b', 490)], 0, 500)).toEqual({ a: 470, b: 500 });
  });

  it('spreads evenly when too many to fit', () => {
    expect(ys([at('a', 0), at('b', 1), at('c', 2)], 0, 40, 30)).toEqual({ a: 0, b: 20, c: 40 });
  });
});

describe('a row of callouts', () => {
  it('sits over its anchors when there is room', () => {
    expect(xs([at('l', 0, 100, 40), at('r', 0, 400, 40)])).toEqual({ l: 100, r: 400 });
  });

  it('keeps a gap between labels, in their anchors’ order', () => {
    expect(xs([at('b', 0, 105, 40), at('a', 0, 100, 40)])).toEqual({ a: 100, b: 150 });
  });

  it('stays inside its ends', () => {
    expect(xs([at('a', 0, 5, 40)])).toEqual({ a: 20 });
    expect(xs([at('a', 0, 495, 40)])).toEqual({ a: 480 });
  });

  it('lines them up from the left when too many to fit', () => {
    expect(xs([at('a', 0, 0, 100), at('b', 0, 1, 100)], 0, 150, 10)).toEqual({ a: 50, b: 160 });
  });
});
