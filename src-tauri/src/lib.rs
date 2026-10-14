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
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, State, WindowEvent};

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

/// the text to paste in a bug report, and the folder of the log file
#[tauri::command]
fn details(app: AppHandle, engine: State<'_, Shared>) -> (String, String) {
    let logs = app.path().app_log_dir().map(|d| d.display().to_string()).unwrap_or_default();
    let system = format!("{} {}", std::env::consts::OS, std::env::consts::ARCH);
    let version = app.package_info().version.to_string();
    (engine::report(&engine.lock().unwrap().view(), &version, &system, &logs), logs)
}

/// the xbox pads' driver, installed with vigembus's installer that 1up ships (windows: 1up's installer runs it, this
/// runs it again). `Ok(false)`: no installer here (a build of one's own), the page links to vigembus instead
#[tauri::command]
async fn install_driver(app: AppHandle, engine: State<'_, Shared>) -> Result<bool, String> {
    #[cfg(windows)]
    {
        let installer = app
            .path()
            .resolve("drivers/vigembus-setup.exe", tauri::path::BaseDirectory::Resource)
            .map_err(|e| e.to_string())?;
        if !installer.exists() {
            return Ok(false);
        }
        let done = tauri::async_runtime::spawn_blocking(move || out::install_driver(&installer))
            .await
            .map_err(|e| e.to_string())?;
        engine.lock().unwrap().driver_installed();
        done.map(|()| true)
    }
    #[cfg(not(windows))]
    {
        let _ = (app, engine);
        Ok(false)
    }
}

/// the window, shown and in front: the tray's click, a second launch
fn show(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// started by windows at login (`--hidden`, see the autostart plugin): straight to the tray
const HIDDEN: &str = "--hidden";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let page: Page = Arc::default();
    tauri::Builder::default()
        // first: a second 1up shows this one and quits
        .plugin(tauri_plugin_single_instance::init(|app, _, _| show(app)))
        .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec![HIDDEN])))
        .plugin(tauri_plugin_opener::init())
        // the page asks at launch whether a newer 1up is out (github's latest.json), and installs it on a click
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .on_window_event(|window, event| {
            // closing keeps 1up running in the tray: the pads keep working while a game plays
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .setup({
            let page = page.clone();
            move |app| {
                let shown = MenuItem::with_id(app, "show", "Show 1up", true, None::<&str>)?;
                let quit = MenuItem::with_id(app, "quit", "Quit 1up", true, None::<&str>)?;
                let mut tray = TrayIconBuilder::with_id("1up")
                    .tooltip("1up")
                    .menu(&Menu::with_items(app, &[&shown, &quit])?)
                    .show_menu_on_left_click(false)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "show" => show(app),
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                            show(tray.app_handle());
                        }
                    });
                if let Some(icon) = app.default_window_icon() {
                    tray = tray.icon(icon.clone());
                }
                tray.build(app)?;
                if let Some(window) = app.get_webview_window("main")
                    && std::env::args().any(|a| a == HIDDEN)
                {
                    let _ = window.hide();
                }

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
                    let view = {
                        let mut engine = engine.lock().unwrap();
                        engine.tick();
                        engine.view_if_changed()
                    };
                    if let (Some(view), Some(channel)) = (view, page.lock().unwrap().as_ref()) {
                        let _ = channel.send(view);
                    }
                });
                Ok(())
            }
        })
        .manage(page)
        .invoke_handler(tauri::generate_handler![subscribe, change, details, install_driver])
        .run(tauri::generate_context!())
        .expect("1up: the app did not start");
}
