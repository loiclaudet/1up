//! what a pad's controls become: an xbox 360 pad's buttons, triggers and sticks, or keyboard keys. pure: the
//! outputs (xbox.rs, keys.rs) send what `apply` returns

use crate::controls::{Control, Held, Stick};
use crate::family::Family;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::fmt;

/// where a pad goes
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Output {
    #[default]
    Xbox,
    Keys,
    Off,
}

/// how the xbox pad's face buttons follow a nintendo pad's. by position (the default, what steam and retroarch
/// expect): the right button is xbox B, so nintendo's A is xbox B. by label: A is A
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Preset {
    #[default]
    Position,
    Label,
}

/// an xbox 360 pad's buttons, its triggers pressed fully included
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum XButton {
    A,
    B,
    X,
    Y,
    Lb,
    Rb,
    Lt,
    Rt,
    Back,
    Start,
    Guide,
    Ls,
    Rs,
    Up,
    Down,
    Left,
    Right,
}

const XBUTTONS: [(XButton, &str); 17] = [
    (XButton::A, "a"),
    (XButton::B, "b"),
    (XButton::X, "x"),
    (XButton::Y, "y"),
    (XButton::Lb, "lb"),
    (XButton::Rb, "rb"),
    (XButton::Lt, "lt"),
    (XButton::Rt, "rt"),
    (XButton::Back, "back"),
    (XButton::Start, "start"),
    (XButton::Guide, "guide"),
    (XButton::Ls, "ls"),
    (XButton::Rs, "rs"),
    (XButton::Up, "up"),
    (XButton::Down, "down"),
    (XButton::Left, "left"),
    (XButton::Right, "right"),
];

impl XButton {
    /// its bit in the xbox 360 report (XUSB_GAMEPAD), none for the triggers
    pub fn bit(self) -> u16 {
        match self {
            XButton::Up => 0x0001,
            XButton::Down => 0x0002,
            XButton::Left => 0x0004,
            XButton::Right => 0x0008,
            XButton::Start => 0x0010,
            XButton::Back => 0x0020,
            XButton::Ls => 0x0040,
            XButton::Rs => 0x0080,
            XButton::Lb => 0x0100,
            XButton::Rb => 0x0200,
            XButton::Guide => 0x0400,
            XButton::A => 0x1000,
            XButton::B => 0x2000,
            XButton::X => 0x4000,
            XButton::Y => 0x8000,
            XButton::Lt | XButton::Rt => 0,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum Dir {
    Up,
    Down,
    Left,
    Right,
}

const DIRS: [(Dir, &str); 4] = [(Dir::Up, "up"), (Dir::Down, "down"), (Dir::Left, "left"), (Dir::Right, "right")];

/// what a control does on the xbox pad: a button, or a stick pushed fully one way. saved as `a`, `lt`, `lstick-up`
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(into = "String", try_from = "String")]
pub enum XTarget {
    Button(XButton),
    LeftStick(Dir),
    RightStick(Dir),
}

impl fmt::Display for XTarget {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let dir = |d: &Dir| DIRS.iter().find(|(x, _)| x == d).map(|(_, n)| *n).unwrap_or("?");
        match self {
            XTarget::Button(b) => f.write_str(XBUTTONS.iter().find(|(x, _)| x == b).map(|(_, n)| *n).unwrap_or("?")),
            XTarget::LeftStick(d) => write!(f, "lstick-{}", dir(d)),
            XTarget::RightStick(d) => write!(f, "rstick-{}", dir(d)),
        }
    }
}

impl From<XTarget> for String {
    fn from(t: XTarget) -> String {
        t.to_string()
    }
}

impl TryFrom<String> for XTarget {
    type Error = String;
    fn try_from(s: String) -> Result<XTarget, String> {
        let dir = |n: &str| DIRS.iter().find(|(_, x)| *x == n).map(|(d, _)| *d);
        if let Some(d) = s.strip_prefix("lstick-").and_then(dir) {
            return Ok(XTarget::LeftStick(d));
        }
        if let Some(d) = s.strip_prefix("rstick-").and_then(dir) {
            return Ok(XTarget::RightStick(d));
        }
        XBUTTONS.iter().find(|(_, n)| *n == s).map(|(b, _)| XTarget::Button(*b)).ok_or_else(|| format!("no target {s}"))
    }
}

/// what a stick does on the xbox pad
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StickTarget {
    LStick,
    RStick,
    Dpad,
}

/// what a stick does in keys: four keys, pushed past half way
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StickKeys {
    Arrows,
    Wasd,
}

/// a key, by its scan code (set 1, the windows SendInput kind): 0xE0 in the high byte for an extended key
pub type Scan = u16;

pub mod scan {
    use super::Scan;
    pub const UP: Scan = 0xE048;
    pub const DOWN: Scan = 0xE050;
    pub const LEFT: Scan = 0xE04B;
    pub const RIGHT: Scan = 0xE04D;
    pub const ENTER: Scan = 0x1C;
    pub const RIGHT_SHIFT: Scan = 0x36;
    pub const Z: Scan = 0x2C;
    pub const X: Scan = 0x2D;
    pub const A: Scan = 0x1E;
    pub const S: Scan = 0x1F;
    pub const Q: Scan = 0x10;
    pub const W: Scan = 0x11;
    pub const D: Scan = 0x20;
}

/// a pad's profile: where it goes, and a mapping for each output
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct Profile {
    pub output: Output,
    pub preset: Preset,
    pub xbox: BTreeMap<Control, XTarget>,
    pub xbox_sticks: BTreeMap<Stick, StickTarget>,
    pub keys: BTreeMap<Control, Scan>,
    pub key_sticks: BTreeMap<Stick, StickKeys>,
}

impl Profile {
    /// a pad's profile before anyone changed it: to an xbox pad by position, keys as retroarch's defaults
    pub fn for_family(family: Family) -> Profile {
        let mut profile = Profile { keys: keys_for(family), ..Profile::default() };
        for stick in family.sticks() {
            profile.key_sticks.insert(*stick, if *stick == Stick::Left { StickKeys::Arrows } else { StickKeys::Wasd });
        }
        profile.preset(family, Preset::Position);
        profile
    }

