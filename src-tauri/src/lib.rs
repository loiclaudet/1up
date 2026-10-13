//! 1up: every nintendo pad becomes a virtual xbox 360 pad or keyboard keys, remapped on a picture of the pad. SDL
//! reads the pads on its own thread (sdl.rs), the engine maps them (engine.rs, mapping.rs) and sends the outputs,
//! the page draws a view of it and sends changes back

pub mod controls;
pub mod engine;
pub mod family;
pub mod keys;
pub mod mapping;
#[cfg(windows)]
pub mod out;
pub mod profiles;
pub mod sdl;

use engine::{Change, Engine, View};
#[cfg(not(windows))]
use engine::Preview;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::ipc::Channel;
use tauri::{Manager, State};

type Shared = Arc<Mutex<Engine>>;
type Page = Arc<Mutex<Option<Channel<View>>>>;

/// the page draws at most this often: the outputs never wait on it
const DRAW_EVERY: Duration = Duration::from_millis(16);

/// the page (re)loaded: it gets the view at once, then each change
#[tauri::command]
fn subscribe(engine: State<'_, Shared>, page: State<'_, Page>, channel: Channel<View>) {
    let _ = channel.send(engine.lock().unwrap().view());
    *page.lock().unwrap() = Some(channel);
}

/// one change to a pad's profile
#[tauri::command]
fn change(engine: State<'_, Shared>, pad: u32, change: Change) -> Result<(), String> {
    engine.lock().unwrap().change(pad, change)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let page: Page = Arc::default();
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
        .setup({
            let page = page.clone();
            move |app| {
                let store = match app.path().app_config_dir() {
                    Ok(dir) => profiles::Store::load(dir.join("profiles.json")),
                    Err(_) => profiles::Store::memory(),
                };
                #[cfg(windows)]
                let sink: Box<dyn engine::Sink> = {
                    out::hold_mutex();
                    Box::new(out::Windows::new())
                };
                #[cfg(not(windows))]
                let sink: Box<dyn engine::Sink> = Box::new(Preview);
                let engine: Shared = Arc::new(Mutex::new(Engine::new(store, sink)));
                app.manage(engine.clone());
                let from_sdl = engine.clone();
                sdl::spawn(move |event| from_sdl.lock().unwrap().on(event));
                thread::spawn(move || loop {
                    thread::sleep(DRAW_EVERY);
                    let view = engine.lock().unwrap().view_if_changed();
                    if let (Some(view), Some(channel)) = (view, page.lock().unwrap().as_ref()) {
                        let _ = channel.send(view);
                    }
                });
                Ok(())
            }
        })
        .manage(page)
        .invoke_handler(tauri::generate_handler![subscribe, change])
        .run(tauri::generate_context!())
        .expect("1up: the app did not start");
}
