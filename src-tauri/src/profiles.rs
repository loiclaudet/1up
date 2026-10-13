//! the profiles 1up keeps: one per pad, by SDL's guid (which tells a nes pad (L) from its (R), and one switch pro
//! from another kind), in a json file in the app's config folder. a pad nobody changed has no entry: it plays its
//! family's defaults. a missing or broken file is no profile at all, never an error

use crate::family::Family;
use crate::mapping::Profile;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Saved {
    /// the pad's name when it was saved, for a person reading the file
    pub name: String,
    pub profile: Profile,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct File {
    version: u32,
    pads: BTreeMap<String, Saved>,
}

pub struct Store {
    path: Option<PathBuf>,
    file: File,
}

const VERSION: u32 = 1;

impl Store {
    /// the profiles saved at `path`
    pub fn load(path: PathBuf) -> Store {
        let file = match fs::read_to_string(&path) {
            Ok(text) => serde_json::from_str(&text).unwrap_or_else(|e| {
                log::warn!("profiles: {} unreadable ({e}), starting from the defaults", path.display());
                File::default()
            }),
            Err(_) => File::default(),
        };
        Store { path: Some(path), file }
    }

    /// profiles kept in memory only
    pub fn memory() -> Store {
        Store { path: None, file: File::default() }
    }

    /// a pad's profile: its own, else its family's defaults
    pub fn profile(&self, guid: &str, family: Family) -> Profile {
        match self.file.pads.get(guid) {
            Some(saved) => saved.profile.clone(),
            None => Profile::for_family(family),
        }
    }

    /// a pad's profile changed: kept, and written at once
    pub fn set(&mut self, guid: &str, name: &str, profile: Profile) {
        self.file.pads.insert(guid.to_string(), Saved { name: name.to_string(), profile });
        self.save();
    }

    fn save(&mut self) {
        let Some(path) = &self.path else {
            return;
        };
        self.file.version = VERSION;
        let write = || -> std::io::Result<()> {
            if let Some(dir) = path.parent() {
                fs::create_dir_all(dir)?;
            }
            // a whole new file, then a rename: a crash mid-write never leaves half a file
            let next = path.with_extension("json.next");
            fs::write(&next, serde_json::to_vec_pretty(&self.file)?)?;
            fs::rename(&next, path)
        };
        if let Err(e) = write() {
            log::error!("profiles: could not save {} ({e})", path.display());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::controls::Control;
    use crate::mapping::{Output, XButton, XTarget};

    fn scratch(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("1up-test-{}-{name}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        dir.join("profiles.json")
    }

    #[test]
    fn a_pad_nobody_changed_plays_its_familys_defaults_and_is_not_written() {
        let path = scratch("defaults");
        let store = Store::load(path.clone());
        assert_eq!(store.profile("guid-nes", Family::Nes), Profile::for_family(Family::Nes));
        assert!(!path.exists());
    }

    #[test]
    fn a_changed_profile_is_written_and_comes_back_after_a_restart() {
        let path = scratch("restart");
        let mut store = Store::load(path.clone());
        let mut nes = Profile::for_family(Family::Nes);
        nes.output = Output::Keys;
        nes.xbox.insert(Control::A, XTarget::Button(XButton::A));
        store.set("guid-nes-l", "Nintendo NES Controller (L)", nes.clone());
        assert!(path.exists());
        let again = Store::load(path.clone());
        assert_eq!(again.profile("guid-nes-l", Family::Nes), nes);
        // another pad of the family still plays the defaults
        assert_eq!(again.profile("guid-nes-r", Family::Nes), Profile::for_family(Family::Nes));
        let text = fs::read_to_string(&path).unwrap();
        assert!(text.contains("\"version\": 1") && text.contains("Nintendo NES Controller (L)"));
    }

    #[test]
    fn a_broken_file_is_no_profile() {
        let path = scratch("broken");
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, "{ not json").unwrap();
        let store = Store::load(path);
        assert_eq!(store.profile("x", Family::SwitchPro), Profile::for_family(Family::SwitchPro));
    }
}
