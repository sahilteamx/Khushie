function music() {
  const audio = $("#birthdayAudio");
  const player = $("#musicPlayer");

  if (!audio || !player) return;

  const toggle = $("#musicToggle");
  const mute = $("#musicMute");
  const volume = $("#musicVolume");
  const progress = $("#musicProgress");
  const time = $("#musicTime");
  const status = $("#musicStatus");
  const close = $("#musicClose");

  const storageKey = "khushiMusic";
  const source = audio.dataset.src || "";

  // Keep exactly one audio element in this page instance.
  audio.loop = true;

  const save = (key, value) => {
    setStorage(sessionStorage, `${storageKey}:${key}`, String(value));
  };

  const read = (key, fallback = "0") => {
    return getStorage(sessionStorage, `${storageKey}:${key}`, fallback);
  };

  const ensureSource = () => {
    if (!audio.src && source) {
      audio.src = source;
    }

    return Boolean(audio.src);
  };

  /* --------------------------------
     VOLUME / MUTE
  -------------------------------- */

  let userVolume = Number(
    getStorage(localStorage, `${storageKey}:volume`, "0.8")
  );

  if (!Number.isFinite(userVolume) || userVolume < 0 || userVolume > 1) {
    userVolume = 0.8;
  }

  audio.volume = userVolume;

  audio.muted =
    getStorage(localStorage, `${storageKey}:muted`, "0") === "1";

  if (volume) {
    volume.value = String(userVolume);
  }

  /* --------------------------------
     RESTORE PLAYBACK STATE
  -------------------------------- */

  const savedTime = Number(read("time", "0"));
  const wasPlaying = read("playing", "0") === "1";

  let restored = false;

  const restorePosition = () => {
    if (restored) return;

    if (
      Number.isFinite(savedTime) &&
      savedTime > 0 &&
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      audio.currentTime = Math.min(
        savedTime,
        Math.max(0, audio.duration - 0.05)
      );
    }

    restored = true;
    sync();
  };

  /* --------------------------------
     TIME FORMAT
  -------------------------------- */

  const fmt = (seconds) => {
    if (!Number.isFinite(seconds)) return "00:00";

    const total = Math.max(0, Math.floor(seconds));

    return (
      `${String(Math.floor(total / 60)).padStart(2, "0")}:` +
      `${String(total % 60).padStart(2, "0")}`
    );
  };

  /* --------------------------------
     UI SYNC
  -------------------------------- */

  const sync = () => {
    const playing = !audio.paused && !audio.ended;

    player.classList.toggle("is-playing", playing);

    toggle?.setAttribute(
      "aria-pressed",
      String(playing)
    );

    toggle?.setAttribute(
      "aria-label",
      playing
        ? "Pause birthday music"
        : "Play birthday music"
    );

    if (status) {
      if (audio.error) {
        status.textContent = "Music file unavailable";
      } else if (playing) {
        status.textContent = "Playing";
      } else if (audio.currentTime > 0) {
        status.textContent = "Ready to resume";
      } else {
        status.textContent = "Tap to play";
      }
    }

    if (time) {
      time.textContent =
        `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    }

    if (progress) {
      progress.value =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? String(
              (audio.currentTime / audio.duration) * 100
            )
          : "0";
    }

    if (mute) {
      mute.textContent = audio.muted ? "U" : "M";

      mute.setAttribute(
        "aria-label",
        audio.muted
          ? "Unmute music"
          : "Mute music"
      );
    }
  };

  /* --------------------------------
     SAVE CURRENT STATE
  -------------------------------- */

  const persist = () => {
    if (
      Number.isFinite(audio.currentTime) &&
      audio.currentTime >= 0
    ) {
      save("time", audio.currentTime);
    }

    save(
      "playing",
      !audio.paused && !audio.ended ? "1" : "0"
    );
  };

  /* --------------------------------
     PLAY / PAUSE
  -------------------------------- */

  const playMusic = async () => {
    if (!ensureSource()) {
      if (status) {
        status.textContent =
          "Audio source is not configured";
      }
      return false;
    }

    try {
      await audio.play();
      save("playing", "1");
      sync();
      return true;
    } catch (error) {
      if (status) {
        status.textContent =
          error?.name === "NotAllowedError"
            ? "Tap play to continue music"
            : "Music could not be played";
      }

      sync();
      return false;
    }
  };

  const pauseMusic = () => {
    audio.pause();
    persist();
    sync();
  };

  toggle?.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (audio.paused) {
      await playMusic();
    } else {
      pauseMusic();
    }
  });

  /* --------------------------------
     AUDIO EVENTS
  -------------------------------- */

  audio.addEventListener("loadedmetadata", () => {
    restorePosition();

    /*
      A new HTML page cannot inherit autoplay permission
      from the previous page.

      We TRY to resume first.
      If browser blocks it, the first real user interaction
      can resume the soundtrack without changing the player.
    */
    if (wasPlaying && audio.paused) {
      audio.play()
        .then(() => {
          save("playing", "1");
          sync();
        })
        .catch(() => {
          if (status) {
            status.textContent =
              "Tap anywhere to continue music";
          }
          sync();
        });
    }
  });

  [
    "play",
    "playing",
    "pause",
    "timeupdate",
    "loadedmetadata",
    "durationchange",
    "canplay",
    "volumechange"
  ].forEach((eventName) => {
    audio.addEventListener(eventName, sync);
  });

  audio.addEventListener("play", () => {
    save("playing", "1");
    sync();
  });

  audio.addEventListener("pause", () => {
    persist();
    sync();
  });

  audio.addEventListener("ended", () => {
    /*
      loop=true normally prevents this from being visible
      to the user, but clear saved state safely if it does end.
    */
    save("time", "0");
    save("playing", "0");
    sync();
  });

  audio.addEventListener("error", () => {
    if (status) {
      status.textContent = "Add music/birthday.mp3";
    }

    sync();
  });

  /* --------------------------------
     RESUME ON FIRST USER INTERACTION
  -------------------------------- */

  if (wasPlaying) {
    const resumeFromInteraction = async () => {
      if (!audio.paused) return;

      const resumed = await playMusic();

      if (resumed) {
        document.removeEventListener(
          "pointerdown",
          resumeFromInteraction
        );

        document.removeEventListener(
          "keydown",
          resumeFromInteraction
        );

        document.removeEventListener(
          "touchstart",
          resumeFromInteraction
        );
      }
    };

    document.addEventListener(
      "pointerdown",
      resumeFromInteraction,
      { passive: true }
    );

    document.addEventListener(
      "keydown",
      resumeFromInteraction,
      { passive: true }
    );

    document.addEventListener(
      "touchstart",
      resumeFromInteraction,
      { passive: true }
    );
  }

  /* --------------------------------
     SAVE WHILE LEAVING PAGE
  -------------------------------- */

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        persist();
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "pagehide",
    persist,
    { passive: true }
  );

  window.addEventListener(
    "beforeunload",
    persist,
    { passive: true }
  );

  /* --------------------------------
     VOLUME
  -------------------------------- */

  volume?.addEventListener("input", () => {
    const nextVolume = Number(volume.value);

    if (!Number.isFinite(nextVolume)) return;

    userVolume = Math.min(
      1,
      Math.max(0, nextVolume)
    );

    audio.volume = userVolume;
    audio.muted = false;

    setStorage(
      localStorage,
      `${storageKey}:volume`,
      String(userVolume)
    );

    setStorage(
      localStorage,
      `${storageKey}:muted`,
      "0"
    );

    sync();
  });

  /* --------------------------------
     MUTE
  -------------------------------- */

  mute?.addEventListener("click", () => {
    audio.muted = !audio.muted;

    if (!audio.muted && audio.volume === 0) {
      audio.volume = userVolume || 0.8;
    }

    setStorage(
      localStorage,
      `${storageKey}:muted`,
      audio.muted ? "1" : "0"
    );

    sync();
  });

  /* --------------------------------
     PROGRESS
  -------------------------------- */

  progress?.addEventListener("input", () => {
    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      const percent = Math.min(
        100,
        Math.max(0, Number(progress.value))
      );

      audio.currentTime =
        (percent / 100) * audio.duration;

      save("time", audio.currentTime);
      sync();
    }
  });

  /* --------------------------------
     MINIMIZE / EXPAND
  -------------------------------- */

  close?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const minimized =
      player.classList.toggle("is-minimized");

    close.setAttribute(
      "aria-label",
      minimized
        ? "Expand music player"
        : "Minimize music player"
    );
  });

  /* --------------------------------
     INITIALIZATION
  -------------------------------- */

  ensureSource();
  sync();

  /*
    Important:
    Do NOT force autoplay here.

    The user must have legitimately started the music,
    and browser autoplay restrictions remain respected.
  */
      }