    /// the xbox mapping set back to a preset (the keys stay)
    pub fn preset(&mut self, family: Family, preset: Preset) {
        use Control::*;
        self.preset = preset;
        self.xbox.clear();
        self.xbox_sticks.clear();
        let faces = match preset {
            Preset::Position => [(A, XButton::B), (B, XButton::A), (X, XButton::Y), (Y, XButton::X)],
            Preset::Label => [(A, XButton::A), (B, XButton::B), (X, XButton::X), (Y, XButton::Y)],
        };
        let rest = [
            (L, XButton::Lb),
            (R, XButton::Rb),
            (Zl, XButton::Lt),
            (Zr, XButton::Rt),
            (Minus, XButton::Back),
            (Plus, XButton::Start),
            (Home, XButton::Guide),
            (LStick, XButton::Ls),
            (RStick, XButton::Rs),
            (Up, XButton::Up),
            (Down, XButton::Down),
            (Left, XButton::Left),
            (Right, XButton::Right),
        ];
        for (control, button) in faces.into_iter().chain(rest) {
            if family.controls().contains(&control) {
                self.xbox.insert(control, XTarget::Button(button));
            }
        }
        for stick in family.sticks() {
            self.xbox_sticks.insert(*stick, if *stick == Stick::Left { StickTarget::LStick } else { StickTarget::RStick });
        }
    }
}

/// retroarch's keyboard: the arrows, Z and X for the bottom and right buttons, A and S for the left and top ones,
/// Q and W the shoulders, right shift select, enter start. the same by position and by label: nintendo's letters
/// sit where retroarch's pad has them
fn keys_for(family: Family) -> BTreeMap<Control, Scan> {
    use Control::*;
    [
        (Up, scan::UP),
        (Down, scan::DOWN),
        (Left, scan::LEFT),
        (Right, scan::RIGHT),
        (B, scan::Z),
        (A, scan::X),
        (Y, scan::A),
        (X, scan::S),
        (L, scan::Q),
        (R, scan::W),
        (Minus, scan::RIGHT_SHIFT),
        (Plus, scan::ENTER),
    ]
    .into_iter()
    .filter(|(control, _)| family.controls().contains(control))
    .collect()
}

/// an xbox 360 pad's state, as vigembus takes it (XUSB_REPORT): y up, triggers 0..255
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize)]
pub struct XReport {
    pub buttons: u16,
    pub lt: u8,
    pub rt: u8,
    pub lx: i16,
    pub ly: i16,
    pub rx: i16,
    pub ry: i16,
}

/// what a pad sends now
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
pub struct Out {
    pub xbox: Option<XReport>,
    pub keys: BTreeSet<Scan>,
}

/// a stick past this, of 32767, counts as pushed for the d-pad and the keys
pub const PUSHED: i32 = 16384;

