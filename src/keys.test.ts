import { describe, expect, it } from 'vitest';
import { keyName, scanOf } from './keys';
import { SCAN } from './profile';

describe('keys', () => {
  it('takes a key the page saw to the scan code windows presses', () => {
    expect(scanOf('KeyZ')).toBe(0x2c);
    expect(scanOf('KeyX')).toBe(0x2d);
    expect(scanOf('KeyA')).toBe(0x1e);
    expect(scanOf('KeyQ')).toBe(0x10);
    expect(scanOf('KeyP')).toBe(0x19);
    expect(scanOf('KeyL')).toBe(0x26);
    expect(scanOf('KeyM')).toBe(0x32);
    expect(scanOf('Digit1')).toBe(0x02);
    expect(scanOf('Digit0')).toBe(0x0b);
    expect(scanOf('F10')).toBe(0x44);
    expect(scanOf('Space')).toBe(0x39);
    expect(scanOf('ArrowUp')).toBe(0xe048);
    expect(scanOf('MetaLeft')).toBeUndefined();
  });

  it('agrees with the defaults’ scan codes', () => {
    expect([SCAN.z, SCAN.x, SCAN.a, SCAN.s, SCAN.q, SCAN.w]).toEqual(
      ['KeyZ', 'KeyX', 'KeyA', 'KeyS', 'KeyQ', 'KeyW'].map(scanOf),
    );
    expect([SCAN.enter, SCAN.rshift, SCAN.up, SCAN.left]).toEqual(['Enter', 'ShiftRight', 'ArrowUp', 'ArrowLeft'].map(scanOf));
  });

  it('names a key for its chip', () => {
    expect(keyName(0x2d)).toBe('X');
    expect(keyName(0xe04b)).toBe('←');
    expect(keyName(0x36)).toBe('right shift');
    expect(keyName(0x7f)).toBe('0x7f');
  });
});
