# building 1up

1up is a [tauri](https://tauri.app) app: rust reads the pads and sends what they map to, a react page draws them.

```bash
pnpm install
pnpm tauri dev                                    # the app, live reload (a mac shows the outputs as a preview)
pnpm dev                                          # the page alone in a browser, on a demo with fake pads
pnpm test                                         # the page's tests (vitest)
cargo test --manifest-path src-tauri/Cargo.toml   # the rust side's
```

building needs cmake: SDL 3 is built in and linked statically. on windows, fetch the driver's installer once before
building (it checks nefarius's signature and the file's hash):

```bash
powershell -ExecutionPolicy Bypass -File src-tauri/windows/fetch-driver.ps1
```

## how it is made

- SDL reads the pads on its own thread, with only its nintendo drivers on (`src-tauri/src/sdl.rs`).
- the engine maps them (`engine.rs`, `mapping.rs`, one profile per pad in `profiles.rs`).
- vigembus and `SendInput` send them (`out.rs`, `keys.rs`). without vigembus, 1up looks for it again every few
  seconds, and *install it* runs vigembus's installer again.
- the page draws a view of it all (`src/`). each pad is an svg drawn by 1up (`src/pictures/`).
- the installer is tauri's nsis one: after 1up's own files, `src-tauri/windows/hooks.nsh` runs vigembus's installer
  (shipped in `drivers/`, with its licence) unless the driver is there already.

## ci

`.github/workflows/ci.yml`: both test suites on windows and on a mac. on windows it also builds the installer,
installs it silently, checks it installed the driver, starts the installed 1up (SDL comes up, the driver answers),
then plugs a virtual xbox pad into the driver and reads it back. the installer comes out as an artifact, and a `v*`
tag drafts a release with it as `1up-setup.exe`, the name the readme's button links to.

the installer is signed for 1up's updater with the repo secret `TAURI_SIGNING_PRIVATE_KEY` (its public half in
`tauri.conf.json`; made with `pnpm tauri signer generate --ci -w ~/.tauri/1up.key`, kept in pass at
`1up/tauri-updater`), and the release's `latest.json` points at it: every installed 1up reads that file at launch
(`releases/latest/download/latest.json`) and offers the update. a tag needs the key, or its build stops.

publishing that release pushes the same installer to itch.io (`.github/workflows/itch.yml`, butler, the
`loiclaudet/1up:windows` channel, the repo secret `BUTLER_API_KEY`). a release published before that workflow:
`gh workflow run itch.yml -f tag=v0.1.0`.

## the demo and the pictures

`pnpm demo` builds the page with its demo as one file, `dist-demo/index.html`. its url sets it up:
`?pads=snes,nes` plugs in those pads, `?pad=2` shows the second, `?press=a,right` holds buttons on it,
`?left=-30000,0` pushes its left stick, `?driver=ready` shows windows with the driver (`missing` without it, a mac by
default), `?select=a` edits A, `?output=keys`, `?details`.

the readme's screenshots come from it: `python3 design/screenshots.py` (chrome and pillow) after `pnpm demo`. the logo
and the download button are drawn by `design/logo.py` and `design/button.py`; the design's reasons are in
`.impeccable.md`.
