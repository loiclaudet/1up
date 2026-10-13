//! the pads 1up holds: each one's family, what it holds now, its profile, and what that sends. SDL's thread feeds it
//! events (sdl.rs), the page reads a view of it and changes profiles through commands (lib.rs), and a `Sink` sends
//! the outputs (xbox.rs and keys.rs on windows, nothing on a mac: the page's preview)

use crate::controls::{self, Control, Held, Label, Stick};
use crate::family::Family;
use crate::mapping::{self, Out, Output, Preset, Profile, Scan, StickKeys, StickTarget, XTarget};
use crate::profiles::Store;
use crate::sdl::{Event, Info};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// where the outputs go
pub trait Sink: Send {
    /// a pad's output now: `Some` on each change, `None` when it left (its xbox pad unplugged, its keys let go)
    fn send(&mut self, pad: u32, out: Option<&Out>);
    /// the xbox pad's number windows gave a pad (1 to 4), when it has one
    fn slot(&self, pad: u32) -> Option<u8>;
    /// whether the virtual xbox pads can be made (vigembus installed)
    fn driver(&self) -> Driver;
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Driver {
    /// vigembus answers
    Ready,
    /// windows, but vigembus is not installed: keys only
    Missing,
    /// not windows: outputs are a preview
    Preview,
}

/// no output at all: a mac, where the page shows what windows would send
pub struct Preview;

impl Sink for Preview {
    fn send(&mut self, _: u32, _: Option<&Out>) {}
    fn slot(&self, _: u32) -> Option<u8> {
        None
    }
    fn driver(&self) -> Driver {
        Driver::Preview
    }
}

struct Pad {
    info: Info,
    family: Family,
    faces: [Label; 4],
    held: Held,
    profile: Profile,
    out: Out,
}

pub struct Engine {
    pads: BTreeMap<u32, Pad>,
    store: Store,
    sink: Box<dyn Sink>,
    /// something the page shows changed since it last looked
    dirty: bool,
}

/// one change to a pad's profile, from the page
#[derive(Clone, Debug, PartialEq, Deserialize)]
#[serde(tag = "do", rename_all = "kebab-case")]
pub enum Change {
    Output { output: Output },
    Preset { preset: Preset },
    Reset,
    Xbox { control: Control, target: Option<XTarget> },
    Key { control: Control, key: Option<Scan> },
    XboxStick { stick: Stick, target: Option<StickTarget> },
    KeyStick { stick: Stick, keys: Option<StickKeys> },
}

impl Engine {
    pub fn new(store: Store, sink: Box<dyn Sink>) -> Engine {
        Engine { pads: BTreeMap::new(), store, sink, dirty: true }
    }

    pub fn on(&mut self, event: Event) {
        match event {
            Event::Added(info) => {
                let family = Family::of(&info.kind, &info.name, info.product);
                let faces = info.faces.map(Label::of_sdl);
                let profile = self.store.profile(&info.guid, family);
                log::info!("pad {}: {} ({family:?}, {:04x}:{:04x})", info.id, info.name, info.vendor, info.product);
                let id = info.id;
                self.pads.insert(id, Pad { info, family, faces, held: Held::default(), profile, out: Out::default() });
                self.send(id, true);
            }
            Event::Removed { id } => {
                if self.pads.remove(&id).is_some() {
                    log::info!("pad {id}: gone");
                    self.sink.send(id, None);
                    self.dirty = true;
                }
            }
            Event::Button { id, button, down } => {
                if let Some(pad) = self.pads.get_mut(&id) {
                    pad.held.button(controls::control(button, &pad.faces), down);
                    self.send(id, false);
                }
            }
            Event::Axis { id, axis, value } => {
                if let Some(pad) = self.pads.get_mut(&id) {
                    pad.held.axis(axis, value);
                    self.send(id, false);
                }
            }
        }
    }

    /// what the pad sends now, to the sink when it changed (always on `fresh`, a pad just added)
    fn send(&mut self, id: u32, fresh: bool) {
        let Some(pad) = self.pads.get_mut(&id) else {
            return;
        };
        let out = mapping::apply(&pad.profile, &pad.held);
        if fresh || out != pad.out {
            self.sink.send(id, Some(&out));
            pad.out = out;
        }
        self.dirty = true;
    }

