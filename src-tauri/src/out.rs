//! windows' outputs: a virtual xbox 360 pad per pad set to xbox (vigembus, through vigem-client), and the keys
//! (keys.rs). vigembus missing: keys only, and 1up looks for it again every few seconds, so installing it needs no
//! restart

use crate::engine::{Driver, Sink};
use crate::keys::{self, Keys};
use crate::mapping::Out;
use std::collections::{BTreeSet, HashMap};
use std::sync::Arc;
use std::time::{Duration, Instant};
use vigem_client::{Client, TargetId, XButtons, XGamepad, Xbox360Wired};

/// how often a missing vigembus is looked for again
const LOOK_AGAIN: Duration = Duration::from_secs(3);

struct Pad {
    target: Xbox360Wired<Arc<Client>>,
    /// windows' number for it, 1 to 4, once windows gave one
    slot: Option<u8>,
}

pub struct Windows {
    client: Option<Arc<Client>>,
    looked: Instant,
    pads: HashMap<u32, Pad>,
    keys: Keys,
}

fn connect() -> Option<Arc<Client>> {
    match Client::connect() {
        Ok(client) => Some(Arc::new(client)),
        Err(e) => {
            log::warn!("vigembus: {e:?}, no xbox pads until it is installed");
            None
        }
    }
}

impl Windows {
    pub fn new() -> Windows {
        Windows { client: connect(), looked: Instant::now(), pads: HashMap::new(), keys: Keys::default() }
    }

    fn client(&mut self) -> Option<Arc<Client>> {
        if self.client.is_none() && self.looked.elapsed() > LOOK_AGAIN {
            self.looked = Instant::now();
            self.client = connect();
        }
        self.client.clone()
    }

    /// the pad's virtual xbox pad, plugged in now if it had none
    fn plugged(&mut self, pad: u32) -> Option<&mut Pad> {
        if !self.pads.contains_key(&pad) {
            let client = self.client()?;
            let mut target = Xbox360Wired::new(client, TargetId::XBOX360_WIRED);
            if let Err(e) = target.plugin().and_then(|_| target.wait_ready()) {
                log::error!("pad {pad}: no xbox pad ({e:?})");
                return None;
            }
            let slot = target.get_user_index().ok().map(|i| i as u8 + 1);
            log::info!("pad {pad}: xbox pad {slot:?}");
            self.pads.insert(pad, Pad { target, slot });
        }
        self.pads.get_mut(&pad)
    }
}

impl Sink for Windows {
    fn send(&mut self, pad: u32, out: Option<&Out>) {
        let (xbox, keys) = match out {
            Some(out) => (out.xbox, out.keys.clone()),
            None => (None, BTreeSet::new()),
        };
        match xbox {
            Some(r) => {
                if let Some(p) = self.plugged(pad) {
                    let report = XGamepad {
                        buttons: XButtons { raw: r.buttons },
                        left_trigger: r.lt,
                        right_trigger: r.rt,
                        thumb_lx: r.lx,
                        thumb_ly: r.ly,
                        thumb_rx: r.rx,
                        thumb_ry: r.ry,
                    };
                    if let Err(e) = p.target.update(&report) {
                        log::warn!("pad {pad}: xbox pad update ({e:?})");
                    }
                    if p.slot.is_none() {
                        p.slot = p.target.get_user_index().ok().map(|i| i as u8 + 1);
                    }
                }
            }
            // dropped: unplugged
            None => {
                self.pads.remove(&pad);
            }
        }
        let (ups, downs) = self.keys.set(pad, keys);
        keys::press(&ups, &downs);
    }

    fn slot(&self, pad: u32) -> Option<u8> {
        self.pads.get(&pad).and_then(|p| p.slot)
    }

    fn driver(&self) -> Driver {
        if self.client.is_some() { Driver::Ready } else { Driver::Missing }
    }
}

/// `Local\1up`, held while 1up runs: mario battle's windows app leaves the switch online pads to 1up while it exists
pub fn hold_mutex() {
    use windows_sys::Win32::System::Threading::CreateMutexW;
    let name: Vec<u16> = "Local\\1up".encode_utf16().chain([0]).collect();
    // never closed: windows lets go of it when 1up quits
    unsafe { CreateMutexW(std::ptr::null(), 0, name.as_ptr()) };
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use windows_sys::Win32::UI::Input::XboxController::{XINPUT_STATE, XInputGetState};

    /// needs vigembus: ci installs it on its windows runner, then runs `cargo test -- --ignored`. the bus's side is
    /// checked hard (it answers, it takes a pad, it lets go of it). the rest needs windows' own xbox 360 driver,
    /// which a windows server (ci's runners) lacks: there the pad never starts (WinError 483) and the test says so;
    /// on a windows pc it starts, takes a report, and xinput reads it back
    #[test]
    #[ignore]
    fn a_virtual_xbox_pad_plugs_in_and_reaches_xinput() {
        let client = Arc::new(Client::connect().expect("vigembus answers"));
        let mut target = Xbox360Wired::new(client, TargetId::XBOX360_WIRED);
        target.plugin().expect("plugged in");
        match target.wait_ready() {
            Ok(()) => {
                let report = XGamepad { buttons: XButtons { raw: 0x1000 }, left_trigger: 255, ..Default::default() };
                target.update(&report).expect("updated");
                thread::sleep(Duration::from_millis(500));
                target.update(&report).expect("updated again");
                let index = target.get_user_index().expect("windows gave the pad a number");
                let mut state: XINPUT_STATE = unsafe { std::mem::zeroed() };
                let got = unsafe { XInputGetState(index, &mut state) };
                assert_eq!(got, 0, "xinput sees pad {index}");
                assert_eq!(state.Gamepad.wButtons & 0x1000, 0x1000, "A held");
                assert_eq!(state.Gamepad.bLeftTrigger, 255, "LT pulled");
                eprintln!("xinput reads pad {index}: A held, LT pulled");
            }
            Err(e) => eprintln!("vigembus took the pad, windows did not start it ({e:?}): no xbox 360 driver here"),
        }
        target.unplug().expect("unplugged");
    }
}
