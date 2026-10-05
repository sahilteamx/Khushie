(() => {
  "use strict";
  const KEY = "khushiBirthdayProgress";
  const LEGACY = "khushiFunZoneV1";
  const CREATIVE_KEYS = ["stickerStudio", "memoryBooth", "wishGenerator", "messageWall"];
  const defaults = {
    version: 3,
    games: {},
    best: {},
    gifts: [],
    secrets: [],
    cakeCompleted: false,
    totalBonus: 0,
    visits: [],
    creative: { stickerStudio: false, memoryBooth: false, wishGenerator: false, messageWall: false },
    wishGenerations: 0,
    achievements: []
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  function normalize(raw) {
    const out = clone(defaults);
    if (!raw || typeof raw !== "object") return out;
    Object.assign(out, raw);
    out.version = 3;
    out.games = raw.games && typeof raw.games === "object" ? raw.games : {};
    out.best = raw.best && typeof raw.best === "object" ? raw.best : {};
    for (const k of ["gifts", "secrets", "visits", "achievements"]) out[k] = Array.isArray(raw[k]) ? raw[k] : [];
    out.cakeCompleted = Boolean(raw.cakeCompleted);
    out.totalBonus = Number(raw.totalBonus || 0);
    out.creative = raw.creative && typeof raw.creative === "object" ? raw.creative : {};
    for (const k of CREATIVE_KEYS) out.creative[k] = Boolean(out.creative[k]);
    out.wishGenerations = Math.max(0, Math.floor(Number(raw.wishGenerations || 0)));
    return out;
  }
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
  }
  let state = (() => {
    const current = read(KEY);
    if (current) return normalize(current);
    const legacy = read(LEGACY);
    if (!legacy) return clone(defaults);
    const migrated = normalize({
      games: legacy.completed || {},
      best: legacy.best || {},
      secrets: legacy.easterEggs || [],
      totalBonus: legacy.totalBonus || 0
    });
    try { localStorage.setItem(KEY, JSON.stringify(migrated)); } catch {}
    return migrated;
  })();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    window.dispatchEvent(new CustomEvent("khushi:progress", { detail: clone(state) }));
    return clone(state);
  };
  const api = {
    get: () => clone(state),
    save,
    update(fn) { fn(state); return save(); },
    completeGame(id, score = 0) { return api.update(s => { s.games[id] = true; s.best[id] = Math.max(Number(s.best[id] || 0), Math.round(score)); }); },
    discoverGift(id) { return api.update(s => { if (!s.gifts.includes(id)) s.gifts.push(id); }); },
    unlockSecret(id) { return api.update(s => { if (!s.secrets.includes(id)) { s.secrets.push(id); s.totalBonus += 30; } }); },
    completeCake() { return api.update(s => { s.cakeCompleted = true; }); },
    visit(id) { return api.update(s => { s.visits = [...new Set([...s.visits, id])].slice(-30); }); },
    markCreative(id) { if (!CREATIVE_KEYS.includes(id)) return api.get(); return api.update(s => { s.creative[id] = true; }); },
    incrementWish() { return api.update(s => {
      s.wishGenerations += 1;
      if (s.wishGenerations >= 3 && !s.achievements.includes("wish-maker")) s.achievements.push("wish-maker");
    }); },
    addAchievement(id) { return api.update(s => { if (!s.achievements.includes(id)) s.achievements.push(id); }); },
    reset() {
      state = clone(defaults);
      try {
        localStorage.removeItem(LEGACY);
        localStorage.removeItem("khushiStickerStudio");
        localStorage.removeItem("khushiMemoryBoothPrefs");
        localStorage.removeItem("khushiWishGenerator");
        localStorage.removeItem("khushiMessageReactions");
      } catch {}
      return save();
    },
    get creativeCompleted() { return CREATIVE_KEYS.filter(k => state.creative[k]).length; },
    get completion() {
      const done = Object.values(state.games).filter(Boolean).length;
      const gameTotal = 6;
      const gift = Math.min(state.gifts.length, 5);
      const secret = Math.min(state.secrets.length, 5);
      const cake = state.cakeCompleted ? 1 : 0;
      const creative = api.creativeCompleted;
      const total = gameTotal + 5 + 5 + 1 + CREATIVE_KEYS.length;
      return Math.round(((done + gift + secret + cake + creative) / total) * 100);
    }
  };
  window.KhushiProgress = api;
})();
