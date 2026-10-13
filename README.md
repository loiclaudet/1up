# 1up

a free rewasd for nintendo pads on windows.

windows lists the switch online nes and famicom pads, the switch pro controller and the joy-cons, but most games and
emulators can't read them. 1up reads them and turns each into a virtual xbox 360 pad, or into keyboard keys,
remapped on a picture of the pad.

in the works.

## develop

```bash
pnpm install
pnpm tauri dev                                    # the app, live reload
pnpm test                                         # the page's tests (vitest)
cargo test --manifest-path src-tauri/Cargo.toml   # the rust side's
```

ci (`.github/workflows/ci.yml`) runs both test suites on windows and on a mac, then builds the windows app on a
windows runner: the nsis installer and the bare exe, as an artifact. a `v*` tag turns them into a draft release.
