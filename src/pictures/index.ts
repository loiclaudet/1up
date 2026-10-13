import type { Family } from '../types';
import { FAMICOM1, FAMICOM2 } from './famicom';
import { NES } from './nes';
import { PRO } from './pro';
import type { PadArt } from './props';
import { SCHEMATIC } from './schematic';

export type { PadArt, PadPictureProps, Part } from './props';

/// the picture of a family; the pads with none of their own yet get the schematic
export function artOf(family: Family): PadArt {
  switch (family) {
    case 'nes':
      return NES;
    case 'famicom1':
      return FAMICOM1;
    case 'famicom2':
      return FAMICOM2;
    case 'switch_pro':
      return PRO;
    default:
      return SCHEMATIC;
  }
}
