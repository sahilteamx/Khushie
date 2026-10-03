(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const grid = $("#memoryGrid");
  const lightbox = $("#lightbox");
  if (!grid || !lightbox || !window.KHUSHI_MEDIA?.memories) return;

  const data = [...window.KHUSHI_MEDIA.memories];
  const mediaHost = $("#lightboxMedia");
  const placeholder = $("#lightboxPlaceholder");
  const title = $("#lightboxTitle");
  const caption = $("#lightboxCaption");
  const counter = $("#lightboxCounter");
  const close = $("#lightboxClose");
  const prev = $("#lightboxPrev");
  const next = $("#lightboxNext");
  const count = $("#galleryCount");
  const figure = $(".lightbox-figure");
  const cache = new Map();
  let index = 0;
  let lastFocused = null;
  let startX = 0;
  let startY = 0;
  let activeMedia = null;

  const clearViewerMedia = () => {
    activeMedia?.pause?.();
    activeMedia?.removeAttribute?.("src");
    activeMedia?.load?.();
    activeMedia = null;
    if (mediaHost) mediaHost.querySelectorAll("img,video").forEach((node) => node.remove());
    placeholder?.classList.remove("is-hidden");
    mediaHost?.classList.remove("has-image", "has-video");
  };

  const testImage = (src) => {
    if (!src) return Promise.resolve(false);
    if (cache.has(src)) return cache.get(src);
    const promise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = src;
    });
    cache.set(src, promise);
    return promise;
  };

  const render = async (nextIndex) => {
    index = (nextIndex + data.length) % data.length;
    const item = data[index];
    clearViewerMedia();
    title.textContent = item.title;
    caption.textContent = item.caption;
    counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(data.length).padStart(2, "0")}`;
    if (item.type === "video") {
      placeholder?.classList.add("is-hidden");
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("controlsList", "nodownload noplaybackrate");
      video.setAttribute("aria-label", item.title);
      if (item.poster) video.poster = item.poster;
      const source = document.createElement("source");
      source.src = item.src;
      source.type = item.src.endsWith(".webm") ? "video/webm" : "video/mp4";
      video.appendChild(source);
      mediaHost.appendChild(video);
      mediaHost.classList.add("has-video");
      video.addEventListener("error", () => {
      placeholder.textContent = "This video could not be loaded. Replace the demo file when ready.";
      placeholder.classList.remove("is-hidden");
      mediaHost.classList.remove("has-video");
    }, { once: true });
    activeMedia = video;
      return;
    }
    placeholder?.classList.add("is-hidden");
    const available = await testImage(item.src);
    if (data[index] !== item) return;
    if (!available) {
      placeholder.textContent = "Demo media unavailable — replace this file with your own.";
      placeholder.classList.remove("is-hidden");
      return;
    }
    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.title;
    image.decoding = "async";
    image.loading = "eager";
    image.addEventListener("error", () => {
      placeholder.textContent = "Demo media unavailable — replace this file with your own.";
      placeholder.classList.remove("is-hidden");
      mediaHost.classList.remove("has-image");
    }, { once: true });
    mediaHost.appendChild(image);
    mediaHost.classList.add("has-image");
    activeMedia = image;
  };

  const open = (nextIndex) => {
    lastFocused = document.activeElement;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("media-viewer-open");
    render(nextIndex);
    window.setTimeout(() => close?.focus(), 0);
  };
  const shut = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("media-viewer-open");
    clearViewerMedia();
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  const card = (item, i) => {
    const article = document.createElement("article");
    article.className = `memory-card reveal ${i === 0 || i === 3 ? "memory-card--large" : ""}`.trim();
    const button = document.createElement("button");
    button.className = "memory-open memory-open--media";
    button.type = "button";
    button.setAttribute("aria-label", `Open ${item.label}`);
    const visual = document.createElement("div");
    visual.className = "memory-placeholder";
    if (item.type === "video") {
      const image = document.createElement("img");
      image.src = item.poster || "";
      image.alt = "";
      image.loading = "lazy";
      image.width = 800;
      image.height = 600;
      image.decoding = "async";
      visual.appendChild(image);
      const badge = document.createElement("span");
      badge.className = "media-badge";
      badge.textContent = "VIDEO";
      visual.appendChild(badge);
    } else {
      const image = document.createElement("img");
      image.src = item.src; image.alt = ""; image.loading = "lazy"; image.decoding = "async";
      visual.appendChild(image);
    }
    const indexMark = document.createElement("span"); indexMark.className = "placeholder-index"; indexMark.textContent = String(i + 1).padStart(2, "0");
    visual.appendChild(indexMark);
    button.appendChild(visual);
    const info = document.createElement("div"); info.className = "memory-info";
    const label = document.createElement("span"); label.textContent = item.label;
    const h2 = document.createElement("h2"); h2.textContent = item.title;
    const p = document.createElement("p"); p.textContent = item.caption;
    info.append(label, h2, p);
    article.append(button, info);
    button.addEventListener("click", () => open(i));
    return article;
  };

  grid.replaceChildren(...data.map(card));
  if (count) count.textContent = `${data.length} moments`;

  prev?.addEventListener("click", () => render(index - 1));
  next?.addEventListener("click", () => render(index + 1));
  close?.addEventListener("click", shut);
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) shut(); });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") shut();
    else if (event.key === "ArrowLeft") render(index - 1);
    else if (event.key === "ArrowRight") render(index + 1);
    else if (event.key === "Tab") {
      const focusable = [close, prev, next].filter((node) => node instanceof HTMLElement);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  lightbox.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0]; startX = touch.clientX; startY = touch.clientY;
  }, { passive: true });
  lightbox.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0]; const dx = touch.clientX - startX; const dy = touch.clientY - startY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) render(dx < 0 ? index + 1 : index - 1);
  }, { passive: true });
  figure?.addEventListener("click", () => { if (figure) figure.focus({ preventScroll: true }); }, { passive: true });
})();
