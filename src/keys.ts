// keys, as the page captures them (KeyboardEvent.code) and as windows presses them (scan codes, set 1; 0xE0 in the
// high byte for an extended key), with the short name a chip shows

const TABLE: [code: string, scan: number, name: string][] = [
  ['Escape', 0x01, 'esc'],
  ...'1234567890'.split('').map((d, i): [string, number, string] => [`Digit${d}`, 0x02 + i, d]),
  ['Minus', 0x0c, '-'],
  ['Equal', 0x0d, '='],
  ['Backspace', 0x0e, 'backspace'],
  ['Tab', 0x0f, 'tab'],
  ...[...'QWERTYUIOP'].map((l, i): [string, number, string] => [`Key${l}`, 0x10 + i, l]),
  ['BracketLeft', 0x1a, '['],
  ['BracketRight', 0x1b, ']'],
  ['Enter', 0x1c, 'enter'],
  ['ControlLeft', 0x1d, 'ctrl'],
  ...[...'ASDFGHJKL'].map((l, i): [string, number, string] => [`Key${l}`, 0x1e + i, l]),
  ['Semicolon', 0x27, ';'],
  ['Quote', 0x28, "'"],
  ['Backquote', 0x29, '`'],
  ['ShiftLeft', 0x2a, 'shift'],
  ['Backslash', 0x2b, '\\'],
  ...[...'ZXCVBNM'].map((l, i): [string, number, string] => [`Key${l}`, 0x2c + i, l]),
  ['Comma', 0x33, ','],
  ['Period', 0x34, '.'],
  ['Slash', 0x35, '/'],
  ['ShiftRight', 0x36, 'right shift'],
  ['NumpadMultiply', 0x37, 'num *'],
  ['AltLeft', 0x38, 'alt'],
  ['Space', 0x39, 'space'],
  ['CapsLock', 0x3a, 'caps lock'],
  ...Array.from({ length: 10 }, (_, i): [string, number, string] => [`F${i + 1}`, 0x3b + i, `F${i + 1}`]),
  ['Numpad7', 0x47, 'num 7'],
  ['Numpad8', 0x48, 'num 8'],
  ['Numpad9', 0x49, 'num 9'],
  ['NumpadSubtract', 0x4a, 'num -'],
  ['Numpad4', 0x4b, 'num 4'],
  ['Numpad5', 0x4c, 'num 5'],
  ['Numpad6', 0x4d, 'num 6'],
  ['NumpadAdd', 0x4e, 'num +'],
  ['Numpad1', 0x4f, 'num 1'],
  ['Numpad2', 0x50, 'num 2'],
  ['Numpad3', 0x51, 'num 3'],
  ['Numpad0', 0x52, 'num 0'],
  ['NumpadDecimal', 0x53, 'num .'],
  ['F11', 0x57, 'F11'],
  ['F12', 0x58, 'F12'],
  ['NumpadEnter', 0xe01c, 'num enter'],
  ['ControlRight', 0xe01d, 'right ctrl'],
  ['NumpadDivide', 0xe035, 'num /'],
  ['AltRight', 0xe038, 'right alt'],
  ['Home', 0xe047, 'home'],
  ['ArrowUp', 0xe048, '↑'],
  ['PageUp', 0xe049, 'page up'],
  ['ArrowLeft', 0xe04b, '←'],
  ['ArrowRight', 0xe04d, '→'],
  ['End', 0xe04f, 'end'],
  ['ArrowDown', 0xe050, '↓'],
  ['PageDown', 0xe051, 'page down'],
  ['Insert', 0xe052, 'insert'],
  ['Delete', 0xe053, 'delete'],
];

const BY_CODE = new Map(TABLE.map(([code, scan]) => [code, scan]));
const NAMES = new Map(TABLE.map(([, scan, name]) => [scan, name]));

/// the scan code windows presses for a key the page saw, undefined for one it cannot press
export function scanOf(code: string): number | undefined {
  return BY_CODE.get(code);
}

export function keyName(scan: number): string {
  return NAMES.get(scan) ?? `0x${scan.toString(16)}`;
}
