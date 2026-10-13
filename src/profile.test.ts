import { describe, expect, it } from 'vitest';
import { defaultProfile, presetXbox, xboxLit, keysLit, SCAN } from './profile';

const held = (controls: string[], left: [number, number] = [0, 0]) =>
  ({ controls, left, right: [0, 0] }) as Parameters<typeof xboxLit>[1];

describe('the page’s copy of the presets', () => {
  it('maps nintendo’s A to xbox B by position, and to A by label', () => {
    expect(presetXbox('nes', 'position').a).toBe('b');
    expect(presetXbox('nes', 'label').a).toBe('a');
    expect(presetXbox('switch_pro', 'position').x).toBe('y');
  });

  it('gives the famicom’s second pad no start', () => {
    expect(defaultProfile('famicom2').xbox.plus).toBeUndefined();
    expect(defaultProfile('famicom2').keys.plus).toBeUndefined();
  });

  it('lights the xbox targets a press reaches, sticks past half way', () => {
    const pro = defaultProfile('switch_pro');
    expect([...xboxLit(pro, held(['a', 'up']))]).toEqual(['b', 'up']);
    expect([...xboxLit(pro, held([], [-30000, 0]))]).toEqual(['lstick-left']);
    expect([...xboxLit(pro, held([], [-1000, 0]))]).toEqual([]);
  });

  it('holds retroarch’s keys', () => {
    expect([...keysLit(defaultProfile('nes'), held(['a', 'plus']))]).toEqual([SCAN.x, SCAN.enter]);
  });
});
