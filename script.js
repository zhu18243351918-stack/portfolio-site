const forcedTheme = new URLSearchParams(window.location.search).get("theme");

if (forcedTheme === "light" || forcedTheme === "dark") {
  document.documentElement.dataset.theme = forcedTheme;
}

const revealItems = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
  );

  revealItems.forEach((item) => observer.observe(item));
}

document.querySelectorAll("[data-rail-target]").forEach((control) => {
  control.addEventListener("click", () => {
    const rail = document.getElementById(control.dataset.railTarget);
    if (!rail) return;

    const direction = control.dataset.direction === "prev" ? -1 : 1;
    rail.scrollBy({
      left: rail.clientWidth * 0.82 * direction,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });
});

const dialog = document.querySelector(".lightbox");
const dialogImage = dialog.querySelector("img");
const dialogCaption = dialog.querySelector("figcaption");
const closeButton = dialog.querySelector(".lightbox-close");

document.querySelectorAll(".image-button[data-image]").forEach((button) => {
  button.addEventListener("click", () => {
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
  if (!dialog.open) return;
  dialog.close();
}

closeButton.addEventListener("click", closeDialog);

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

dialog.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  dialogImage.removeAttribute("src");
  dialogImage.alt = "";
  dialogCaption.textContent = "";
});