/// what `held` sends through `profile`
pub fn apply(profile: &Profile, held: &Held) -> Out {
    match profile.output {
        Output::Off => Out::default(),
        Output::Xbox => Out { xbox: Some(xbox(profile, held)), keys: BTreeSet::new() },
        Output::Keys => Out { xbox: None, keys: keys(profile, held) },
    }
}

/// SDL's y goes down, the xbox pad's up
fn up(y: i16) -> i16 {
    (-(y as i32)).clamp(-32768, 32767) as i16
}

fn pushed((x, y): (i16, i16)) -> [(Dir, bool); 4] {
    let (x, y) = (x as i32, y as i32);
    [(Dir::Up, y < -PUSHED), (Dir::Down, y > PUSHED), (Dir::Left, x < -PUSHED), (Dir::Right, x > PUSHED)]
}

fn xbox(profile: &Profile, held: &Held) -> XReport {
    let mut report = XReport::default();
    // the sticks first, as they are; a control pushing a stick fully wins over it
    for (stick, target) in &profile.xbox_sticks {
        let (x, y) = held.stick(*stick);
        match target {
            StickTarget::LStick => (report.lx, report.ly) = (x, up(y)),
            StickTarget::RStick => (report.rx, report.ry) = (x, up(y)),
            StickTarget::Dpad => {
                for (dir, on) in pushed((x, y)) {
                    if on {
                        report.buttons |= dpad(dir).bit();
                    }
                }
            }
        }
    }
    for control in &held.controls {
        match profile.xbox.get(control) {
            Some(XTarget::Button(XButton::Lt)) => report.lt = 255,
            Some(XTarget::Button(XButton::Rt)) => report.rt = 255,
            Some(XTarget::Button(b)) => report.buttons |= b.bit(),
            Some(XTarget::LeftStick(dir)) => push(&mut report.lx, &mut report.ly, *dir),
            Some(XTarget::RightStick(dir)) => push(&mut report.rx, &mut report.ry, *dir),
            None => {}
        }
    }
    report
}

fn dpad(dir: Dir) -> XButton {
    match dir {
        Dir::Up => XButton::Up,
        Dir::Down => XButton::Down,
        Dir::Left => XButton::Left,
        Dir::Right => XButton::Right,
    }
}

fn push(x: &mut i16, y: &mut i16, dir: Dir) {
    match dir {
        Dir::Up => *y = 32767,
        Dir::Down => *y = -32768,
        Dir::Left => *x = -32768,
        Dir::Right => *x = 32767,
    }
}

fn keys(profile: &Profile, held: &Held) -> BTreeSet<Scan> {
    let mut keys: BTreeSet<Scan> = held.controls.iter().filter_map(|c| profile.keys.get(c).copied()).collect();
    for (stick, set) in &profile.key_sticks {
        let four = match set {
            StickKeys::Arrows => [scan::UP, scan::DOWN, scan::LEFT, scan::RIGHT],
            StickKeys::Wasd => [scan::W, scan::S, scan::A, scan::D],
        };
        for ((_, on), key) in pushed(held.stick(*stick)).into_iter().zip(four) {
            if on {
                keys.insert(key);
            }
        }
    }
    keys
}

#[cfg(test)]
mod tests {
    use super::*;
    use Control::*;

    fn holding(controls: &[Control]) -> Held {
        Held { controls: controls.iter().copied().collect(), ..Held::default() }
    }

    fn sent(profile: &Profile, held: &Held) -> XReport {
        apply(profile, held).xbox.expect("an xbox pad")
    }

    #[test]
    fn by_position_nintendos_a_is_xbox_b_and_by_label_it_is_a() {
        let mut nes = Profile::for_family(Family::Nes);
        assert_eq!(nes.preset, Preset::Position);
        assert_eq!(sent(&nes, &holding(&[A])).buttons, XButton::B.bit());
        assert_eq!(sent(&nes, &holding(&[B])).buttons, XButton::A.bit());
        nes.preset(Family::Nes, Preset::Label);
        assert_eq!(sent(&nes, &holding(&[A])).buttons, XButton::A.bit());
        let pro = Profile::for_family(Family::SwitchPro);
        assert_eq!(sent(&pro, &holding(&[X])).buttons, XButton::Y.bit());
        assert_eq!(sent(&pro, &holding(&[Y])).buttons, XButton::X.bit());
    }

