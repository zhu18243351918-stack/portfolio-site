import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const OPENING_STORAGE_KEY = "anthony-portfolio-opening-v3";
const PREMIUM_EASE = "expo.out";

function clearStaleScrollTriggers() {
  ScrollTrigger.getAll().forEach((trigger) => {
    try {
      trigger.kill(true);
    } catch {
      trigger.kill();
    }
  });
  ScrollTrigger.clearScrollMemory?.();
}

export function shouldPlayOpening() {
  try {
    return sessionStorage.getItem(OPENING_STORAGE_KEY) !== "seen";
  } catch {
    return true;
  }
}

function rememberOpening() {
  try {
    sessionStorage.setItem(OPENING_STORAGE_KEY, "seen");
  } catch {
    // The animation can still run when storage is unavailable.
  }
}

function setMotionComplete(root) {
  gsap.set(
    root.querySelectorAll(
      "[data-hero-nav], [data-hero-meta], [data-hero-word], [data-hero-period], [data-hero-copy], [data-hero-cta], [data-hero-foot], [data-motion-label], [data-motion-heading], [data-motion-copy], [data-motion-card], [data-motion-intro]",
    ),
    { clearProps: "all" },
  );

  const opening = root.querySelector("[data-opening]");
  if (opening) gsap.set(opening, { display: "none" });
}

