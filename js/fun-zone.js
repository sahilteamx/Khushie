(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const GAMES = ["cake", "hearts", "balloons", "memory", "puzzle", "gifts"];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  let state = loadState();
  let activeGame = null;
  let toastTimer = null;

  function loadState() {
    const canonical = window.KhushiProgress?.get?.() || {};
    return {
      version: canonical.version || 3,
      completed: canonical.games && typeof canonical.games === "object" ? { ...canonical.games } : {},
      best: canonical.best && typeof canonical.best === "object" ? { ...canonical.best } : {},
      easterEggs: Array.isArray(canonical.secrets) ? [...canonical.secrets] : [],
      totalBonus: Number(canonical.totalBonus || 0)
    };
  }


  function scoreFor(game) { return Number(state.best?.[game] || 0) + (state.completed?.[game] ? 25 : 0); }

  function renderProgress() {
    const total = GAMES.reduce((sum, game) => sum + scoreFor(game), 0) + Number(state.totalBonus || 0);
    const completed = GAMES.filter((game) => Boolean(state.completed?.[game])).length;
    const percent = Math.round((completed / GAMES.length) * 100);
    $("#funTotalScore") && ($("#funTotalScore").textContent = String(total));
    $("#funCompleted") && ($("#funCompleted").textContent = String(completed));
    $("#funProgressText") && ($("#funProgressText").textContent = `${percent}%`);
    $("#funProgressBar") && ($("#funProgressBar").style.width = `${percent}%`);
    GAMES.forEach((game) => {
      const status = $(`[data-status="${game}"]`);
      if (!status) return;
      status.textContent = state.completed?.[game] ? `Completed · ${state.best?.[game] || 0}` : "Start";
    });
    if (window.KhushiProgress) {
      const p = window.KhushiProgress, ps = p.get();
      $(`#funCreativePercent`) && ($(`#funCreativePercent`).textContent = `${p.completion}%`);
      $(`#funCreativeDone`) && ($(`#funCreativeDone`).textContent = `${p.creativeCompleted} / 4`);
      $(`#funWishCount`) && ($(`#funWishCount`).textContent = String(ps.wishGenerations || 0));
    }
  }

  function markComplete(game, score = 0) {
    const nextScore = Math.max(Number(state.best?.[game] || 0), Math.round(score));
    if (window.KhushiProgress) {
      window.KhushiProgress.completeGame(game, nextScore);
      state = loadState();
    }
    renderProgress();
  }

  function celebrate(count = 18) {
    if (reducedMotion) return;
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.setProperty("--confetti-hue", String(Math.floor(Math.random() * 45 + 25)));
      piece.style.setProperty("--confetti-x", `${(Math.random() - 0.5) * 180}px`);
      piece.style.setProperty("--confetti-r", `${Math.random() * 900 - 450}deg`);
      piece.style.animationDelay = `${Math.random() * .25}s`;
      document.body.appendChild(piece);
      window.setTimeout(() => piece.remove(), 3200);
    }
  }

  function showToast(message) {
    const el = $("#gameToast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove("is-visible"), 2600);
  }

  function openGame(game) {
    activeGame = game;
    $("#gameWorkspace")?.removeAttribute("hidden");
    $("#gameHome")?.setAttribute("hidden", "true");
    $$("[data-game-panel]").forEach((panel) => panel.toggleAttribute("hidden", panel.dataset.gamePanel !== game));
    document.documentElement.style.scrollBehavior = "smooth";
    $("#gameWorkspace")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    document.documentElement.style.scrollBehavior = "";
    if (game === "cake") initCake(true);
    if (game === "hearts") resetHearts();
    if (game === "balloons") resetBalloons();
    if (game === "memory") resetMemory();
    if (game === "puzzle") resetPuzzle();
    if (game === "gifts") resetGifts();
  }

  function closeGame() {
    stopHearts(); stopBalloons(); stopMemory();
    activeGame = null;
    $("#gameWorkspace")?.setAttribute("hidden", "true");
    $("#gameHome")?.removeAttribute("hidden");
    $$("[data-game-panel]").forEach((panel) => panel.setAttribute("hidden", "true"));
  }

  function resetProgress() {
    const accepted = window.confirm("Reset all Birthday Fun Zone progress on this browser?");
    if (!accepted) return;
    if (window.KhushiProgress) window.KhushiProgress.reset();
    state = loadState();
    renderProgress();
    ["cake", "hearts", "balloons", "memory", "puzzle", "gifts"].forEach((game) => {
      const status = $(`[data-status="${game}"]`); if (status) status.textContent = "Start";
    });
    initCake(true); resetHearts(); resetBalloons(); resetMemory(); resetPuzzle(); resetGifts();
    showToast("Birthday progress reset. Fresh start. ✨");
  }

  // Cake
  function initCake(resetOnly = false) {
    const cake = $("#birthdayCake");
    const result = $("#cakeResult"); const instruction = $("#cakeInstruction"); const cut = $("#cakeCut");
    const knife = $("#cakeKnife");
    if (!cake) return;
    cake.classList.remove("is-cut");
    $$(".candle", cake).forEach((candle) => candle.classList.remove("is-out"));
    cut.disabled = true;
    if (knife) knife.style.opacity = "0";
    if (result) result.textContent = "";
    if (instruction) instruction.textContent = "Tap every candle flame to blow them out.";
    if (!resetOnly) return;
  }

  function handleCandle(candle) {
    if (candle.classList.contains("is-out")) return;
    candle.classList.add("is-out");
    const remaining = $$(".candle:not(.is-out)").length;
    const instruction = $("#cakeInstruction");
    if (remaining > 0) {
      instruction.textContent = `${remaining} candle${remaining === 1 ? "" : "s"} left. Keep going. ✨`;
      return;
    }
    instruction.textContent = "All candles are out. Now make the cut. 🎂";
    $("#cakeCut").disabled = false;
    showToast("Wish made. Cake cutting unlocked. 🎂");
  }

  function cutCake() {
    const cake = $("#birthdayCake"); const result = $("#cakeResult"); const instruction = $("#cakeInstruction");
    if (!cake || $("#cakeCut").disabled) return;
    cake.classList.add("is-cut");
    instruction.textContent = "A little slice of birthday magic. ❤️";
    result.textContent = "Slice unlocked — and yes, you earned the first piece. 😁";
    markComplete("cake", 100);
    celebrate(26);
    showToast("Cake unlocked! +100 fun points");
    $("#cakeCut").disabled = true;
  }

  // Hearts
  let heartsTimer = null; let heartsSpawner = null; let heartsScore = 0; let heartsSeconds = 20;
  function resetHearts() {
    stopHearts(); heartsScore = 0; heartsSeconds = 20;
    $("#heartsScore").textContent = "0"; $("#heartsTimer").textContent = "20"; $("#heartsBest").textContent = String(state.best?.hearts || 0);
    $("#heartsStatus").textContent = "Catch the falling hearts. Every one is worth 10 points.";
    $("#heartsStart").hidden = false; $("#heartsReplay").hidden = true;
    $("#heartsArena").replaceChildren();
  }
  function stopHearts() {
    if (heartsTimer) window.clearInterval(heartsTimer); if (heartsSpawner) window.clearInterval(heartsSpawner);
    heartsTimer = null; heartsSpawner = null; $("#heartsArena")?.replaceChildren();
  }
  function spawnHeart() {
    const arena = $("#heartsArena"); if (!arena) return;
    const heart = document.createElement("button"); heart.type = "button"; heart.className = "heart-item"; heart.textContent = "❤"; heart.setAttribute("aria-label", "Catch heart");
    heart.style.left = `${8 + Math.random() * 84}%`; heart.style.top = `${8 + Math.random() * 12}%`; heart.style.setProperty("--fall-time", `${Math.max(1.7, 2.7 - (20 - heartsSeconds) * .025)}s`);
    const remove = () => heart.remove();
    heart.addEventListener("pointerdown", (event) => { event.preventDefault(); heartsScore += 10; $("#heartsScore").textContent = String(heartsScore); heart.style.transform = "translate(-50%,-50%) scale(1.35)"; heart.style.opacity = "0"; window.setTimeout(remove, 90); }, { once: true, passive: false });
    arena.appendChild(heart); window.setTimeout(remove, 2900);
  }
  function startHearts() {
    stopHearts(); heartsScore = 0; heartsSeconds = 20; $("#heartsScore").textContent = "0"; $("#heartsTimer").textContent = "20"; $("#heartsStart").hidden = true; $("#heartsReplay").hidden = true;
    $("#heartsStatus").textContent = "Go go go! Catch everything you can.";
    spawnHeart(); heartsSpawner = window.setInterval(spawnHeart, reducedMotion ? 1050 : 760);
    heartsTimer = window.setInterval(() => { heartsSeconds -= 1; $("#heartsTimer").textContent = String(heartsSeconds); if (heartsSeconds <= 0) finishHearts(); }, 1000);
  }
  function finishHearts() {
    const score = heartsScore; stopHearts(); heartsSeconds = 0; $("#heartsTimer").textContent = "0";
    const best = Math.max(Number(state.best?.hearts || 0), score); $("#heartsBest").textContent = String(best); $("#heartsReplay").hidden = false;
    $("#heartsStatus").textContent = `Time! You caught ${Math.round(score / 10)} hearts for ${score} points.`; markComplete("hearts", score); celebrate(14); showToast(`Hearts complete! +${score} score`);
  }

  // Balloons
  let balloonsTimer = null; let balloonsSpawner = null; let balloonsScore = 0; let balloonsSeconds = 20; let balloonsCombo = 0; let balloonsLastPop = 0;
  function resetBalloons() {
    stopBalloons(); balloonsScore = 0; balloonsSeconds = 20; balloonsCombo = 0; balloonsLastPop = 0;
    $("#balloonsScore").textContent = "0"; $("#balloonsCombo").textContent = "0"; $("#balloonsBest").textContent = String(state.best?.balloons || 0);
    $("#balloonsStatus").textContent = "Pop balloons quickly to build your combo."; $("#balloonsStart").hidden = false; $("#balloonsReplay").hidden = true; $("#balloonsArena").replaceChildren();
  }
  function stopBalloons() { if (balloonsTimer) window.clearInterval(balloonsTimer); if (balloonsSpawner) window.clearInterval(balloonsSpawner); balloonsTimer = null; balloonsSpawner = null; $("#balloonsArena")?.replaceChildren(); }
  function spawnBalloon() {
    const arena = $("#balloonsArena"); if (!arena) return;
    const balloon = document.createElement("button"); balloon.type = "button"; balloon.className = "balloon-item"; balloon.setAttribute("aria-label", "Pop balloon");
    balloon.style.left = `${8 + Math.random() * 84}%`; balloon.style.top = `${62 + Math.random() * 24}%`; balloon.style.setProperty("--rise-time", `${Math.max(2.15, 3.8 - (20 - balloonsSeconds) * .04)}s`);
    balloon.addEventListener("pointerdown", (event) => {
      event.preventDefault(); const now = performance.now(); balloonsCombo = now - balloonsLastPop < 1000 ? Math.min(balloonsCombo + 1, 9) : 1; balloonsLastPop = now; const add = 10 + balloonsCombo * 2; balloonsScore += add; $("#balloonsScore").textContent = String(balloonsScore); $("#balloonsCombo").textContent = String(balloonsCombo); balloon.remove();
    }, { once: true, passive: false });
    arena.appendChild(balloon); window.setTimeout(() => balloon.remove(), 4000);
  }
  function startBalloons() {
    stopBalloons(); balloonsScore = 0; balloonsSeconds = 20; balloonsCombo = 0; balloonsLastPop = 0; $("#balloonsScore").textContent = "0"; $("#balloonsCombo").textContent = "0"; $("#balloonsTimer").textContent = "20";
    $("#balloonsStatus").textContent = "Keep the streak alive!"; $("#balloonsStart").hidden = true; $("#balloonsReplay").hidden = true;
    spawnBalloon(); balloonsSpawner = window.setInterval(spawnBalloon, reducedMotion ? 1000 : 720);
    $("#balloonsTimer").textContent = "20"; balloonsTimer = window.setInterval(() => { balloonsSeconds -= 1; $("#balloonsTimer").textContent = String(Math.max(0, balloonsSeconds)); if (balloonsSeconds <= 0) finishBalloons(); }, 1000);
  }
  function finishBalloons() { const score = balloonsScore; stopBalloons(); $("#balloonsReplay").hidden = false; $("#balloonsStatus").textContent = `Pop-stop! Your score is ${score}.`; markComplete("balloons", score); celebrate(15); showToast(`Balloon streak complete! +${score}`); }

  // Memory
  const symbols = ["🎂","🎁","🎈","⭐","❤️","🌸","🦋","✨","🍰","🌙"];
  const memoryConfig = { easy: 6, medium: 8, hard: 10 };
  let memoryDifficulty = "easy"; let memoryDeck = []; let memoryOpen = []; let memoryMoves = 0; let memoryMatched = 0; let memoryTimer = null; let memorySeconds = 0; let memoryLocked = false;
  function shuffle(values) { const copy = [...values]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
  function resetMemory() { stopMemory(); memoryOpen = []; memoryMoves = 0; memoryMatched = 0; memorySeconds = 0; $("#memoryMoves").textContent = "0"; $("#memoryTimer").textContent = "0"; $("#memoryPairs").textContent = `0 / ${memoryConfig[memoryDifficulty]}`; $("#memoryStart").hidden = false; $("#memoryReplay").hidden = true; $("#memoryStatus").textContent = "Flip two cards at a time and match all the symbols."; buildMemoryPreview(); }
  function stopMemory() { if (memoryTimer) window.clearInterval(memoryTimer); memoryTimer = null; memoryLocked = false; }
  function buildMemoryPreview() { const board = $("#memoryBoard"); if (!board) return; const pairs = memoryConfig[memoryDifficulty]; board.classList.toggle("is-hard", memoryDifficulty === "hard"); board.innerHTML = ""; for (let i = 0; i < pairs * 2; i += 1) { const button = document.createElement("button"); button.type = "button"; button.className = "memory-card"; button.disabled = true; button.setAttribute("aria-label", "Hidden memory card"); button.innerHTML = `<span class="memory-card-inner"><span class="memory-face memory-face--back">?</span><span class="memory-face memory-face--front">?</span></span>`; board.appendChild(button); } }
  function startMemory() {
    stopMemory(); const pairCount = memoryConfig[memoryDifficulty]; const chosen = symbols.slice(0, pairCount); memoryDeck = shuffle([...chosen, ...chosen].map((symbol, index) => ({ id: index, symbol, matched: false }))); memoryOpen = []; memoryMoves = 0; memoryMatched = 0; memorySeconds = 0; memoryLocked = false;
    $("#memoryMoves").textContent = "0"; $("#memoryTimer").textContent = "0"; $("#memoryPairs").textContent = `0 / ${pairCount}`; $("#memoryStart").hidden = true; $("#memoryReplay").hidden = true; $("#memoryStatus").textContent = "Match every pair.";
    const board = $("#memoryBoard"); board.classList.toggle("is-hard", memoryDifficulty === "hard"); board.innerHTML = "";
    memoryDeck.forEach((card, index) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "memory-card"; button.dataset.index = String(index); button.setAttribute("aria-label", "Hidden memory card");
      button.innerHTML = `<span class="memory-card-inner"><span class="memory-face memory-face--back">?</span><span class="memory-face memory-face--front">${card.symbol}</span></span>`;
      button.addEventListener("click", () => flipMemory(index)); board.appendChild(button);
    });
    memoryTimer = window.setInterval(() => { memorySeconds += 1; $("#memoryTimer").textContent = String(memorySeconds); }, 1000);
  }
  function flipMemory(index) {
    if (memoryLocked || memoryOpen.includes(index)) return; const card = memoryDeck[index]; if (!card || card.matched) return;
    const button = $(`.memory-card[data-index="${index}"]`); button.classList.add("is-flipped"); button.setAttribute("aria-label", `Memory card ${card.symbol}`); memoryOpen.push(index);
    if (memoryOpen.length < 2) return;
    memoryMoves += 1; $("#memoryMoves").textContent = String(memoryMoves);
    const [aIndex, bIndex] = memoryOpen; const a = memoryDeck[aIndex]; const b = memoryDeck[bIndex];
    if (a.symbol === b.symbol) {
      a.matched = true; b.matched = true; $$(".memory-card", $("#memoryBoard")).forEach((el) => { if (Number(el.dataset.index) === aIndex || Number(el.dataset.index) === bIndex) el.classList.add("is-matched"); }); memoryMatched += 1; memoryOpen = []; $("#memoryPairs").textContent = `${memoryMatched} / ${memoryConfig[memoryDifficulty]}`; if (memoryMatched === memoryConfig[memoryDifficulty]) finishMemory();
    } else {
      memoryLocked = true; window.setTimeout(() => { [aIndex,bIndex].forEach((idx) => $(`.memory-card[data-index="${idx}"]`)?.classList.remove("is-flipped")); memoryOpen = []; memoryLocked = false; }, reducedMotion ? 180 : 650);
    }
  }
  function finishMemory() { stopMemory(); const base = 900 - memoryMoves * 18 - memorySeconds * 3; const score = Math.max(100, base); $("#memoryReplay").hidden = false; $("#memoryStatus").textContent = `Perfect! ${memoryMatched} pairs in ${memoryMoves} moves and ${memorySeconds}s.`; markComplete("memory", score); celebrate(20); showToast(`Memory complete! +${Math.round(score)}`); }

  // Puzzle
  let puzzleTiles = []; let puzzleSelected = null; let puzzleMoves = 0;
  function resetPuzzle() { puzzleTiles = [...Array(9).keys()]; puzzleSelected = null; puzzleMoves = 0; $("#puzzleMoves").textContent = "0"; $("#puzzleBest").textContent = state.best?.puzzle ? String(state.best.puzzle) : "—"; $("#puzzleStatus").textContent = "Tap a tile, then tap another tile to swap them."; $("#puzzleReplay").hidden = true; renderPuzzle(); }
  function shufflePuzzle() { puzzleTiles = shuffle([...Array(9).keys()]); while (isSolvedPuzzle()) puzzleTiles = shuffle([...Array(9).keys()]); puzzleMoves = 0; puzzleSelected = null; $("#puzzleMoves").textContent = "0"; $("#puzzleStatus").textContent = "Tap two tiles to swap them."; $("#puzzleStart").textContent = "Shuffle again"; $("#puzzleReplay").hidden = true; renderPuzzle(); }
  function renderPuzzle() { const board = $("#puzzleBoard"); if (!board) return; board.innerHTML = ""; puzzleTiles.forEach((tile, position) => { const button = document.createElement("button"); button.type = "button"; button.className = "puzzle-tile"; button.dataset.position = String(position); button.dataset.tile = String(tile); button.setAttribute("aria-label", `Cake tile ${tile + 1}`); if (puzzleSelected === position) button.classList.add("is-selected"); button.addEventListener("click", () => selectPuzzle(position)); board.appendChild(button); }); }
  function isSolvedPuzzle() { return puzzleTiles.every((tile, index) => tile === index); }
  function selectPuzzle(position) { if (puzzleSelected === null) { puzzleSelected = position; renderPuzzle(); return; } if (puzzleSelected === position) { puzzleSelected = null; renderPuzzle(); return; } [puzzleTiles[puzzleSelected], puzzleTiles[position]] = [puzzleTiles[position], puzzleTiles[puzzleSelected]]; puzzleSelected = null; puzzleMoves += 1; $("#puzzleMoves").textContent = String(puzzleMoves); renderPuzzle(); if (isSolvedPuzzle()) finishPuzzle(); }
  function finishPuzzle() { const score = Math.max(120, 850 - puzzleMoves * 22); $("#puzzleBest").textContent = String(Math.max(Number(state.best?.puzzle || 0), score)); $("#puzzleReplay").hidden = false; $("#puzzleStatus").textContent = `Cake complete in ${puzzleMoves} moves. 🎂`; markComplete("puzzle", score); celebrate(20); showToast(`Puzzle solved! +${Math.round(score)}`); }

  // Gifts
  function resetGifts() { const stage = $("#giftStage"); if (!stage) return; stage.innerHTML = ""; $("#giftResult").textContent = ""; $("#giftStatus").textContent = "Choose one box. There is no wrong answer. 😁"; $("#giftReplay").hidden = true; [1,2,3,4,5].forEach((number) => { const button = document.createElement("button"); button.type = "button"; button.className = "gift-box"; button.setAttribute("aria-label", `Choose gift box ${number}`); button.innerHTML = `<span class="gift-lid"></span><span class="gift-body"></span><span class="gift-ribbon-v"></span><span class="gift-ribbon-h"></span><span class="gift-bow"></span>`; button.addEventListener("click", () => openGift(button, number), { once: true }); stage.appendChild(button); }); }
  function openGift(button, number) { const gifts = [
    { text: "Confetti attack! You found the sparkle box. ✨", score: 110 },
    { text: "A bonus 70 points and absolutely no explanation. 😂", score: 70 },
    { text: "Tiny birthday chaos unlocked. You are now officially fun. 😁", score: 55 },
    { text: "A secret wish follows you into the next chapter. ❤️", score: 90 },
    { text: "You picked the ‘why is this even here?’ box. Perfect. 🤣", score: 40 }
  ]; const result = gifts[(number - 1 + Math.floor(Math.random() * gifts.length)) % gifts.length]; $$(".gift-box").forEach((box) => { box.disabled = true; if (box !== button) box.style.opacity = ".45"; }); button.classList.add("is-picked"); $("#giftResult").textContent = result.text; $("#giftStatus").textContent = `Gift box ${number} opened. Score: ${result.score}.`; $("#giftReplay").hidden = false; markComplete("gifts", result.score); celebrate(16); showToast(`Gift unlocked! +${result.score}`); }

  function bindEvents() {
    $$("[data-game]").forEach((button) => button.addEventListener("click", () => openGame(button.dataset.game)));
    $$('[data-back]').forEach((button) => button.addEventListener("click", closeGame));
    $("#workspaceHome")?.addEventListener("click", (event) => { event.preventDefault(); closeGame(); $("#games")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" }); });
    $("#resetFunProgress")?.addEventListener("click", resetProgress);
    $$(".candle").forEach((candle) => candle.addEventListener("click", () => handleCandle(candle)));
    $("#cakeCut")?.addEventListener("click", cutCake); $("#cakeReplay")?.addEventListener("click", () => initCake(true));
    $("#heartsStart")?.addEventListener("click", startHearts); $("#heartsReplay")?.addEventListener("click", startHearts);
    $("#balloonsStart")?.addEventListener("click", startBalloons); $("#balloonsReplay")?.addEventListener("click", startBalloons);
    $$("[data-difficulty]").forEach((button) => button.addEventListener("click", () => { memoryDifficulty = button.dataset.difficulty; $$("[data-difficulty]").forEach((el) => el.classList.toggle("is-active", el === button)); resetMemory(); }));
    $("#memoryStart")?.addEventListener("click", startMemory); $("#memoryReplay")?.addEventListener("click", startMemory);
    $("#puzzleStart")?.addEventListener("click", shufflePuzzle); $("#puzzleReplay")?.addEventListener("click", shufflePuzzle); $("#giftReplay")?.addEventListener("click", resetGifts);
    const secret = $("#secretStar"); secret?.addEventListener("click", () => unlockEasterEgg("star")); secret?.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); unlockEasterEgg("star"); } });
    let typed = ""; window.addEventListener("keydown", (event) => { if (event.key.length !== 1) return; typed = `${typed}${event.key.toLowerCase()}`.slice(-6); if (typed === "khushi") unlockEasterEgg("khushi"); });
  }

  function unlockEasterEgg(key) {
    if (state.easterEggs.includes(key)) {
      showToast(key === "star" ? "You found it again. 😁✦" : "The secret word still works. ❤️");
      return;
    }
    if (window.KhushiProgress) {
      window.KhushiProgress.unlockSecret(key);
      state = loadState();
    }
    celebrate(22);
    showToast(key === "star" ? "Secret star found! +30 bonus points ✦" : "Secret word found! +30 bonus points ❤️");
    renderProgress();
  }

  let visibilityPaused = false;
  function pauseRunningGames() {
    if (visibilityPaused) return;
    visibilityPaused = true;
    if (heartsTimer) { window.clearInterval(heartsTimer); heartsTimer = null; }
    if (heartsSpawner) { window.clearInterval(heartsSpawner); heartsSpawner = null; }
    if (balloonsTimer) { window.clearInterval(balloonsTimer); balloonsTimer = null; }
    if (balloonsSpawner) { window.clearInterval(balloonsSpawner); balloonsSpawner = null; }
    if (memoryTimer) { window.clearInterval(memoryTimer); memoryTimer = null; }
  }
  function resumeRunningGames() {
    if (!visibilityPaused || document.hidden) return;
    visibilityPaused = false;
    if (activeGame === "hearts" && $("#heartsStart")?.hidden && heartsSeconds > 0) {
      heartsSpawner = window.setInterval(spawnHeart, reducedMotion ? 1050 : 760);
      heartsTimer = window.setInterval(() => {
        heartsSeconds -= 1;
        $("#heartsTimer").textContent = String(Math.max(0, heartsSeconds));
        if (heartsSeconds <= 0) finishHearts();
      }, 1000);
      $("#heartsStatus").textContent = "Back again — keep catching! ❤️";
    }
    if (activeGame === "balloons" && $("#balloonsStart")?.hidden && balloonsSeconds > 0) {
      balloonsSpawner = window.setInterval(spawnBalloon, reducedMotion ? 1000 : 720);
      balloonsTimer = window.setInterval(() => {
        balloonsSeconds -= 1;
        $("#balloonsTimer").textContent = String(Math.max(0, balloonsSeconds));
        if (balloonsSeconds <= 0) finishBalloons();
      }, 1000);
      $("#balloonsStatus").textContent = "Welcome back — keep the streak alive! 🎈";
    }
    if (activeGame === "memory" && $("#memoryStart")?.hidden && !memoryMatched) {
      memoryTimer = window.setInterval(() => {
        memorySeconds += 1;
        $("#memoryTimer").textContent = String(memorySeconds);
      }, 1000);
      $("#memoryStatus").textContent = "Game resumed.";
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseRunningGames();
    else resumeRunningGames();
  }, { passive: true });

  function init() { renderProgress(); bindEvents(); initCake(true); resetHearts(); resetBalloons(); resetMemory(); resetPuzzle(); resetGifts(); window.addEventListener("khushi:progress", renderProgress); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
