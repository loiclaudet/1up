//! which nintendo pad a pad is, from what SDL says of it, and the controls it has: its picture and its default
//! profile come from here

use crate::controls::{Control, Stick};
use serde::Serialize;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Family {
    Nes,
    Famicom1,
    Famicom2,
    Snes,
    N64,
    Genesis,
    SwitchPro,
    JoyConLeft,
    JoyConRight,
    JoyConPair,
    /// a nintendo pad with no family of its own yet: the switch 2 pads, the gamecube one
    Nintendo,
}

use Control::*;

const DPAD: [Control; 4] = [Up, Down, Left, Right];
const NES: [Control; 10] = [Up, Down, Left, Right, Minus, Plus, B, A, L, R];
/// the famicom's second pad has no select or start (a microphone where they would be)
const FAMICOM2: [Control; 8] = [Up, Down, Left, Right, B, A, L, R];
const SNES: [Control; 14] = [Up, Down, Left, Right, Minus, Plus, Y, X, B, A, L, R, Zl, Zr];
const SWITCH: [Control; 18] =
    [Up, Down, Left, Right, Minus, Plus, Home, Capture, Y, X, B, A, L, R, Zl, Zr, LStick, RStick];

impl Family {
    /// from SDL's type string (`switchpro`, `joyconleft`...), the pad's name and its usb product id
    pub fn of(kind: &str, name: &str, product: u16) -> Family {
        let name = name.to_lowercase();
        // snes before nes: "snes" holds "nes"
        if name.contains("snes") || product == 0x2017 {
            Family::Snes
        } else if name.contains("nes controller") {
            Family::Nes
        } else if name.contains("family computer") || name.contains("hvc") || name.contains("famicom") {
            if name.contains("(2)") { Family::Famicom2 } else { Family::Famicom1 }
        } else if name.contains("n64") || product == 0x2019 {
            Family::N64
        } else if name.contains("genesis") || name.contains("mega drive") || product == 0x201e {
            Family::Genesis
        } else {
            match kind {
                "switchpro" => Family::SwitchPro,
                "joyconleft" => Family::JoyConLeft,
                "joyconright" => Family::JoyConRight,
                "joyconpair" => Family::JoyConPair,
                _ => Family::Nintendo,
            }
        }
    }

    /// the controls it has, in the order its picture and its list show them
    pub fn controls(self) -> &'static [Control] {
        match self {
            Family::Nes | Family::Famicom1 => &NES,
            Family::Famicom2 => &FAMICOM2,
            Family::Snes => &SNES,
            // every switch control, for the pads with no list of their own too
            _ => &SWITCH,
        }
    }

    pub fn sticks(self) -> &'static [Stick] {
        match self {
            Family::Nes | Family::Famicom1 | Family::Famicom2 | Family::Snes => &[],
            Family::JoyConLeft | Family::JoyConRight => &[Stick::Left],
            _ => &[Stick::Left, Stick::Right],
        }
    }

    pub fn has_dpad(self) -> bool {
        DPAD.iter().all(|c| self.controls().contains(c))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_switch_online_pads_are_told_apart_by_the_names_sdl_gives_them() {
        assert_eq!(Family::of("standard", "Nintendo NES Controller (L)", 0x2007), Family::Nes);
        assert_eq!(Family::of("standard", "Nintendo NES Controller (R)", 0x2007), Family::Nes);
        assert_eq!(Family::of("standard", "Nintendo Family Computer Controller (1)", 0x2007), Family::Famicom1);
        assert_eq!(Family::of("standard", "Nintendo Family Computer Controller (2)", 0x2007), Family::Famicom2);
        // SDL before may 2026 called them hvc
        assert_eq!(Family::of("standard", "Nintendo HVC Controller (2)", 0x2007), Family::Famicom2);
        assert_eq!(Family::of("standard", "Nintendo SNES Controller", 0x2017), Family::Snes);
        assert_eq!(Family::of("standard", "Nintendo N64 Controller", 0x2019), Family::N64);
        assert_eq!(Family::of("standard", "Nintendo SEGA Genesis Controller", 0x201e), Family::Genesis);
    }

    #[test]
    fn the_switch_pads_go_by_sdls_type() {
        assert_eq!(Family::of("switchpro", "Nintendo Switch Pro Controller", 0x2009), Family::SwitchPro);
        assert_eq!(Family::of("joyconleft", "Nintendo Switch Joy-Con (L)", 0x2006), Family::JoyConLeft);
        assert_eq!(Family::of("joyconright", "Nintendo Switch Joy-Con (R)", 0x2007), Family::JoyConRight);
        assert_eq!(Family::of("joyconpair", "Nintendo Switch Joy-Con (L/R)", 0x2008), Family::JoyConPair);
        assert_eq!(Family::of("gamecube", "Nintendo Switch 2 GameCube Controller", 0x2073), Family::Nintendo);
    }

    #[test]
    fn each_family_has_its_own_controls() {
        assert_eq!(Family::Nes.controls(), &NES);
        assert!(!Family::Famicom2.controls().contains(&Control::Plus));
        assert!(Family::Snes.controls().contains(&Control::Y));
        assert!(Family::SwitchPro.controls().contains(&Control::Capture));
        assert_eq!(Family::SwitchPro.controls().len(), 18);
        assert!(Family::Nes.has_dpad() && Family::SwitchPro.has_dpad());
        assert!(Family::Nes.sticks().is_empty());
        assert_eq!(Family::SwitchPro.sticks(), &[Stick::Left, Stick::Right]);
    }
}
