function music() {
  const audio = $("#birthdayAudio");
  const player = $("#musicPlayer");
  if (!audio || !player) return;

  // Prevent duplicate music bindings.
  if (audio.dataset.musicBound === "true") return;
  audio.dataset.musicBound = "true";

  // One continuous soundtrack instance for this page.
  audio.loop = true;
  audio.preload = "metadata";

  const toggle = $("#musicToggle");
  const mute = $("#musicMute");
  const volume = $("#musicVolume");
  const progress = $("#musicProgress");
  const time = $("#musicTime");
  const status = $("#musicStatus");
  const close = $("#musicClose");

  const storageKey = "khushiMusic";
  const source = audio.dataset.src || "";

  const ensureSource = () => {
    if (!audio.src && source) {
      audio.src = source;
      audio.load();
    }
    return Boolean(audio.src);
  };

  // Default = 100%.
  // Manual volume changes are remembered.
  let userVolume = Number(
    getStorage(localStorage, `${storageKey}:volume`, "1")
  );

  if (
    !Number.isFinite(userVolume) ||
    userVolume < 0 ||
    userVolume > 1
  ) {
    userVolume = 1;
  }

  audio.volume = userVolume;
  audio.muted =
    getStorage(localStorage, `${storageKey}:muted`, "0") === "1";

  if (volume) {
    volume.value = String(userVolume);
  }

  // Restore music position + playing state when moving between pages.
  const savedTime = Number(
    getStorage(sessionStorage, `${storageKey}:time`, "0")
  );

  let shouldResume =
    getStorage(sessionStorage, `${storageKey}:playing`, "0") === "1";

  const restoreTime = () => {
    if (
      Number.isFinite(savedTime) &&
      savedTime > 0 &&
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      audio.currentTime = Math.min(
        savedTime,
        Math.max(0.01, audio.duration - 0.01)
      );
    }
  };

  const fmt = (seconds) => {
    if (!Number.isFinite(seconds)) return "00:00";

    const total = Math.max(0, Math.floor(seconds));

    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
      total % 60
    ).padStart(2, "0")}`;
  };

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
      status.textContent = audio.error
        ? "Music file unavailable"
        : playing
          ? "Playing"
          : audio.currentTime > 0
            ? "Ready to resume"
            : "Tap to play";
    }

    if (time) {
      time.textContent = `${fmt(audio.currentTime)} / ${fmt(
        audio.duration
      )}`;
    }

    if (progress) {
      progress.value =
        audio.duration > 0
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

  const persistState = () => {
    if (
      Number.isFinite(audio.currentTime) &&
      audio.currentTime > 0
    ) {
      setStorage(
        sessionStorage,
        `${storageKey}:time`,
        String(audio.currentTime)
      );
    }

    setStorage(
      sessionStorage,
      `${storageKey}:playing`,
      !audio.paused && !audio.ended ? "1" : "0"
    );
  };

  const attemptResume = async () => {
    if (!ensureSource()) return false;

    try {
      restoreTime();

      await audio.play();

      shouldResume = true;

      setStorage(
        sessionStorage,
        `${storageKey}:playing`,
        "1"
      );

      return true;
    } catch (error) {
      if (status) {
        status.textContent =
          error?.name === "NotAllowedError"
            ? "Tap to resume music"
            : "Tap to play";
      }

      return false;
    }
  };

  // Main Play / Pause button.
  toggle?.addEventListener("click", async () => {
    if (!ensureSource()) {
      if (status) {
        status.textContent =
          "Audio source is not configured";
      }
      return;
    }

    try {
      if (audio.paused) {
        await audio.play();

        shouldResume = true;

        setStorage(
          sessionStorage,
          `${storageKey}:playing`,
          "1"
        );
      } else {
        audio.pause();

        shouldResume = false;

        setStorage(
          sessionStorage,
          `${storageKey}:playing`,
          "0"
        );
      }
    } catch (error) {
      if (status) {
        status.textContent =
          error?.name === "NotAllowedError"
            ? "Tap again to start the music"
            : "Music could not be played";
      }
    }

    sync();
  });

  // Keep UI synchronized.
  [
    "play",
    "pause",
    "loadedmetadata",
    "timeupdate",
    "volumechange",
    "canplay"
  ].forEach((eventName) => {
    audio.addEventListener(eventName, sync);
  });

  audio.addEventListener("play", () => {
    shouldResume = true;

    setStorage(
      sessionStorage,
      `${storageKey}:playing`,
      "1"
    );

    sync();
  });

  audio.addEventListener("pause", () => {
    // Don't destroy saved playing intent during page teardown.
    if (!document.hidden) {
      shouldResume = false;

      setStorage(
        sessionStorage,
        `${storageKey}:playing`,
        "0"
      );
    }

    sync();
  });

  audio.addEventListener("ended", () => {
    try {
      sessionStorage.removeItem(
        `${storageKey}:time`
      );

      sessionStorage.setItem(
        `${storageKey}:playing`,
        "0"
      );
    } catch {}

    shouldResume = false;

    sync();
  });

  audio.addEventListener("error", sync);

  // Restore position and try to resume on the new page.
  audio.addEventListener(
    "loadedmetadata",
    async () => {
      restoreTime();

      if (shouldResume) {
        await attemptResume();
      }

      sync();
    },
    { once: true }
  );

  /*
   * Browser autoplay rules cannot be bypassed.
   * If the browser blocks automatic resume after navigation,
   * the first user interaction will resume the song.
   */
  const resumeFromInteraction = async () => {
    if (!shouldResume || !audio.paused) return;

    const resumed = await attemptResume();

    if (resumed) {
      sync();
    }
  };

  [
    "pointerdown",
    "keydown",
    "touchstart"
  ].forEach((eventName) => {
    window.addEventListener(
      eventName,
      resumeFromInteraction,
      {
        passive: true
      }
    );
  });

  // Save position/state when tab is hidden.
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        persistState();
      } else if (shouldResume && audio.paused) {
        void attemptResume().then(sync);
      }
    },
    { passive: true }
  );

  // Save position/state before leaving the page.
  window.addEventListener(
    "pagehide",
    persistState,
    { passive: true }
  );

  // Volume.
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
  });

  // Mute / Unmute.
  mute?.addEventListener("click", () => {
    audio.muted = !audio.muted;

    if (!audio.muted && audio.volume === 0) {
      audio.volume = userVolume || 1;
    }

    setStorage(
      localStorage,
      `${storageKey}:muted`,
      audio.muted ? "1" : "0"
    );

    sync();
  });

  // Progress bar.
  progress?.addEventListener("input", () => {
    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      audio.currentTime =
        (Math.min(
          100,
          Math.max(0, Number(progress.value))
        ) /
          100) *
        audio.duration;

      setStorage(
        sessionStorage,
        `${storageKey}:time`,
        String(audio.currentTime)
      );
    }
  });

  // Minimize / Expand player.
  close?.addEventListener("click", () => {
    const minimized =
      player.classList.toggle("is-minimized");

    close.setAttribute(
      "aria-label",
      minimized
        ? "Expand music player"
        : "Minimize music player"
    );
  });

  // Prepare source only when previous page was playing.
  if (shouldResume) {
    ensureSource();
  }

  sync();
}
