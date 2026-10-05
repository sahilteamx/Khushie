(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const grid = $("#memoryGrid");
  const lightbox = $("#lightbox");

  if (!grid || !lightbox || !window.KHUSHI_MEDIA?.memories) return;

  const data = [...window.KHUSHI_MEDIA.memories];
  const featured = window.KHUSHI_MEDIA.featuredMemory;

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

  const setPlaceholder = (message) => {
    if (placeholder) placeholder.textContent = message;
  };

  const clearViewerMedia = () => {
    activeMedia?.pause?.();
    activeMedia?.removeAttribute?.("src");
    activeMedia?.load?.();
    activeMedia = null;

    mediaHost?.querySelectorAll("img,video").forEach((node) => node.remove());

    mediaHost?.classList.remove("has-image", "has-video");
    placeholder?.classList.remove("is-hidden");
    setPlaceholder("Loading memory…");
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

    if (title) title.textContent = item.title || item.label || "Memory";
    if (caption) caption.textContent = item.caption || "";

    if (counter) {
      counter.textContent =
        `${String(index + 1).padStart(2, "0")} / ${String(data.length).padStart(2, "0")}`;
    }

    if (item.type === "video") {
      placeholder?.classList.add("is-hidden");

      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("controlsList", "nodownload noplaybackrate");
      video.setAttribute("aria-label", item.title || item.label || "Memory video");

      if (item.poster) video.poster = item.poster;

      const source = document.createElement("source");
      source.src = item.src;
      source.type = item.src.endsWith(".webm")
        ? "video/webm"
        : "video/mp4";

      video.appendChild(source);
      mediaHost?.appendChild(video);
      mediaHost?.classList.add("has-video");

      video.addEventListener(
        "error",
        () => {
          setPlaceholder("Memory video unavailable. Please check the media file.");
          placeholder?.classList.remove("is-hidden");
          mediaHost?.classList.remove("has-video");
        },
        { once: true }
      );

      activeMedia = video;
      return;
    }

    const available = await testImage(item.src);

    // User may have changed the slide while the image was loading.
    if (data[index] !== item) return;

    if (!available) {
      setPlaceholder("Memory unavailable. Please check the media file.");
      placeholder?.classList.remove("is-hidden");
      return;
    }

    const image = document.createElement("img");

    image.src = item.src;
    image.alt = `${item.title || item.label || "Memory"}${item.caption ? ` — ${item.caption}` : ""}`;
    image.decoding = "async";
    image.loading = "eager";

    image.addEventListener(
      "load",
      () => {
        image.classList.add("is-ready");
        mediaHost?.classList.add("has-image");
        placeholder?.classList.add("is-hidden");
      },
      { once: true }
    );

    image.addEventListener(
      "error",
      () => {
        setPlaceholder("Memory unavailable. Please check the media file.");
        placeholder?.classList.remove("is-hidden");
        mediaHost?.classList.remove("has-image");
        image.remove();
      },
      { once: true }
    );

    mediaHost?.appendChild(image);

    if (image.complete && image.naturalWidth > 0) {
      image.classList.add("is-ready");
      mediaHost?.classList.add("has-image");
      placeholder?.classList.add("is-hidden");
    }

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

    if (lastFocused instanceof HTMLElement) {
      lastFocused.focus();
    }
  };

  const createCard = (item, i, isFeatured = false) => {
    const article = document.createElement("article");

    article.className = [
      "memory-card",
      "reveal",
      i === 0 || i === 3 ? "memory-card--large" : "",
      isFeatured ? "memory-card--featured" : ""
    ]
      .filter(Boolean)
      .join(" ");

    const button = document.createElement("button");
    button.className = "memory-open memory-open--media";
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `Open ${item.label || item.title || `Memory ${i + 1}`}`
    );

    const visual = document.createElement("div");
    visual.className = "memory-placeholder";

    const image = document.createElement("img");

    image.src = item.type === "video"
      ? item.poster || ""
      : item.src || "";

    image.alt =
      `${item.label || item.title || `Memory ${i + 1}`}: ${item.title || ""}`.trim();

    image.loading = i < 2 ? "eager" : "lazy";
    image.decoding = "async";
    image.width = item.type === "video" || isFeatured ? 1536 : 1293;
    image.height = item.type === "video" || isFeatured ? 1024 : 1536;

    image.addEventListener(
      "load",
      () => visual.classList.add("has-image"),
      { once: true }
    );

    image.addEventListener(
      "error",
      () => visual.classList.remove("has-image"),
      { once: true }
    );

    visual.appendChild(image);

    if (item.type === "video") {
      const badge = document.createElement("span");
      badge.className = "media-badge";
      badge.textContent = "VIDEO";
      visual.appendChild(badge);
    }

    const indexMark = document.createElement("span");
    indexMark.className = "placeholder-index";
    indexMark.textContent = String(i + 1).padStart(2, "0");
    indexMark.setAttribute("aria-hidden", "true");
    visual.appendChild(indexMark);

    button.appendChild(visual);

    const info = document.createElement("div");
    info.className = "memory-info";

    const label = document.createElement("span");
    label.textContent = item.label || "Memory";

    const h2 = document.createElement("h2");
    h2.textContent = item.title || "A moment worth keeping";

    const p = document.createElement("p");
    p.textContent = item.caption || "";

    info.append(label, h2, p);
    article.append(button, info);

    button.addEventListener("click", () => open(i));

    return article;
  };

  if (featured?.src) {
    data.push(featured);
  }

  if (!data.length) {
    const empty = document.createElement("p");
    empty.className = "memory-empty-state";
    empty.textContent = "No memories are available right now.";
    grid.replaceChildren(empty);

    if (count) count.textContent = "0 moments";
    return;
  }

  grid.replaceChildren(
    ...data.map((item, i) =>
      createCard(item, i, item.id === featured?.id)
    )
  );

  if (count) {
    count.textContent = `${data.length} ${data.length === 1 ? "moment" : "moments"}`;
  }

  prev?.addEventListener("click", () => render(index - 1));
  next?.addEventListener("click", () => render(index + 1));
  close?.addEventListener("click", shut);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) shut();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      shut();
    } else if (event.key === "ArrowLeft") {
      render(index - 1);
    } else if (event.key === "ArrowRight") {
      render(index + 1);
    } else if (event.key === "Tab") {
      const focusable = [close, prev, next].filter(
        (node) => node instanceof HTMLElement && !node.disabled
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  lightbox.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (
        Math.abs(dx) > 48 &&
        Math.abs(dx) > Math.abs(dy)
      ) {
        render(dx < 0 ? index + 1 : index - 1);
      }
    },
    { passive: true }
  );

  figure?.addEventListener(
    "click",
    () => {
      figure.focus({ preventScroll: true });
    },
    { passive: true }
  );
})();
