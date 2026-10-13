# 1up

a free rewasd for nintendo pads on windows.

windows lists the switch online nes and famicom pads, the switch pro controller and the joy-cons, but most games
and emulators can't read them. 1up reads them and turns each into a virtual xbox 360 pad, or into keyboard keys,
with each button's mapping written on a picture of the pad.

![1up with a switch pro controller: each button's mapping written beside it](docs/screenshot.png)

## use it

1. install [vigembus](https://github.com/nefarius/ViGEmBus/releases/latest), the driver that makes the virtual xbox
   pads. keys work without it.
2. pair your pad in windows' bluetooth settings.
3. open 1up. the pad shows up, drawn as it is; press its buttons and each one lights, with what it sends.
4. click a button to change what it sends. *by position*, the default, puts nintendo's A where an xbox pad has its
   B, as most games and emulators expect. *by label* keeps A as A.
5. close the window: 1up keeps running in the tray. *start with windows* keeps it there from the start.

1up reads the switch online nes, famicom, snes, n64 and genesis pads, the switch pro controller, and the joy-cons
alone or paired. all of them are drawn but the n64 and genesis pads and a lone joy-con, which show a schematic for
now.

## known limits

- a game that also reads the nintendo pad itself (steam with its switch support on, an sdl based emulator) sees it
  twice: once as itself, once as 1up's xbox pad. turn one of them off there.
- a game running as administrator ignores the keys 1up types (windows keeps a normal app's keystrokes out of it):
  run 1up as administrator too, or use the xbox pad, which has no such limit.
- windows may warn about an unknown publisher: 1up isn't signed. *more info*, then *run anyway*.
- a pad misbehaving? *details* (top right) has a report to copy into an issue.

## develop

```bash
pnpm install
pnpm tauri dev                                    # the app, live reload (a mac shows the outputs as a preview)
pnpm dev                                          # the interface alone in a browser, on a demo with fake pads
pnpm test                                         # the page's tests (vitest)
cargo test --manifest-path src-tauri/Cargo.toml   # the rust side's
```

building from source needs cmake: SDL 3 is built in and linked statically. ci (`.github/workflows/ci.yml`) runs
both test suites on windows and on a mac, checks a virtual pad on a real vigembus, and builds the windows app: the
installer and a portable exe. a `v*` tag turns them into a draft release.

how it is made: SDL reads the pads on its own thread with only its nintendo drivers on (`src-tauri/src/sdl.rs`),
the engine maps them (`engine.rs`, `mapping.rs`), vigembus and `SendInput` send them (`out.rs`, `keys.rs`), and the
page draws a view of it (`src/`). the design's reasons are in `.impeccable.md`.

## credits

- [SDL](https://libsdl.org) (zlib) reads the pads.
- [vigem-client](https://github.com/CasualX/vigem-client) (mit) talks to [vigembus](https://github.com/nefarius/ViGEmBus)
  (bsd 3-clause, by nefarius).
- Darker Grotesque and Onest (sil open font licence).

1up is not affiliated with, endorsed or sponsored by Nintendo. Nintendo, Nintendo Switch, Joy-Con, Nintendo
Entertainment System and Family Computer are trademarks of Nintendo; they are named here only to say which pads
1up works with. the pads are drawn by 1up and carry no logo.

## licence

mit, see [LICENSE](LICENSE).
