//! the keys output: every pad's keys, pressed and let go as one keyboard. a key two pads hold stays down until both
//! let go. scan codes go through SendInput, so games reading the raw keyboard see them too

use crate::mapping::Scan;
use std::collections::{BTreeSet, HashMap};

#[derive(Default)]
pub struct Keys {
    per_pad: HashMap<u32, BTreeSet<Scan>>,
}

impl Keys {
    /// a pad's keys now: what the keyboard must let go of, then press
    pub fn set(&mut self, pad: u32, keys: BTreeSet<Scan>) -> (Vec<Scan>, Vec<Scan>) {
        let before = self.all();
        if keys.is_empty() {
            self.per_pad.remove(&pad);
        } else {
            self.per_pad.insert(pad, keys);
        }
        let after = self.all();
        (before.difference(&after).copied().collect(), after.difference(&before).copied().collect())
    }

    fn all(&self) -> BTreeSet<Scan> {
        self.per_pad.values().flatten().copied().collect()
    }
}

/// lets go of `ups`, then presses `downs`, as scan codes (0xE0 in the high byte: an extended key)
#[cfg(windows)]
pub fn press(ups: &[Scan], downs: &[Scan]) {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP, KEYEVENTF_SCANCODE,
        SendInput,
    };
    let input = |scan: Scan, up: bool| {
        let mut flags = KEYEVENTF_SCANCODE;
        if scan & 0xFF00 == 0xE000 {
            flags |= KEYEVENTF_EXTENDEDKEY;
        }
        if up {
            flags |= KEYEVENTF_KEYUP;
        }
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT { wVk: 0, wScan: scan & 0xFF, dwFlags: flags, time: 0, dwExtraInfo: 0 },
            },
        }
    };
    let inputs: Vec<INPUT> =
        ups.iter().map(|s| input(*s, true)).chain(downs.iter().map(|s| input(*s, false))).collect();
    if !inputs.is_empty() {
        unsafe { SendInput(inputs.len() as u32, inputs.as_ptr(), size_of::<INPUT>() as i32) };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set(keys: &[Scan]) -> BTreeSet<Scan> {
        keys.iter().copied().collect()
    }

    #[test]
    fn a_pad_presses_and_lets_go_of_its_keys() {
        let mut k = Keys::default();
        assert_eq!(k.set(1, set(&[0x2D, 0x1C])), (vec![], vec![0x1C, 0x2D]));
        assert_eq!(k.set(1, set(&[0x1C])), (vec![0x2D], vec![]));
        assert_eq!(k.set(1, set(&[])), (vec![0x1C], vec![]));
    }

    #[test]
    fn a_key_two_pads_hold_stays_down_until_both_let_go() {
        let mut k = Keys::default();
        k.set(1, set(&[0xE048]));
        assert_eq!(k.set(2, set(&[0xE048])), (vec![], vec![]));
        assert_eq!(k.set(1, set(&[])), (vec![], vec![]));
        assert_eq!(k.set(2, set(&[])), (vec![0xE048], vec![]));
    }
}
