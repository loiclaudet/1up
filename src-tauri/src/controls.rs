//! a nintendo pad's controls, named as printed on the pad, and what it holds now. SDL numbers buttons by position
//! (south, east...) on the switch pro and the joy-cons, but by label on the switch online classics (their A comes as
//! south): the face buttons go by the label SDL gives each position, so A is A on every pad

use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
use std::fmt;

/// a digital control. select and start are minus and plus (the classics print select and start where the switch
/// pads print - and +), zl and zr are buttons on every nintendo pad. `Other` is any SDL button with no nintendo
/// name, by SDL's number (the paddles, the misc buttons)
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(into = "String", try_from = "String")]
pub enum Control {
    A,
    B,
    X,
    Y,
    L,
    R,
    Zl,
    Zr,
    Minus,
    Plus,
    Home,
    Capture,
    LStick,
    RStick,
    Up,
    Down,
    Left,
    Right,
    Other(u8),
}

const NAMED: [(Control, &str); 18] = [
    (Control::A, "a"),
    (Control::B, "b"),
    (Control::X, "x"),
    (Control::Y, "y"),
    (Control::L, "l"),
    (Control::R, "r"),
    (Control::Zl, "zl"),
    (Control::Zr, "zr"),
    (Control::Minus, "minus"),
    (Control::Plus, "plus"),
    (Control::Home, "home"),
    (Control::Capture, "capture"),
    (Control::LStick, "lstick"),
    (Control::RStick, "rstick"),
    (Control::Up, "up"),
    (Control::Down, "down"),
    (Control::Left, "left"),
    (Control::Right, "right"),
];

impl fmt::Display for Control {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Control::Other(n) => write!(f, "other{n}"),
            named => {
                let name = NAMED.iter().find(|(c, _)| c == named).map(|(_, name)| *name).unwrap_or("?");
                f.write_str(name)
            }
        }
    }
}

impl From<Control> for String {
    fn from(c: Control) -> String {
        c.to_string()
    }
}

impl TryFrom<String> for Control {
    type Error = String;
    fn try_from(s: String) -> Result<Control, String> {
        if let Some((c, _)) = NAMED.iter().find(|(_, name)| *name == s) {
            return Ok(*c);
        }
        s.strip_prefix("other")
            .and_then(|n| n.parse().ok())
            .map(Control::Other)
            .ok_or_else(|| format!("no control {s}"))
    }
}

/// an analog stick
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Stick {
    Left,
    Right,
}

/// the letter SDL says a face position carries (SDL_GamepadButtonLabel), from south, east, west, north
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Label {
    A,
    B,
    X,
    Y,
    None,
}

impl Label {
    /// SDL_GamepadButtonLabel's number
    pub fn of_sdl(n: i32) -> Label {
        match n {
            1 => Label::A,
            2 => Label::B,
            3 => Label::X,
            4 => Label::Y,
            _ => Label::None,
        }
    }
}

/// the four face positions' labels on a switch pad read by position: bottom B, right A, left Y, top X
pub const BY_POSITION: [Label; 4] = [Label::B, Label::A, Label::Y, Label::X];

/// SDL's gamepad button number to the control it is on this pad, given the labels of its four face positions
pub fn control(button: u8, faces: &[Label; 4]) -> Control {
    match button {
        0..=3 => match faces[button as usize] {
            Label::A => Control::A,
            Label::B => Control::B,
            Label::X => Control::X,
            Label::Y => Control::Y,
            Label::None => Control::Other(button),
        },
        4 => Control::Minus,
        5 => Control::Home,
        6 => Control::Plus,
        7 => Control::LStick,
        8 => Control::RStick,
        9 => Control::L,
        10 => Control::R,
        11 => Control::Up,
        12 => Control::Down,
        13 => Control::Left,
        14 => Control::Right,
        15 => Control::Capture,
        n => Control::Other(n),
    }
}

/// SDL's axes: the sticks, then the triggers (zl and zr, buttons on nintendo pads)
pub const LEFT_X: u8 = 0;
pub const LEFT_Y: u8 = 1;
pub const RIGHT_X: u8 = 2;
pub const RIGHT_Y: u8 = 3;
pub const LEFT_TRIGGER: u8 = 4;
pub const RIGHT_TRIGGER: u8 = 5;
/// a trigger past this is held
const TRIGGER_HELD: i16 = 8192;