function createHeroOpening(root, playOpening) {
  const opening = root.querySelector("[data-opening]");
  const openingMark = root.querySelector("[data-opening-mark]");
  const openingRule = root.querySelector("[data-opening-rule]");
  const heroMedia = root.querySelector("[data-hero-media]");
  const heroNav = root.querySelector("[data-hero-nav]");
  const heroMeta = root.querySelector("[data-hero-meta]");
  const heroWords = root.querySelectorAll("[data-hero-word]");
  const heroPeriod = root.querySelector("[data-hero-period]");
  const heroCopy = root.querySelector("[data-hero-copy]");
  const heroCtas = root.querySelector("[data-hero-cta]");
  const heroFoot = root.querySelector("[data-hero-foot]");

  if (!playOpening) {
    setMotionComplete(root);
    return null;
  }

  if (!opening) {
    rememberOpening();
    gsap.set(heroMedia, { scale: 1.065, transformOrigin: "50% 50%" });
    gsap.set(heroNav, { autoAlpha: 0, y: -22 });
    gsap.set(heroMeta, { autoAlpha: 0, x: -38 });
    gsap.set(heroWords, {
      yPercent: 112,
      scaleY: 0.68,
      scaleX: 0.96,
      transformOrigin: "50% 100%",
    });
    gsap.set(heroPeriod, { autoAlpha: 0, scale: 0.45, transformOrigin: "50% 80%" });
    gsap.set([heroCopy, heroCtas], { autoAlpha: 0, y: 38 });
    gsap.set(heroFoot, { autoAlpha: 0, y: 24 });

    gsap.timeline({ defaults: { ease: PREMIUM_EASE } })
      .to(heroMedia, { scale: 1, duration: 2.1, ease: "power3.out" }, 0)
      .to(heroNav, { autoAlpha: 1, y: 0, duration: 0.95 }, 0.12)
      .to(heroMeta, { autoAlpha: 1, x: 0, duration: 0.82 }, 0.2)
      .to(heroWords, { yPercent: 0, scaleY: 1, scaleX: 1, duration: 1.18, stagger: 0.09, ease: "power4.out" }, 0.24)
      .to(heroPeriod, { autoAlpha: 1, scale: 1, duration: 0.62, ease: "power4.out" }, 0.9)
      .to([heroCopy, heroCtas], { autoAlpha: 1, y: 0, duration: 0.82, stagger: 0.08 }, 0.84)
      .to(heroFoot, { autoAlpha: 1, y: 0, duration: 0.7 }, 1.08);
    return null;
  }

  rememberOpening();
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  gsap.set(opening, { display: "grid", autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)" });
  gsap.set(openingMark, { autoAlpha: 0, y: 24 });
  gsap.set(openingRule, { scaleX: 0, transformOrigin: "0% 50%" });
  gsap.set(heroMedia, { scale: 1.12, transformOrigin: "50% 50%" });
  gsap.set(heroNav, { autoAlpha: 0, y: -28 });
  gsap.set(heroMeta, { autoAlpha: 0, x: -52 });
  gsap.set(heroWords, {
    yPercent: 128,
    scaleY: 0.56,
    scaleX: 0.94,
    transformOrigin: "50% 100%",
  });
  gsap.set(heroPeriod, { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 80%" });
  gsap.set([heroCopy, heroCtas], { autoAlpha: 0, y: 46 });
  gsap.set(heroFoot, { autoAlpha: 0, y: 28 });

  const timeline = gsap.timeline({
    defaults: { ease: PREMIUM_EASE },
    onComplete: () => {
      document.body.style.overflow = previousOverflow;
      gsap.set(opening, { display: "none" });
      ScrollTrigger.refresh();
    },
  });

  timeline
    .to(openingMark, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.08)
    .to(openingRule, { scaleX: 1, duration: 0.9 }, 0.16)
    .to(openingMark, { autoAlpha: 0, y: -18, duration: 0.52, ease: "power3.in" }, 0.9)
    .to(openingRule, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.5, ease: "power3.in" }, 0.9)
    .to(opening, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.18, ease: "power4.inOut" }, 1.02)
    .to(heroMedia, { scale: 1, duration: 2.35, ease: "power3.out" }, 0.94)
    .to(heroNav, { autoAlpha: 1, y: 0, duration: 1.05 }, 1.12)
    .to(heroMeta, { autoAlpha: 1, x: 0, duration: 0.9 }, 1.16)
    .to(
      heroWords,
      {
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        duration: 1.34,
        stagger: 0.105,
        ease: "power4.out",
      },
      1.14,
    )
    .to(heroPeriod, { autoAlpha: 1, scale: 1, duration: 0.72, ease: "power4.out" }, 1.76)
    .to([heroCopy, heroCtas], { autoAlpha: 1, y: 0, duration: 0.92, stagger: 0.1 }, 1.72)
    .to(heroFoot, { autoAlpha: 1, y: 0, duration: 0.78 }, 2.02);

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}

function createSectionMotion(root, isMobile) {
  const sections = root.querySelectorAll("[data-motion-section], [data-motion-subsection]");

  sections.forEach((section) => {
    const label = section.querySelector("[data-motion-label]");
    const heading = section.querySelector("[data-motion-heading]");
    const copy = section.querySelectorAll("[data-motion-copy]");
    const intros = section.querySelectorAll("[data-motion-intro]");
    const trigger = section.querySelector("[data-motion-header]") || heading || section;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: isMobile ? "top 88%" : "top 76%",
        once: true,
      },
      defaults: { ease: PREMIUM_EASE },
    });

    if (label) {
      timeline.fromTo(label, { autoAlpha: 0, x: -58 }, { autoAlpha: 1, x: 0, duration: 0.78 }, 0);
    }

    if (heading) {
      timeline.fromTo(
        heading,
        { yPercent: 116, scaleY: 0.62, transformOrigin: "50% 100%" },
        { yPercent: 0, scaleY: 1, duration: isMobile ? 1.05 : 1.38, ease: "power4.out" },
        0.08,
      );
    }

    if (copy.length) {
      timeline.fromTo(
        copy,
        { autoAlpha: 0, y: 44 },
        { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 },
        0.42,
      );
    }

    if (intros.length) {
      timeline.fromTo(
        intros,
        { y: isMobile ? 54 : 86, clipPath: "inset(0% 0% 18% 0%)" },
        {
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: isMobile ? 1.08 : 1.35,
          stagger: 0.13,
          ease: "power4.out",
          clearProps: "clipPath,willChange",
        },
        0.34,
      );
    }

  });

  root.querySelectorAll("[data-motion-group]").forEach((group) => {
    const cards = Array.from(group.querySelectorAll(":scope > [data-motion-card]"));
    if (!cards.length) return;

    const media = cards.map((card) => card.querySelector("[data-parallax]")).filter(Boolean);
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: isMobile ? "top 90%" : "top 82%",
        once: true,
      },
    });

    timeline.fromTo(
      cards,
      {
        y: isMobile ? 64 : 112,
        clipPath: "inset(0% 0% 24% 0%)",
        willChange: "transform, clip-path",
      },
      {
        y: 0,
        clipPath: "inset(0% 0% 0% 0%)",
        duration: isMobile ? 1 : 1.28,
        stagger: isMobile ? 0.09 : 0.16,
        ease: "power4.out",
        clearProps: "clipPath,willChange",
      },
      0,
    );

    if (media.length) {
      timeline.fromTo(media, { scale: 1.1 }, { scale: 1, duration: 1.7, stagger: isMobile ? 0.09 : 0.16, ease: "power3.out" }, 0);
    }

  });

  root.querySelectorAll("[data-motion-card]").forEach((card) => {
    if (card.parentElement?.matches("[data-motion-group]")) return;
    const media = card.querySelector("[data-parallax]");
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: isMobile ? "top 90%" : "top 84%",
        once: true,
      },
    });

    timeline.fromTo(
      card,
      {
        y: isMobile ? 70 : 126,
        clipPath: "inset(0% 0% 22% 0%)",
        willChange: "transform, clip-path",
      },
      {
        y: 0,
        clipPath: "inset(0% 0% 0% 0%)",
        duration: isMobile ? 1.08 : 1.42,
        ease: "power4.out",
        clearProps: "clipPath,willChange",
      },
    );
    if (media) timeline.fromTo(media, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: "power3.out" }, 0);

  });

  root.querySelectorAll("[data-parallax]").forEach((media) => {
    const trigger = media.closest("[data-motion-card], [data-motion-intro], [data-motion-section]") || media;
    const tween = gsap.fromTo(
      media,
      { yPercent: isMobile ? -1.5 : -3.5 },
      {
        yPercent: isMobile ? 1.5 : 3.5,
        ease: "none",
        scrollTrigger: {
          trigger,
          start: "top bottom",
          end: "bottom top",
          scrub: isMobile ? 1.5 : 1.2,
        },
      },
    );
  });
}

export function setupHomeAnimations(root, { playOpening }) {
  if (!root) return () => undefined;

  clearStaleScrollTriggers();
  root.dataset.motionReady = "true";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    setMotionComplete(root);
    return () => {
      delete root.dataset.motionReady;
    };
  }

  let active = true;
  let disposeOpening;
  let context;
  try {
    context = gsap.context(() => {
      disposeOpening = createHeroOpening(root, playOpening);
      createSectionMotion(root, window.matchMedia("(max-width: 767px)").matches);
    }, root);
  } catch {
    clearStaleScrollTriggers();
    setMotionComplete(root);
    return () => {
      delete root.dataset.motionReady;
    };
  }

  const refresh = () => {
    if (!active) return;
    try {
      ScrollTrigger.refresh();
    } catch {
      clearStaleScrollTriggers();
      setMotionComplete(root);
    }
  };
  document.fonts?.ready.then(refresh).catch(() => undefined);
  root.querySelectorAll("img").forEach((image) => {
    if (!image.complete) image.addEventListener("load", refresh, { once: true });
  });
  window.requestAnimationFrame(refresh);

  return () => {
    active = false;
    disposeOpening?.();
    context.revert();
    clearStaleScrollTriggers();
    delete root.dataset.motionReady;
  };
}
