const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealItems = document.querySelectorAll(".reveal");

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8%" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelectorAll("[data-rail-target]").forEach((control) => {
  control.addEventListener("click", () => {
    const rail = document.getElementById(control.dataset.railTarget);
    if (!rail) return;

    const direction = control.dataset.direction === "prev" ? -1 : 1;
    rail.scrollBy({
      left: rail.clientWidth * 0.84 * direction,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });
});

const dialog = document.querySelector(".lightbox");
const dialogImage = dialog?.querySelector("img");
const dialogCaption = dialog?.querySelector("figcaption");
const closeButton = dialog?.querySelector(".lightbox-close");

document.querySelectorAll(".image-button[data-image]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!dialog || !dialogImage || !dialogCaption) return;
    const source = button.dataset.image;
    const caption = button.dataset.caption || "作品预览";
    dialogImage.src = source;
    dialogImage.alt = caption;
    dialogCaption.textContent = caption;
    document.body.classList.add("modal-open");
    dialog.showModal();
  });
});

function closeDialog() {
  if (!dialog?.open) return;
  dialog.close();
}

closeButton?.addEventListener("click", closeDialog);

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

dialog?.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  dialogImage?.removeAttribute("src");
  if (dialogImage) dialogImage.alt = "";
  if (dialogCaption) dialogCaption.textContent = "";
});

const trailArea = document.querySelector("[data-trail-area]");
const trailSprites = [
  "assets/ip/pink-mouse-runner.webp",
  "assets/ip/tiger-cat-runner.webp",
  "assets/ip/tiger-coach-runner.webp",
  "assets/ip/blue-croc-runner.webp",
  "assets/ip/cow-miko-runner.webp",
  "assets/ip/dream-spirit-runner.webp",
  "assets/ip/line-dog-runner.webp",
  "assets/ip/wild-sanzhi-runner.webp",
  "assets/ip/cloud-duo-runner.webp",
  "assets/ip/long-ear-pig-runner.webp",
];

if (trailArea && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
  let lastSpawn = 0;
  let spriteIndex = 0;

  trailArea.addEventListener("pointermove", (event) => {
    const now = performance.now();
    if (now - lastSpawn < 95) return;
    lastSpawn = now;

    const rect = trailArea.getBoundingClientRect();
    const sprite = document.createElement("img");
    sprite.className = "trail-sprite";
    sprite.src = trailSprites[spriteIndex % trailSprites.length];
    sprite.alt = "";
    sprite.style.left = `${event.clientX - rect.left}px`;
    sprite.style.top = `${event.clientY - rect.top}px`;
    sprite.style.setProperty("--trail-rotate", `${(spriteIndex % 5) * 3 - 6}deg`);
    trailArea.appendChild(sprite);
    spriteIndex += 1;
    window.setTimeout(() => sprite.remove(), 1200);
  });
}
