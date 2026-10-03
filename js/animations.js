(() => {
  "use strict";
  const reduced = window.matchMedia(window.KHUSHI_CONFIG?.reducedMotionQuery || "(prefers-reduced-motion: reduce)").matches;
  const revealItems = [...document.querySelectorAll(".reveal")];

  function revealFallback() {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  function reveal() {
    if (!revealItems.length) return;
    if (reduced || !("IntersectionObserver" in window)) return revealFallback();
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    revealItems.forEach((item) => observer.observe(item));
  }

  function heroParticles() {
    const field = document.querySelector("#heroParticles");
    if (!field || field.children.length || reduced) return;
    const fragment = document.createDocumentFragment();
    const count = window.innerWidth < 600 ? 10 : 16;
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("span");
      particle.className = "hero-particle";
      particle.style.left = `${8 + Math.random() * 84}%`;
      particle.style.top = `${10 + Math.random() * 78}%`;
      particle.style.setProperty("--particle-size", `${(1.2 + Math.random() * 2.2).toFixed(2)}px`);
      particle.style.setProperty("--particle-duration", `${(5.5 + Math.random() * 5).toFixed(2)}s`);
      particle.style.setProperty("--particle-delay", `${(-Math.random() * 6).toFixed(2)}s`);
      fragment.appendChild(particle);
    }
    field.appendChild(fragment);
  }

  function gsapEnhancements() {
    if (reduced || typeof window.gsap === "undefined") return;
    const visual = document.querySelector(".hero-visual");
    if (visual) window.gsap.fromTo(visual, { autoAlpha: 0, scale: .92, y: 12 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.15, ease: "power3.out", delay: .1, overwrite: true });

    if (window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      document.querySelectorAll(".reveal").forEach((element) => {
        if (element.dataset.gsapReveal) return;
        element.dataset.gsapReveal = "1";
        window.gsap.fromTo(element, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .7, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 88%", once: true } });
      });
    }

    if (window.innerWidth < 768) return;
    document.querySelectorAll(".preview-card").forEach((card) => {
      const reset = () => window.gsap.to(card, { rotationX: 0, rotationY: 0, duration: .45, ease: "power2.out", overwrite: true });
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        window.gsap.to(card, { rotationY: x * 3, rotationX: y * -3, duration: .28, ease: "power2.out", overwrite: true });
      }, { passive: true });
      card.addEventListener("pointerleave", reset);
    });
  }

  function parallax() {
    if (reduced) return;
    const visual = document.querySelector(".hero-visual");
    if (!visual || window.matchMedia("(max-width: 767px)").matches) return;
    let ticking = false;
    const update = () => {
      visual.style.setProperty("--scroll-shift", `${Math.min(window.scrollY, window.innerHeight * 1.2) * .035}px`);
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function init() { reveal(); heroParticles(); gsapEnhancements(); parallax(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