/// what a pad holds now: its controls down and its sticks (SDL's axes, -32768..32767, y down)
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
pub struct Held {
    pub controls: BTreeSet<Control>,
    pub left: (i16, i16),
    pub right: (i16, i16),
}

impl Held {
    pub fn button(&mut self, control: Control, down: bool) {
        if down {
            self.controls.insert(control);
        } else {
            self.controls.remove(&control);
        }
    }

    pub fn axis(&mut self, axis: u8, value: i16) {
        match axis {
            LEFT_X => self.left.0 = value,
            LEFT_Y => self.left.1 = value,
            RIGHT_X => self.right.0 = value,
            RIGHT_Y => self.right.1 = value,
            LEFT_TRIGGER => self.button(Control::Zl, value > TRIGGER_HELD),
            RIGHT_TRIGGER => self.button(Control::Zr, value > TRIGGER_HELD),
            _ => {}
        }
    }

    pub fn stick(&self, stick: Stick) -> (i16, i16) {
        match stick {
            Stick::Left => self.left,
            Stick::Right => self.right,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// a switch online classic: SDL puts the label A at south
    const BY_LABEL: [Label; 4] = [Label::A, Label::B, Label::X, Label::Y];

    #[test]
    fn a_switch_pads_face_buttons_go_by_position_a_classics_by_label_and_both_come_out_by_name() {
        // the switch pro: south is its B, east its A
        assert_eq!(control(0, &BY_POSITION), Control::B);
        assert_eq!(control(1, &BY_POSITION), Control::A);
        assert_eq!(control(2, &BY_POSITION), Control::Y);
        assert_eq!(control(3, &BY_POSITION), Control::X);
        // the nes pad: SDL sends its A as south
        assert_eq!(control(0, &BY_LABEL), Control::A);
        assert_eq!(control(1, &BY_LABEL), Control::B);
        // a position with no letter
        assert_eq!(control(2, &[Label::A, Label::B, Label::None, Label::None]), Control::Other(2));
    }

    #[test]
    fn the_other_buttons_have_one_name_on_every_pad() {
        let named: Vec<Control> = (4..=15).map(|b| control(b, &BY_POSITION)).collect();
        use Control::*;
        assert_eq!(named, [Minus, Home, Plus, LStick, RStick, L, R, Up, Down, Left, Right, Capture]);
        assert_eq!(control(16, &BY_POSITION), Other(16));
    }

    #[test]
    fn a_control_is_saved_by_its_name_and_read_back() {
        for c in [Control::A, Control::Zr, Control::Minus, Control::Right, Control::Other(17)] {
            let json = serde_json::to_string(&c).unwrap();
            assert_eq!(serde_json::from_str::<Control>(&json).unwrap(), c);
        }
        assert_eq!(serde_json::to_string(&Control::Minus).unwrap(), "\"minus\"");
        assert_eq!(serde_json::to_string(&Control::Other(17)).unwrap(), "\"other17\"");
        assert!(serde_json::from_str::<Control>("\"turbo\"").is_err());
        // a control is a map key too
        let map: std::collections::BTreeMap<Control, u8> = [(Control::A, 1)].into();
        assert_eq!(serde_json::to_string(&map).unwrap(), "{\"a\":1}");
    }

    #[test]
    fn the_triggers_are_zl_and_zr_held_past_a_quarter() {
        let mut held = Held::default();
        held.axis(LEFT_TRIGGER, 32767);
        assert!(held.controls.contains(&Control::Zl));
        held.axis(LEFT_TRIGGER, 0);
        assert!(held.controls.is_empty());
        held.axis(RIGHT_TRIGGER, 4000);
        assert!(held.controls.is_empty());
        held.axis(LEFT_X, -32768);
        held.axis(RIGHT_Y, 1200);
        assert_eq!(held.stick(Stick::Left), (-32768, 0));
        assert_eq!(held.stick(Stick::Right), (0, 1200));
    }
}
