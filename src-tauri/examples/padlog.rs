//! every nintendo pad SDL sees, as 1up sees it, and every press: `cargo run --example padlog` in src-tauri, ctrl c
//! to stop

fn main() {
    env_logger_free_log();
    oneup_lib::sdl::spawn(|event| println!("{event:?}"));
    loop {
        std::thread::park();
    }
}

/// SDL's own lines (`log`) printed too, without a logger crate
fn env_logger_free_log() {
    struct Stdout;
    impl log::Log for Stdout {
        fn enabled(&self, _: &log::Metadata) -> bool {
            true
        }
        fn log(&self, record: &log::Record) {
            println!("{} {}", record.level(), record.args());
        }
        fn flush(&self) {}
    }
    let _ = log::set_logger(&Stdout);
    log::set_max_level(log::LevelFilter::Info);
}
