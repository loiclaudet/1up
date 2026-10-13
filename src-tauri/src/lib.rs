//! 1up: every nintendo pad becomes a virtual xbox 360 pad or keyboard keys, remapped on a picture of the pad

pub mod sdl;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
        .setup(|_| {
            sdl::spawn(|event| log::info!("{event:?}"));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("1up: the app did not start");
}