    #[test]
    fn select_start_the_d_pad_and_the_shoulders_go_where_an_xbox_pad_has_them() {
        let nes = Profile::for_family(Family::Nes);
        let r = sent(&nes, &holding(&[Minus, Plus, Up, Right, L, R]));
        let want = [XButton::Back, XButton::Start, XButton::Up, XButton::Right, XButton::Lb, XButton::Rb];
        assert_eq!(r.buttons, want.iter().fold(0, |bits, b| bits | b.bit()));
        // the xusb bits
        assert_eq!((XButton::Up.bit(), XButton::Start.bit(), XButton::A.bit(), XButton::Y.bit()), (1, 0x10, 0x1000, 0x8000));
    }

    #[test]
    fn zl_and_zr_pull_the_triggers_fully() {
        let pro = Profile::for_family(Family::SwitchPro);
        let r = sent(&pro, &holding(&[Zl, Zr]));
        assert_eq!((r.lt, r.rt, r.buttons), (255, 255, 0));
    }

    #[test]
    fn the_sticks_pass_through_with_y_turned_up() {
        let pro = Profile::for_family(Family::SwitchPro);
        let held = Held { left: (-32768, -32768), right: (1200, 32767), ..Held::default() };
        let r = sent(&pro, &held);
        assert_eq!((r.lx, r.ly, r.rx, r.ry), (-32768, 32767, 1200, -32767));
    }

    #[test]
    fn a_stick_on_the_d_pad_counts_past_half_way() {
        let mut pro = Profile::for_family(Family::SwitchPro);
        pro.xbox_sticks.insert(Stick::Left, StickTarget::Dpad);
        assert_eq!(sent(&pro, &Held { left: (0, -20000), ..Held::default() }).buttons, XButton::Up.bit());
        assert_eq!(sent(&pro, &Held { left: (12000, 0), ..Held::default() }).buttons, 0);
    }

    #[test]
    fn a_button_can_push_a_stick_fully() {
        let mut nes = Profile::for_family(Family::Nes);
        nes.xbox.insert(Up, XTarget::LeftStick(Dir::Up));
        nes.xbox.insert(Left, XTarget::RightStick(Dir::Left));
        let r = sent(&nes, &holding(&[Up, Left]));
        assert_eq!((r.ly, r.rx, r.buttons), (32767, -32768, 0));
    }

    #[test]
    fn the_famicoms_second_pad_has_no_start_to_map() {
        let p = Profile::for_family(Family::Famicom2);
        assert!(!p.xbox.contains_key(&Plus) && !p.keys.contains_key(&Plus));
        assert_eq!(p.xbox.get(&A), Some(&XTarget::Button(XButton::B)));
        assert!(p.xbox_sticks.is_empty());
    }

    #[test]
    fn keys_go_as_retroarch_expects() {
        let mut nes = Profile::for_family(Family::Nes);
        nes.output = Output::Keys;
        let out = apply(&nes, &holding(&[A, B, Plus, Minus, Up]));
        assert_eq!(out.xbox, None);
        assert_eq!(out.keys, [scan::X, scan::Z, scan::ENTER, scan::RIGHT_SHIFT, scan::UP].into_iter().collect());
        // a stick in keys, past half way
        let mut pro = Profile::for_family(Family::SwitchPro);
        pro.output = Output::Keys;
        let out = apply(&pro, &Held { left: (-30000, 0), right: (0, 30000), ..Held::default() });
        assert_eq!(out.keys, [scan::LEFT, scan::S].into_iter().collect());
    }

    #[test]
    fn off_sends_nothing() {
        let mut nes = Profile::for_family(Family::Nes);
        nes.output = Output::Off;
        assert_eq!(apply(&nes, &holding(&[A])), Out::default());
    }

    #[test]
    fn a_profile_is_saved_as_plain_names() {
        let mut nes = Profile::for_family(Family::Nes);
        nes.xbox.insert(Up, XTarget::LeftStick(Dir::Up));
        let json = serde_json::to_value(&nes).unwrap();
        assert_eq!(json["output"], "xbox");
        assert_eq!(json["preset"], "position");
        assert_eq!(json["xbox"]["a"], "b");
        assert_eq!(json["xbox"]["up"], "lstick-up");
        assert_eq!(json["keys"]["plus"], scan::ENTER);
        let back: Profile = serde_json::from_value(json).unwrap();
        assert_eq!(back, nes);
        // a profile from an older 1up, missing fields: the rest default
        let old: Profile = serde_json::from_str(r#"{"output":"keys"}"#).unwrap();
        assert_eq!(old.output, Output::Keys);
        assert!(old.xbox.is_empty());
    }
}
