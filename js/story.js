(() => {
  "use strict";
  const root = document.querySelector("#storyChapters");
  if (!root || !window.KHUSHI_MEDIA?.story?.length) return;
  const chapters = window.KHUSHI_MEDIA.story;
  const progress = document.querySelector("#storyProgress span");
  const position = document.querySelector("#storyPosition");
  const previous = document.querySelector("#storyPrev");
  const next = document.querySelector("#storyNext");
  const reduced = window.matchMedia(window.KHUSHI_CONFIG?.reducedMotionQuery || "(prefers-reduced-motion: reduce)").matches;
  let active = 0;

  const lines = (text) => text.split("\n").map((line) => line.trim()).filter(Boolean);

  const createChapter = (chapter, index) => {
    const item = document.createElement("article");
    item.className = "story-chapter reveal";
    item.dataset.index = String(index);
    item.id = chapter.id;
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "chapter-number";
    marker.setAttribute("aria-expanded", "false");
    marker.setAttribute("aria-controls", `${chapter.id}-panel`);
    marker.innerHTML = `<span>${chapter.number}</span>`;
    const card = document.createElement("div"); card.className = "chapter-card";
    const trigger = document.createElement("button");
    trigger.type = "button"; trigger.className = "chapter-media";
    trigger.setAttribute("aria-label", `Open ${chapter.title}`);
    const media = document.createElement("div"); media.className = "chapter-media-visual";
    if (chapter.image) {
      const image = document.createElement("img"); image.src = chapter.image; image.alt = `${chapter.title} chapter image`; image.loading = index === 0 ? "eager" : "lazy"; image.decoding = "async"; media.appendChild(image);
    }
    const overlay = document.createElement("span"); overlay.className = "chapter-open-hint"; overlay.textContent = "Open chapter ↗";
    media.appendChild(overlay);
    trigger.appendChild(media);
    const meta = document.createElement("div"); meta.className = "chapter-meta";
    meta.innerHTML = `<span class="chapter-label">${chapter.number} · ${chapter.label} ${chapter.emoji}</span><h2>${chapter.title}</h2><p>${chapter.date}</p>`;
    const panel = document.createElement("div"); panel.className = "chapter-panel"; panel.id = `${chapter.id}-panel`; panel.hidden = true;
    const copy = document.createElement("div"); copy.className = "chapter-copy";
    lines(chapter.text).forEach((line) => { const p = document.createElement("p"); p.textContent = line; copy.appendChild(p); });
    panel.appendChild(copy);
    const footer = document.createElement("div"); footer.className = "chapter-panel-footer"; footer.textContent = index === chapters.length - 1 ? "The rest is waiting to be written." : "Tap the next memory when you're ready."; panel.appendChild(footer);
    card.append(trigger, meta, panel); item.append(marker, card);

    const toggle = () => {
      const open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open); marker.setAttribute("aria-expanded", String(open)); panel.hidden = !open;
      if (open) {
        item.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        active = index; syncNav();
      }
    };
    marker.addEventListener("click", toggle); trigger.addEventListener("click", toggle);
    return item;
  };

  const syncNav = () => {
    position.textContent = `${chapters[active].number} / ${String(chapters.length).padStart(2, "0")}`;
    if (progress) progress.style.width = `${((active + 1) / chapters.length) * 100}%`;
    if (previous) previous.disabled = active <= 0;
    if (next) next.disabled = active >= chapters.length - 1;
  };

  chapters.forEach((chapter, index) => root.appendChild(createChapter(chapter, index)));
  const allItems = [...root.querySelectorAll(".story-chapter")];
  const activate = (index) => {
    const nextIndex = Math.max(0, Math.min(chapters.length - 1, index));
    const item = allItems[nextIndex];
    if (!item) return;
    const marker = item.querySelector(".chapter-number");
    const panel = item.querySelector(".chapter-panel");
    if (!item.classList.contains("is-open")) {
      allItems.forEach((other) => {
        other.classList.remove("is-open");
        const otherMarker = other.querySelector(".chapter-number");
        const otherPanel = other.querySelector(".chapter-panel");
        otherMarker?.setAttribute("aria-expanded", "false");
        if (otherPanel) {
          otherPanel.hidden = true;
        }
      });
      item.classList.add("is-open");
      marker?.setAttribute("aria-expanded", "true");
      if (panel) panel.hidden = false;
    }
    active = nextIndex;
    syncNav();
    item.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  };
  previous?.addEventListener("click", () => activate(active - 1));
  next?.addEventListener("click", () => activate(active + 1));
  syncNav();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("is-visible"); }), { threshold: .12, rootMargin: "0px 0px -8% 0px" });
    allItems.forEach((item) => observer.observe(item));
  } else allItems.forEach((item) => item.classList.add("is-visible"));

  const youtubeMount = document.querySelector("#youtubeVideoMount");
  const youtubeStatus = document.querySelector("#youtubeVideoStatus");

  function getYouTubeId(value) {
    try {
      const raw = String(value || "").trim();
      if (!raw) return "";
      const url = new URL(raw);
      if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0];
      if (url.hostname.includes("youtube.com")) {
        if (url.pathname === "/watch") return url.searchParams.get("v") || "";
        if (url.pathname.startsWith("/embed/")) return url.pathname.split("/embed/")[1].split("/")[0];
        if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/shorts/")[1].split("/")[0];
      }
    } catch (_) {}
    return "";
  }

  function renderYouTube() {
    if (!youtubeMount) return;
    const config = window.KHUSHI_CONFIG?.youtubeVideo;
    const id = getYouTubeId(config?.url);
    youtubeMount.replaceChildren();
    if (!config?.enabled || !id) {
      youtubeStatus && (youtubeStatus.textContent = "No video is configured right now.");
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.className = "youtube-embed";
    iframe.title = config.title || "Birthday video";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`;
    youtubeMount.appendChild(iframe);
    if (youtubeStatus) youtubeStatus.textContent = config.description || "";
  }
  renderYouTube();

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "PageDown") { if (document.activeElement?.tagName !== "BUTTON") activate(Math.min(active + 1, chapters.length - 1)); }
    if (event.key === "ArrowUp" || event.key === "PageUp") { if (document.activeElement?.tagName !== "BUTTON") activate(Math.max(active - 1, 0)); }
  });
})();