    /// a change from the page: applied, saved, and sent at once
    pub fn change(&mut self, id: u32, change: Change) -> Result<(), String> {
        let pad = self.pads.get_mut(&id).ok_or_else(|| format!("no pad {id}"))?;
        let p = &mut pad.profile;
        match change {
            Change::Output { output } => p.output = output,
            Change::Preset { preset } => p.preset(pad.family, preset),
            Change::Reset => *p = Profile::for_family(pad.family),
            Change::Xbox { control, target } => set(&mut p.xbox, control, target),
            Change::Key { control, key } => set(&mut p.keys, control, key),
            Change::XboxStick { stick, target } => set(&mut p.xbox_sticks, stick, target),
            Change::KeyStick { stick, keys } => set(&mut p.key_sticks, stick, keys),
        }
        self.store.set(&pad.info.guid, &pad.info.name, pad.profile.clone());
        self.send(id, false);
        Ok(())
    }

    /// the view the page draws, when something changed since it last asked
    pub fn view_if_changed(&mut self) -> Option<View> {
        if !self.dirty {
            return None;
        }
        self.dirty = false;
        Some(self.view())
    }

    pub fn view(&self) -> View {
        View {
            driver: self.sink.driver(),
            pads: self
                .pads
                .iter()
                .map(|(id, pad)| PadView {
                    id: *id,
                    name: pad.info.name.clone(),
                    family: pad.family,
                    controls: pad.family.controls().to_vec(),
                    sticks: pad.family.sticks().to_vec(),
                    held: pad.held.clone(),
                    profile: pad.profile.clone(),
                    out: pad.out.clone(),
                    slot: self.sink.slot(*id),
                    guid: pad.info.guid.clone(),
                    vendor: pad.info.vendor,
                    product: pad.info.product,
                    kind: pad.info.kind.clone(),
                    mapping: pad.info.mapping.clone(),
                })
                .collect(),
        }
    }
}

fn set<K: Ord, V>(map: &mut BTreeMap<K, V>, key: K, value: Option<V>) {
    match value {
        Some(v) => map.insert(key, v),
        None => map.remove(&key),
    };
}

/// everything the page draws
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct View {
    pub driver: Driver,
    pub pads: Vec<PadView>,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct PadView {
    pub id: u32,
    pub name: String,
    pub family: Family,
    pub controls: Vec<Control>,
    pub sticks: Vec<Stick>,
    pub held: Held,
    pub profile: Profile,
    pub out: Out,
    pub slot: Option<u8>,
    pub guid: String,
    pub vendor: u16,
    pub product: u16,
    pub kind: String,
    pub mapping: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mapping::{XButton, scan};
    use std::sync::{Arc, Mutex};

    /// what a sink was sent, in order
    type Sent = Arc<Mutex<Vec<(u32, Option<Out>)>>>;

    /// a sink that records what it is sent
    #[derive(Clone, Default)]
    struct Recorder(Sent);

    impl Sink for Recorder {
        fn send(&mut self, pad: u32, out: Option<&Out>) {
            self.0.lock().unwrap().push((pad, out.cloned()));
        }
        fn slot(&self, _: u32) -> Option<u8> {
            Some(1)
        }
        fn driver(&self) -> Driver {
            Driver::Ready
        }
    }

    fn nes(id: u32) -> Event {
        Event::Added(Info {
            id,
            name: "Nintendo NES Controller (L)".into(),
            kind: "standard".into(),
            vendor: 0x057e,
            product: 0x2007,
            guid: format!("guid-{id}"),
            mapping: String::new(),
            // a classic: SDL puts its labels A, B on south and east
            faces: [1, 2, 3, 4],
        })
    }

    fn engine() -> (Engine, Recorder) {
        let recorder = Recorder::default();
        (Engine::new(Store::memory(), Box::new(recorder.clone())), recorder)
    }

    fn last(recorder: &Recorder) -> (u32, Option<Out>) {
        recorder.0.lock().unwrap().last().cloned().unwrap()
    }

    #[test]
    fn a_nes_pad_plugged_in_sends_an_xbox_pad_at_rest_then_its_presses() {
        let (mut engine, sent) = engine();
        engine.on(nes(7));
        assert_eq!(last(&sent), (7, Some(Out { xbox: Some(Default::default()), ..Out::default() })));
        // SDL's south is this pad's A: by position, xbox B
        engine.on(Event::Button { id: 7, button: 0, down: true });
        assert_eq!(last(&sent).1.unwrap().xbox.unwrap().buttons, XButton::B.bit());
        engine.on(Event::Button { id: 7, button: 0, down: false });
        assert_eq!(last(&sent).1.unwrap().xbox.unwrap().buttons, 0);
        let count = sent.0.lock().unwrap().len();
        // a release of what was not held changes nothing: nothing is sent
        engine.on(Event::Button { id: 7, button: 0, down: false });
        assert_eq!(sent.0.lock().unwrap().len(), count);
    }

    #[test]
    fn a_pad_leaving_is_unplugged() {
        let (mut engine, sent) = engine();
        engine.on(nes(3));
        engine.on(Event::Removed { id: 3 });
        assert_eq!(last(&sent), (3, None));
        assert!(engine.view().pads.is_empty());
        // events for a pad that left are ignored
        engine.on(Event::Button { id: 3, button: 0, down: true });
        assert_eq!(last(&sent), (3, None));
    }

    #[test]
    fn the_page_changes_a_profile_and_it_applies_at_once() {
        let (mut engine, sent) = engine();
        engine.on(nes(1));
        engine.on(Event::Button { id: 1, button: 0, down: true });
        engine.change(1, Change::Preset { preset: Preset::Label }).unwrap();
        assert_eq!(last(&sent).1.unwrap().xbox.unwrap().buttons, XButton::A.bit());
        engine.change(1, Change::Output { output: Output::Keys }).unwrap();
        let out = last(&sent).1.unwrap();
        assert_eq!((out.xbox, out.keys.into_iter().collect::<Vec<_>>()), (None, vec![scan::X]));
        engine.change(1, Change::Key { control: Control::A, key: Some(0x39) }).unwrap();
        assert_eq!(last(&sent).1.unwrap().keys.into_iter().collect::<Vec<_>>(), vec![0x39]);
        engine.change(1, Change::Key { control: Control::A, key: None }).unwrap();
        assert!(last(&sent).1.unwrap().keys.is_empty());
        engine.change(1, Change::Reset).unwrap();
        assert_eq!(engine.view().pads[0].profile, Profile::for_family(Family::Nes));
        assert!(engine.change(9, Change::Reset).is_err());
    }

    #[test]
    fn the_view_names_each_pad_and_shows_what_it_holds_and_sends() {
        let (mut engine, _) = engine();
        assert!(engine.view_if_changed().is_some());
        assert!(engine.view_if_changed().is_none());
        engine.on(nes(2));
        engine.on(Event::Button { id: 2, button: 11, down: true });
        let view = engine.view_if_changed().unwrap();
        let pad = &view.pads[0];
        assert_eq!((pad.family, pad.slot, view.driver), (Family::Nes, Some(1), Driver::Ready));
        assert!(pad.held.controls.contains(&Control::Up));
        assert_eq!(pad.out.xbox.unwrap().buttons, XButton::Up.bit());
        let json = serde_json::to_value(&view).unwrap();
        assert_eq!(json["pads"][0]["family"], "nes");
        assert_eq!(json["pads"][0]["held"]["controls"][0], "up");
        assert_eq!(json["driver"], "ready");
    }

    #[test]
    fn changes_come_from_the_page_as_tagged_json() {
        let c: Change = serde_json::from_str(r#"{"do":"xbox","control":"a","target":"lstick-up"}"#).unwrap();
        assert_eq!(c, Change::Xbox { control: Control::A, target: Some(XTarget::LeftStick(mapping::Dir::Up)) });
        let c: Change = serde_json::from_str(r#"{"do":"key-stick","stick":"left","keys":null}"#).unwrap();
        assert_eq!(c, Change::KeyStick { stick: Stick::Left, keys: None });
        let c: Change = serde_json::from_str(r#"{"do":"output","output":"off"}"#).unwrap();
        assert_eq!(c, Change::Output { output: Output::Off });
    }
}
