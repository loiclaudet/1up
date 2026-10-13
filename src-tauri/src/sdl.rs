//! SDL on its own thread, nintendo pads only. its hidapi drivers read the switch pro, the joy-cons and the switch
//! online pads (nes, famicom, snes, n64, genesis); every other backend (xinput, rawinput, directinput, gameinput,
//! wgi, a mac's game controller and iokit) is off and every vendor and product but nintendo's pads is ignored, so 1up
//! never opens anything else, its own virtual xbox pads included. input keeps coming while a game has focus

use sdl3_sys::everything::*;
use std::ffi::{CStr, c_char};
use std::thread;

/// every nintendo pad SDL knows (src/joystick/usb_ids.h): the joy-cons alone, paired and in their grip, the switch
/// pro, the switch online snes, n64 and genesis pads (the nes and famicom ones come as a joy-con r), and the switch 2
/// pads
pub const NINTENDO_PADS: &CStr = c"0x057E/0x2006,0x057E/0x2007,0x057E/0x2008,0x057E/0x200E,0x057E/0x2009,\
0x057E/0x2017,0x057E/0x2019,0x057E/0x201E,0x057E/0x2066,0x057E/0x2067,0x057E/0x2068,0x057E/0x2069,0x057E/0x2073";

/// set before SDL starts
const HINTS: [(&CStr, &CStr); 10] = [
    (c"SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS", c"1"),
    (c"SDL_GAMECONTROLLER_IGNORE_DEVICES_EXCEPT", NINTENDO_PADS),
    (c"SDL_JOYSTICK_HIDAPI", c"1"),
    (c"SDL_JOYSTICK_RAWINPUT", c"0"),
    (c"SDL_XINPUT_ENABLED", c"0"),
    (c"SDL_JOYSTICK_DIRECTINPUT", c"0"),
    (c"SDL_JOYSTICK_GAMEINPUT", c"0"),
    (c"SDL_JOYSTICK_WGI", c"0"),
    (c"SDL_JOYSTICK_MFI", c"0"),
    (c"SDL_JOYSTICK_IOKIT", c"0"),
];

/// what SDL reports, in SDL's own numbers: a pad's instance id, its buttons (SDL_GamepadButton) and axes
/// (SDL_GamepadAxis, -32768..32767, the triggers 0..32767)
#[derive(Clone, Debug, PartialEq)]
pub enum Event {
    Added(Info),
    Removed { id: u32 },
    Button { id: u32, button: u8, down: bool },
    Axis { id: u32, axis: u8, value: i16 },
}

/// a pad as SDL names it
#[derive(Clone, Debug, PartialEq)]
pub struct Info {
    pub id: u32,
    pub name: String,
    /// SDL's type string: `switchpro`, `joyconleft`, `joyconright`, `joyconpair`, `standard` (the classic pads)
    pub kind: String,
    pub vendor: u16,
    pub product: u16,
    pub guid: String,
    pub mapping: String,
}

/// starts SDL on a thread of its own; `on` gets every event, in order, on that thread
pub fn spawn(mut on: impl FnMut(Event) + Send + 'static) {
    thread::spawn(move || unsafe { run(&mut on) });
}

unsafe fn text(p: *const c_char) -> String {
    if p.is_null() { String::new() } else { unsafe { CStr::from_ptr(p) }.to_string_lossy().into_owned() }
}

unsafe fn run(on: &mut impl FnMut(Event)) {
    unsafe {
        for (name, value) in HINTS {
            SDL_SetHint(name.as_ptr(), value.as_ptr());
        }
        if !SDL_Init(SDL_INIT_GAMEPAD) {
            log::error!("sdl: {}", text(SDL_GetError()));
            return;
        }
        log::info!("sdl: up, nintendo pads only");
        let mut open: Vec<(u32, *mut SDL_Gamepad)> = vec![];
        let mut event: SDL_Event = std::mem::zeroed();
        loop {
            if !SDL_WaitEventTimeout(&mut event, 100) {
                continue;
            }
            let kind = SDL_EventType(event.r#type);
            if kind == SDL_EVENT_GAMEPAD_ADDED {
                let id = event.gdevice.which;
                let pad = SDL_OpenGamepad(id);
                if pad.is_null() {
                    log::warn!("sdl: pad {} did not open: {}", id.0, text(SDL_GetError()));
                    continue;
                }
                open.push((id.0, pad));
                let mut guid = [0 as c_char; 33];
                SDL_GUIDToString(SDL_GetGamepadGUIDForID(id), guid.as_mut_ptr(), guid.len() as i32);
                let mapping = SDL_GetGamepadMapping(pad);
                let info = Info {
                    id: id.0,
                    name: text(SDL_GetGamepadName(pad)),
                    kind: text(SDL_GetGamepadStringForType(SDL_GetGamepadType(pad))),
                    vendor: SDL_GetGamepadVendor(pad),
                    product: SDL_GetGamepadProduct(pad),
                    guid: text(guid.as_ptr()),
                    mapping: text(mapping),
                };
                SDL_free(mapping.cast());
                on(Event::Added(info));
            } else if kind == SDL_EVENT_GAMEPAD_REMOVED {
                let id = event.gdevice.which.0;
                if let Some(at) = open.iter().position(|(open, _)| *open == id) {
                    SDL_CloseGamepad(open.remove(at).1);
                }
                on(Event::Removed { id });
            } else if kind == SDL_EVENT_GAMEPAD_BUTTON_DOWN || kind == SDL_EVENT_GAMEPAD_BUTTON_UP {
                let b = event.gbutton;
                on(Event::Button { id: b.which.0, button: b.button, down: b.down });
            } else if kind == SDL_EVENT_GAMEPAD_AXIS_MOTION {
                let a = event.gaxis;
                on(Event::Axis { id: a.which.0, axis: a.axis, value: a.value });
            }
        }
    }
}
