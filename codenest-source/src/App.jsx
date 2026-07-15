import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Image as ImageIcon,
  LockKeyhole,
  Menu,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { CONTENT_STORAGE_KEY, DEFAULT_CONTENT } from "./content";
import { AboutSection, BlogSection, ProjectsSection, ResumeSection } from "./Sections";
import DetailPage from "./DetailPage";

const PASSWORD_HASH = "3090ad7f5b83a40b050aad6e04d2f663049aca5cf0253e1b2ff592fcfed3ef9c";
const navItems = ["PROJECTS", "BLOG", "ABOUT", "RESUME"];
const CONTENT_DB_NAME = "codenest-editor";
const CONTENT_STORE_NAME = "content";
const CONTENT_RECORD_KEY = "current";

function mergeContent(value = {}) {
  const mergeItems = (defaults, incoming = []) =>
    defaults.map((item, index) => ({ ...item, ...(incoming[index] || {}) }));

  return {
    ...DEFAULT_CONTENT,
    ...value,
    card: {
      ...DEFAULT_CONTENT.card,
      ...(value.card || {}),
    },
    sectionSizes: {
      ...DEFAULT_CONTENT.sectionSizes,
      ...(value.sectionSizes || {}),
    },
    projects: {
      ...DEFAULT_CONTENT.projects,
      ...(value.projects || {}),
      items: mergeItems(DEFAULT_CONTENT.projects.items, value.projects?.items),
    },
    blog: {
      ...DEFAULT_CONTENT.blog,
      ...(value.blog || {}),
      items: mergeItems(DEFAULT_CONTENT.blog.items, value.blog?.items),
    },
    resume: {
      ...DEFAULT_CONTENT.resume,
      ...(value.resume || {}),
      items: mergeItems(DEFAULT_CONTENT.resume.items, value.resume?.items),
    },
    about: {
      ...DEFAULT_CONTENT.about,
      ...(value.about || {}),
    },
  };
}

function stripLocalImages(value) {
  if (typeof value === "string") return value.startsWith("data:") ? "" : value;
  if (Array.isArray(value)) return value.map(stripLocalImages);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stripLocalImages(item)]));
  }
  return value;
}

function containsLocalImage(value) {
  if (typeof value === "string") return value.startsWith("data:");
  if (Array.isArray(value)) return value.some(containsLocalImage);
  if (value && typeof value === "object") return Object.values(value).some(containsLocalImage);
  return false;
}

function openContentDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Persistent image storage is unavailable."));
      return;
    }

    const request = window.indexedDB.open(CONTENT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CONTENT_STORE_NAME)) {
        request.result.createObjectStore(CONTENT_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open persistent storage."));
    request.onblocked = () => reject(new Error("Persistent storage is blocked by another tab."));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Persistent storage request failed."));
  });
}

async function useContentStore(mode, operation) {
  const database = await openContentDatabase();
  try {
    const transaction = database.transaction(CONTENT_STORE_NAME, mode);
    const completion = new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Persistent storage transaction failed."));
      transaction.onabort = () => reject(transaction.error || new Error("Persistent storage transaction was cancelled."));
    });
    const result = await requestResult(operation(transaction.objectStore(CONTENT_STORE_NAME)));
    await completion;
    return result;
  } finally {
    database.close();
  }
}

function readPersistentContent() {
  return useContentStore("readonly", (store) => store.get(CONTENT_RECORD_KEY));
}

function writePersistentContent(value) {
  return useContentStore("readwrite", (store) => store.put(value, CONTENT_RECORD_KEY));
}

function clearPersistentContent() {
  return useContentStore("readwrite", (store) => store.delete(CONTENT_RECORD_KEY));
}

function encodeContent(value) {
  const shareable = stripLocalImages(value);
  const bytes = new TextEncoder().encode(JSON.stringify(shareable));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeContent(value) {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return mergeContent(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

function readInitialContent() {
  const hashValue = window.location.hash.startsWith("#content=")
    ? window.location.hash.slice("#content=".length)
    : "";
  const sharedContent = hashValue ? decodeContent(hashValue) : null;
  if (sharedContent) {
    try {
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(sharedContent));
    } catch {
      // The shared link still works when browser storage is unavailable.
    }
    return sharedContent;
  }

  try {
    return mergeContent(JSON.parse(localStorage.getItem(CONTENT_STORAGE_KEY) || "{}"));
  } catch {
    return DEFAULT_CONTENT;
  }
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function optimizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read this image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Unable to process this image."));
      image.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1200;
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function BackgroundMedia({ content }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || content.mediaMode !== "video" || !content.videoUrl) return undefined;

    let hls;
    let cancelled = false;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = content.videoUrl;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled || !Hls.isSupported()) return;
        hls = new Hls({ enableWorker: false, lowLatencyMode: false });
        hls.loadSource(content.videoUrl);
        hls.attachMedia(video);
      });
    }

    const beginPlayback = () => video.play().catch(() => undefined);
    video.addEventListener("canplay", beginPlayback);

    return () => {
      cancelled = true;
      video.removeEventListener("canplay", beginPlayback);
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [content.mediaMode, content.videoUrl]);

  if (content.mediaMode === "image" && content.backgroundImage) {
    return (
      <img
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        src={content.backgroundImage}
        alt=""
        aria-hidden="true"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover opacity-60"
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
    />
  );
}

function Logo({ brand, logoImage }) {
  return (
    <a className="group flex items-center gap-3 text-white" href="#top" aria-label={`${brand} home`}>
      <span className="relative grid size-8 place-items-center overflow-hidden border border-white/45 font-mono text-[10px] font-bold">
        {logoImage ? <img className="h-full w-full object-cover" src={logoImage} alt="" /> : "C/N"}
        {!logoImage && <span className="absolute -right-1 -top-1 size-2 bg-[#5ed29c] transition-transform duration-300 group-hover:scale-125" />}
      </span>
      <span className="text-[15px] font-bold tracking-[0]">{brand}</span>
    </a>
  );
}

function Navigation({ brand, logoImage, isOpen, onToggle, onClose }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    const handleEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070b0a]/35 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Logo brand={brand} logoImage={logoImage} />
          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a
                key={item}
                className="text-[16px] font-semibold text-white transition-colors duration-200 hover:text-[#5ed29c] focus-visible:text-[#5ed29c]"
                href={`#${item.toLowerCase()}`}
              >
                {item}
              </a>
            ))}
          </nav>
          <button
            className="grid size-11 place-items-center text-white md:hidden"
            type="button"
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={onToggle}
          >
            {isOpen ? <X size={25} strokeWidth={1.7} /> : <Menu size={25} strokeWidth={1.7} />}
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 flex bg-[#070b0a] px-6 pb-12 pt-32 transition-[opacity,visibility] duration-300 md:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <nav className="flex w-full flex-col justify-between" aria-label="Mobile navigation">
          <div className="flex flex-col">
            {navItems.map((item, index) => (
              <a
                key={item}
                className="flex items-center justify-between border-b border-white/10 py-5 text-3xl font-extrabold text-white transition-colors hover:text-[#5ed29c]"
                href={`#${item.toLowerCase()}`}
                onClick={onClose}
              >
                {item}
                <span className="font-jakarta text-[10px] text-[#5ed29c]">0{index + 1}</span>
              </a>
            ))}
          </div>
          <p className="max-w-64 text-xs leading-5 text-white/50">
            Build the skills. Ship the work. Start the career.
          </p>
        </nav>
      </div>
    </>
  );
}

function CentralGlow() {
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-[7%] h-[220px] w-[min(980px,90vw)] -translate-x-1/2 opacity-75"
      viewBox="0 0 980 220"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="cyan-glow" x="-20%" y="-100%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="25" />
        </filter>
      </defs>
      <ellipse
        cx="490"
        cy="105"
        rx="360"
        ry="40"
        fill="#1a8069"
        fillOpacity="0.52"
        filter="url(#cyan-glow)"
      />
    </svg>
  );
}

function GridLines() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
      {[25, 50, 75].map((position) => (
        <span
          key={position}
          className="absolute inset-y-0 w-px bg-white/10"
          style={{ left: `${position}%` }}
        />
      ))}
    </div>
  );
}

function GlassCard({ content }) {
  return (
    <aside className="liquid-card h-[200px] w-[200px] translate-y-[-50px] p-5 text-white">
      <div className="flex h-full flex-col justify-between">
        <span className="font-jakarta text-[14px] font-bold text-white/75">{content.year}</span>
        <div>
          <h2 className="max-w-[155px] text-[18px] font-semibold leading-[1.08] tracking-[0]">
            {content.lead}{" "}
            <span className="font-instrument text-[21px] font-normal italic">{content.accent}</span>{" "}
            {content.tail}
          </h2>
          <p className="mt-3 text-[11px] leading-[1.45] text-white/55">{content.description}</p>
        </div>
      </div>
    </aside>
  );
}

function Field({ label, value, onChange, multiline = false }) {
  const className =
    "mt-2 w-full border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#5ed29c]";
  return (
    <label className="block text-[11px] font-bold uppercase text-white/55">
      {label}
      {multiline ? (
        <textarea className={`${className} min-h-20 resize-y`} value={value} onChange={onChange} />
      ) : (
        <input className={className} value={value} onChange={onChange} />
      )}
    </label>
  );
}

function RangeField({ label, value, min = 80, max = 280, onChange }) {
  return (
    <label className="block text-[11px] font-bold uppercase text-white/55">
      <span className="flex items-center justify-between">
        {label}
        <span className="text-[#5ed29c]">{value}vh</span>
      </span>
      <input
        className="mt-3 w-full accent-[#5ed29c]"
        type="range"
        min={min}
        max={max}
        step="5"
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

function EditorGroup({ title, children, open = false }) {
  return (
    <details className="border border-white/12" open={open}>
      <summary className="cursor-pointer px-4 py-4 text-[11px] font-bold uppercase text-[#5ed29c]">{title}</summary>
      <div className="space-y-4 border-t border-white/10 p-4">{children}</div>
    </details>
  );
}

function ContentEditor({ content, onSave, onReset }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState(content);

  useEffect(() => setDraft(content), [content]);

  const closeEditor = useCallback(() => {
    setIsOpen(false);
    setPassword("");
    setError("");
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => event.key === "Escape" && closeEditor();
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeEditor, isOpen]);

  const unlock = async (event) => {
    event.preventDefault();
    if ((await sha256(password)) === PASSWORD_HASH) {
      setIsUnlocked(true);
      setError("");
      setPassword("");
      return;
    }
    setError("Password is incorrect.");
  };

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateCard = (key, value) =>
    setDraft((current) => ({ ...current, card: { ...current.card, [key]: value } }));
  const updateSize = (key, value) =>
    setDraft((current) => ({
      ...current,
      sectionSizes: { ...current.sectionSizes, [key]: Number(value) },
    }));
  const updateSection = (section, key, value) =>
    setDraft((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }));
  const updateSectionItem = (section, index, key, value) =>
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        items: current[section].items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item,
        ),
      },
    }));
  const updateGalleryImage = (section, itemIndex, imageIndex, value) =>
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        items: current[section].items.map((item, index) =>
          index === itemIndex
            ? {
                ...item,
                gallery: item.gallery.map((image, galleryIndex) =>
                  galleryIndex === imageIndex ? value : image,
                ),
              }
            : item,
        ),
      },
    }));
  const addGalleryImage = (section, itemIndex) =>
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        items: current[section].items.map((item, index) =>
          index === itemIndex ? { ...item, gallery: [...item.gallery, item.asset] } : item,
        ),
      },
    }));
  const removeGalleryImage = (section, itemIndex, imageIndex) =>
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        items: current[section].items.map((item, index) =>
          index === itemIndex && item.gallery.length > 1
            ? { ...item, gallery: item.gallery.filter((_, galleryIndex) => galleryIndex !== imageIndex) }
            : item,
        ),
      },
    }));
  const updateAboutGallery = (imageIndex, value) =>
    setDraft((current) => ({
      ...current,
      about: {
        ...current.about,
        gallery: current.about.gallery.map((image, index) => (index === imageIndex ? value : image)),
      },
    }));
  const addAboutGalleryImage = () =>
    setDraft((current) => ({
      ...current,
      about: { ...current.about, gallery: [...current.about.gallery, current.about.image] },
    }));
  const removeAboutGalleryImage = (imageIndex) =>
    setDraft((current) => ({
      ...current,
      about: {
        ...current.about,
        gallery:
          current.about.gallery.length > 1
            ? current.about.gallery.filter((_, index) => index !== imageIndex)
            : current.about.gallery,
      },
    }));

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setNotice("Please choose an image smaller than 12 MB.");
      return;
    }
    try {
      const image = await optimizeImage(file);
      setDraft((current) => ({ ...current, mediaMode: "image", backgroundImage: image }));
      setNotice("Image ready. Click Save changes to keep it after refresh.");
    } catch (imageError) {
      setNotice(imageError.message);
    }
  };

  const handleLogoImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await optimizeImage(file);
      update("logoImage", image);
      setNotice("Logo image ready. Click Save changes to keep it after refresh.");
    } catch (imageError) {
      setNotice(imageError.message);
    }
  };

  const save = async () => {
    setIsSaving(true);
    try {
      setNotice(await onSave(draft));
    } finally {
      setIsSaving(false);
    }
  };

  const copyLink = async () => {
    try {
      const encoded = encodeContent(draft);
      const url = `${window.location.origin}${window.location.pathname}${window.location.search}#content=${encoded}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setNotice(
        containsLocalImage(draft)
          ? "Share link copied. Local uploads are excluded; use public image URLs when sharing."
          : "Share link copied with the current text and image URLs.",
      );
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("Unable to copy the share link. Please allow clipboard access and try again.");
    }
  };

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-30 grid size-12 place-items-center border border-white/20 bg-[#070b0a]/80 text-white shadow-2xl backdrop-blur-md transition-colors hover:border-[#5ed29c] hover:text-[#5ed29c]"
        type="button"
        title="Edit content"
        aria-label="Edit page content"
        onClick={() => setIsOpen(true)}
      >
        <Settings size={19} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/75 p-3 backdrop-blur-sm sm:p-5">
          <section className="ml-auto flex h-full w-full max-w-[440px] flex-col overflow-hidden border border-white/15 bg-[#0a0f0d] text-white shadow-2xl">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
              <div className="flex items-center gap-3">
                <Settings size={17} className="text-[#5ed29c]" />
                <div>
                  <p className="text-sm font-bold">Content editor</p>
                  <p className="text-[10px] text-white/45">CodeNest hero</p>
                </div>
              </div>
              <button className="grid size-10 place-items-center" type="button" aria-label="Close editor" onClick={closeEditor}>
                <X size={20} />
              </button>
            </header>

            {!isUnlocked ? (
              <form className="flex flex-1 flex-col justify-center p-6" onSubmit={unlock}>
                <LockKeyhole size={28} className="text-[#5ed29c]" />
                <h2 className="mt-5 text-2xl font-extrabold">Unlock editing</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/55">
                  Enter the replacement password to update text and background media.
                </p>
                <label className="mt-7 text-[11px] font-bold uppercase text-white/55">
                  Password
                  <input
                    className="mt-2 w-full border border-white/15 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-[#5ed29c]"
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
                <button className="mt-5 min-h-12 bg-[#5ed29c] text-xs font-bold uppercase text-[#070b0a]" type="submit">
                  Unlock editor
                </button>
              </form>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  <EditorGroup title="Hero section" open>
                    <div className="grid grid-cols-2 gap-2" aria-label="Background type">
                      <button
                        className={`flex min-h-11 items-center justify-center gap-2 border text-xs font-bold ${
                          draft.mediaMode === "video"
                            ? "border-[#5ed29c] bg-[#5ed29c] text-[#070b0a]"
                            : "border-white/15 text-white/65"
                        }`}
                        type="button"
                        onClick={() => update("mediaMode", "video")}
                      >
                        <Video size={15} /> Video
                      </button>
                      <button
                        className={`flex min-h-11 items-center justify-center gap-2 border text-xs font-bold ${
                          draft.mediaMode === "image"
                            ? "border-[#5ed29c] bg-[#5ed29c] text-[#070b0a]"
                            : "border-white/15 text-white/65"
                        }`}
                        type="button"
                        onClick={() => update("mediaMode", "image")}
                      >
                        <ImageIcon size={15} /> Image
                      </button>
                    </div>

                    {draft.mediaMode === "video" ? (
                      <Field label="HLS video URL" value={draft.videoUrl} onChange={(event) => update("videoUrl", event.target.value)} />
                    ) : (
                      <>
                        <Field
                          label="Background image URL"
                          value={draft.backgroundImage?.startsWith("data:") ? "" : draft.backgroundImage}
                          onChange={(event) => update("backgroundImage", event.target.value)}
                        />
                        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-dashed border-white/25 text-xs font-bold text-white/70 hover:border-[#5ed29c] hover:text-[#5ed29c]">
                          <Upload size={15} /> Upload local image
                          <input className="sr-only" type="file" accept="image/*" onChange={handleImage} />
                        </label>
                      </>
                    )}

                    <Field label="Brand" value={draft.brand} onChange={(event) => update("brand", event.target.value)} />
                    <Field
                      label="Logo image URL"
                      value={draft.logoImage?.startsWith("data:") ? "" : draft.logoImage}
                      onChange={(event) => update("logoImage", event.target.value)}
                    />
                    <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-dashed border-white/25 text-xs font-bold text-white/70 hover:border-[#5ed29c] hover:text-[#5ed29c]">
                      <Upload size={15} /> Upload logo image
                      <input className="sr-only" type="file" accept="image/*" onChange={handleLogoImage} />
                    </label>
                    <Field label="Eyebrow" value={draft.eyebrow} onChange={(event) => update("eyebrow", event.target.value)} />
                    <Field label="Headline" value={draft.headline} onChange={(event) => update("headline", event.target.value)} />
                    <Field label="Description" value={draft.description} multiline onChange={(event) => update("description", event.target.value)} />
                    <Field label="CTA label" value={draft.ctaLabel} onChange={(event) => update("ctaLabel", event.target.value)} />
                    <div className="h-px bg-white/10" />
                    <p className="text-[10px] font-bold uppercase text-white/35">Glass card</p>
                    <Field label="Year tag" value={draft.card.year} onChange={(event) => updateCard("year", event.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Lead" value={draft.card.lead} onChange={(event) => updateCard("lead", event.target.value)} />
                      <Field label="Serif word" value={draft.card.accent} onChange={(event) => updateCard("accent", event.target.value)} />
                    </div>
                    <Field label="Tail" value={draft.card.tail} onChange={(event) => updateCard("tail", event.target.value)} />
                    <Field label="Card description" value={draft.card.description} multiline onChange={(event) => updateCard("description", event.target.value)} />
                  </EditorGroup>

                  <EditorGroup title="Section heights">
                    <RangeField label="Projects" value={draft.sectionSizes.projects} min={180} max={340} onChange={(event) => updateSize("projects", event.target.value)} />
                    <RangeField label="Blog" value={draft.sectionSizes.blog} onChange={(event) => updateSize("blog", event.target.value)} />
                    <RangeField label="Resume" value={draft.sectionSizes.resume} onChange={(event) => updateSize("resume", event.target.value)} />
                    <RangeField label="About" value={draft.sectionSizes.about} onChange={(event) => updateSize("about", event.target.value)} />
                  </EditorGroup>

                  <EditorGroup title="Projects section">
                    <Field label="Eyebrow" value={draft.projects.eyebrow} onChange={(event) => updateSection("projects", "eyebrow", event.target.value)} />
                    <Field label="Title" value={draft.projects.title} multiline onChange={(event) => updateSection("projects", "title", event.target.value)} />
                    <Field label="Description" value={draft.projects.description} multiline onChange={(event) => updateSection("projects", "description", event.target.value)} />
                    {draft.projects.items.map((item, index) => (
                      <div key={item.index} className="space-y-4 border-t border-white/10 pt-4">
                        <p className="text-[10px] font-bold uppercase text-white/35">Project {index + 1}</p>
                        <Field label="Title" value={item.title} onChange={(event) => updateSectionItem("projects", index, "title", event.target.value)} />
                        <Field label="Label" value={item.label} onChange={(event) => updateSectionItem("projects", index, "label", event.target.value)} />
                        <Field label="Description" value={item.description} multiline onChange={(event) => updateSectionItem("projects", index, "description", event.target.value)} />
                        <Field label="Metric" value={item.metric} onChange={(event) => updateSectionItem("projects", index, "metric", event.target.value)} />
                        <Field label="Image URL" value={item.asset} onChange={(event) => updateSectionItem("projects", index, "asset", event.target.value)} />
                        <RangeField
                          label="Secondary gallery height"
                          value={item.galleryHeight}
                          min={45}
                          max={92}
                          onChange={(event) => updateSectionItem("projects", index, "galleryHeight", Number(event.target.value))}
                        />
                        <p className="text-[10px] font-bold uppercase text-white/35">Secondary gallery images</p>
                        {item.gallery.map((image, imageIndex) => (
                          <div key={`${index}-${imageIndex}`} className="grid grid-cols-[1fr_auto] gap-2">
                            <Field
                              label={`Slide ${imageIndex + 1} URL`}
                              value={image}
                              onChange={(event) => updateGalleryImage("projects", index, imageIndex, event.target.value)}
                            />
                            <button
                              className="mt-5 grid size-10 place-items-center border border-white/15 text-white/45 hover:border-red-300 hover:text-red-300"
                              type="button"
                              title="Remove slide"
                              onClick={() => removeGalleryImage("projects", index, imageIndex)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="flex min-h-10 w-full items-center justify-center gap-2 border border-white/15 text-[10px] font-bold uppercase text-white/60 hover:border-[#5ed29c] hover:text-[#5ed29c]"
                          type="button"
                          onClick={() => addGalleryImage("projects", index)}
                        >
                          <Plus size={14} /> Add slide
                        </button>
                      </div>
                    ))}
                  </EditorGroup>

                  <EditorGroup title="Blog section">
                    <Field label="Eyebrow" value={draft.blog.eyebrow} onChange={(event) => updateSection("blog", "eyebrow", event.target.value)} />
                    <Field label="Title" value={draft.blog.title} multiline onChange={(event) => updateSection("blog", "title", event.target.value)} />
                    <Field label="Description" value={draft.blog.description} multiline onChange={(event) => updateSection("blog", "description", event.target.value)} />
                    {draft.blog.items.map((item, index) => (
                      <div key={`${item.category}-${index}`} className="space-y-4 border-t border-white/10 pt-4">
                        <p className="text-[10px] font-bold uppercase text-white/35">Article {index + 1}</p>
                        <Field label="Category" value={item.category} onChange={(event) => updateSectionItem("blog", index, "category", event.target.value)} />
                        <Field label="Title" value={item.title} multiline onChange={(event) => updateSectionItem("blog", index, "title", event.target.value)} />
                        <Field label="Meta" value={item.meta} onChange={(event) => updateSectionItem("blog", index, "meta", event.target.value)} />
                        <Field label="Image URL" value={item.asset} onChange={(event) => updateSectionItem("blog", index, "asset", event.target.value)} />
                        <RangeField
                          label="Secondary gallery height"
                          value={item.galleryHeight}
                          min={45}
                          max={92}
                          onChange={(event) => updateSectionItem("blog", index, "galleryHeight", Number(event.target.value))}
                        />
                        <p className="text-[10px] font-bold uppercase text-white/35">Secondary gallery images</p>
                        {item.gallery.map((image, imageIndex) => (
                          <div key={`${index}-${imageIndex}`} className="grid grid-cols-[1fr_auto] gap-2">
                            <Field
                              label={`Slide ${imageIndex + 1} URL`}
                              value={image}
                              onChange={(event) => updateGalleryImage("blog", index, imageIndex, event.target.value)}
                            />
                            <button
                              className="mt-5 grid size-10 place-items-center border border-white/15 text-white/45 hover:border-red-300 hover:text-red-300"
                              type="button"
                              title="Remove slide"
                              onClick={() => removeGalleryImage("blog", index, imageIndex)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="flex min-h-10 w-full items-center justify-center gap-2 border border-white/15 text-[10px] font-bold uppercase text-white/60 hover:border-[#5ed29c] hover:text-[#5ed29c]"
                          type="button"
                          onClick={() => addGalleryImage("blog", index)}
                        >
                          <Plus size={14} /> Add slide
                        </button>
                      </div>
                    ))}
                  </EditorGroup>

                  <EditorGroup title="Resume section">
                    <Field label="Eyebrow" value={draft.resume.eyebrow} onChange={(event) => updateSection("resume", "eyebrow", event.target.value)} />
                    <Field label="Title" value={draft.resume.title} multiline onChange={(event) => updateSection("resume", "title", event.target.value)} />
                    <Field label="Description" value={draft.resume.description} multiline onChange={(event) => updateSection("resume", "description", event.target.value)} />
                    {draft.resume.items.map((item, index) => (
                      <div key={item.step} className="space-y-4 border-t border-white/10 pt-4">
                        <p className="text-[10px] font-bold uppercase text-white/35">Step {index + 1}</p>
                        <Field label="Title" value={item.title} onChange={(event) => updateSectionItem("resume", index, "title", event.target.value)} />
                        <Field label="Description" value={item.description} multiline onChange={(event) => updateSectionItem("resume", index, "description", event.target.value)} />
                        <Field label="Image URL" value={item.asset} onChange={(event) => updateSectionItem("resume", index, "asset", event.target.value)} />
                        <RangeField
                          label="Secondary gallery height"
                          value={item.galleryHeight}
                          min={45}
                          max={92}
                          onChange={(event) => updateSectionItem("resume", index, "galleryHeight", Number(event.target.value))}
                        />
                        <p className="text-[10px] font-bold uppercase text-white/35">Secondary gallery images</p>
                        {item.gallery.map((image, imageIndex) => (
                          <div key={`${index}-${imageIndex}`} className="grid grid-cols-[1fr_auto] gap-2">
                            <Field
                              label={`Slide ${imageIndex + 1} URL`}
                              value={image}
                              onChange={(event) => updateGalleryImage("resume", index, imageIndex, event.target.value)}
                            />
                            <button
                              className="mt-5 grid size-10 place-items-center border border-white/15 text-white/45 hover:border-red-300 hover:text-red-300"
                              type="button"
                              title="Remove slide"
                              onClick={() => removeGalleryImage("resume", index, imageIndex)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="flex min-h-10 w-full items-center justify-center gap-2 border border-white/15 text-[10px] font-bold uppercase text-white/60 hover:border-[#5ed29c] hover:text-[#5ed29c]"
                          type="button"
                          onClick={() => addGalleryImage("resume", index)}
                        >
                          <Plus size={14} /> Add slide
                        </button>
                      </div>
                    ))}
                  </EditorGroup>

                  <EditorGroup title="Personal introduction">
                    <Field label="Eyebrow" value={draft.about.eyebrow} onChange={(event) => updateSection("about", "eyebrow", event.target.value)} />
                    <Field label="Title" value={draft.about.title} multiline onChange={(event) => updateSection("about", "title", event.target.value)} />
                    <Field label="Name" value={draft.about.name} onChange={(event) => updateSection("about", "name", event.target.value)} />
                    <Field label="Role" value={draft.about.role} onChange={(event) => updateSection("about", "role", event.target.value)} />
                    <Field label="Biography" value={draft.about.bio} multiline onChange={(event) => updateSection("about", "bio", event.target.value)} />
                    <Field label="Email" value={draft.about.email} onChange={(event) => updateSection("about", "email", event.target.value)} />
                    <Field label="Location" value={draft.about.location} onChange={(event) => updateSection("about", "location", event.target.value)} />
                    <Field label="Portrait / image URL" value={draft.about.image} onChange={(event) => updateSection("about", "image", event.target.value)} />
                    <RangeField
                      label="Secondary gallery height"
                      value={draft.about.galleryHeight}
                      min={45}
                      max={92}
                      onChange={(event) => updateSection("about", "galleryHeight", Number(event.target.value))}
                    />
                    <p className="text-[10px] font-bold uppercase text-white/35">Secondary gallery images</p>
                    {draft.about.gallery.map((image, imageIndex) => (
                      <div key={imageIndex} className="grid grid-cols-[1fr_auto] gap-2">
                        <Field label={`Slide ${imageIndex + 1} URL`} value={image} onChange={(event) => updateAboutGallery(imageIndex, event.target.value)} />
                        <button
                          className="mt-5 grid size-10 place-items-center border border-white/15 text-white/45 hover:border-red-300 hover:text-red-300"
                          type="button"
                          title="Remove slide"
                          onClick={() => removeAboutGalleryImage(imageIndex)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <button
                      className="flex min-h-10 w-full items-center justify-center gap-2 border border-white/15 text-[10px] font-bold uppercase text-white/60 hover:border-[#5ed29c] hover:text-[#5ed29c]"
                      type="button"
                      onClick={addAboutGalleryImage}
                    >
                      <Plus size={14} /> Add slide
                    </button>
                  </EditorGroup>

                </div>

                <footer className="grid shrink-0 grid-cols-[auto_1fr] gap-2 border-t border-white/10 p-4">
                  {notice && (
                    <p className="col-span-2 border-l-2 border-[#5ed29c] py-1 pl-3 text-xs leading-5 text-white/65" aria-live="polite">
                      {notice}
                    </p>
                  )}
                  <button
                    className="grid size-11 place-items-center border border-white/15 text-white/65 hover:text-white"
                    type="button"
                    title="Reset content"
                    disabled={isSaving}
                    onClick={async () => {
                      const resetValue = await onReset();
                      setDraft(resetValue);
                      setNotice("Default content restored.");
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className="flex min-h-11 items-center justify-center gap-2 bg-[#5ed29c] text-xs font-bold uppercase text-[#070b0a]"
                    type="button"
                    disabled={isSaving}
                    onClick={save}
                  >
                    <Save size={16} /> {isSaving ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    className="col-span-2 flex min-h-11 items-center justify-center gap-2 border border-white/15 text-xs font-bold uppercase text-white/70 hover:border-[#5ed29c] hover:text-[#5ed29c]"
                    type="button"
                    onClick={copyLink}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Link copied" : "Copy shareable text link"}
                  </button>
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [content, setContent] = useState(readInitialContent);

  useEffect(() => {
    let cancelled = false;
    const hashValue = window.location.hash.startsWith("#content=")
      ? window.location.hash.slice("#content=".length)
      : "";
    const sharedContent = hashValue ? decodeContent(hashValue) : null;

    if (sharedContent) {
      writePersistentContent(sharedContent).catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }

    readPersistentContent()
      .then((savedContent) => {
        if (!cancelled && savedContent) setContent(mergeContent(savedContent));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const saveContent = async (nextContent) => {
    const merged = mergeContent(nextContent);
    setContent(merged);

    let backupSaved = false;
    let fullContentSaved = false;
    try {
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(stripLocalImages(merged)));
      backupSaved = true;
    } catch {
      backupSaved = false;
    }

    try {
      await writePersistentContent(merged);
      fullContentSaved = true;
    } catch {
      fullContentSaved = false;
    }

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    if (fullContentSaved) {
      return "Saved in this browser. Refreshing will keep the current text, links, and uploaded images.";
    }
    if (backupSaved) {
      return containsLocalImage(merged)
        ? "Text and image links were saved, but local uploads could not be stored. Use public image URLs for those images."
        : "Saved in this browser. Refreshing will keep the current text and image links.";
    }
    return "Preview updated, but this browser blocked persistent storage. Check privacy settings and try again.";
  };

  const resetContent = async () => {
    localStorage.removeItem(CONTENT_STORAGE_KEY);
    await clearPersistentContent().catch(() => undefined);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setContent(DEFAULT_CONTENT);
    return DEFAULT_CONTENT;
  };

  const detailId = new URLSearchParams(window.location.search).get("detail");

  if (detailId) {
    return (
      <>
        <DetailPage detailId={detailId} content={content} />
        <ContentEditor content={content} onSave={saveContent} onReset={resetContent} />
      </>
    );
  }

  return (
    <main id="top" className="min-h-[100dvh] overflow-x-clip bg-[#070b0a] text-white">
      <div className="relative min-h-[100dvh] overflow-hidden">
        <BackgroundMedia content={content} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070b0a_0%,rgba(7,11,10,0.88)_28%,rgba(7,11,10,0.18)_72%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#070b0a_0%,rgba(7,11,10,0.72)_18%,transparent_58%)]" />
        <div className="absolute inset-0 bg-black/10" />
        <CentralGlow />
        <GridLines />

        <Navigation
          brand={content.brand}
          logoImage={content.logoImage}
          isOpen={isMenuOpen}
          onToggle={() => setIsMenuOpen((current) => !current)}
          onClose={() => setIsMenuOpen(false)}
        />

        <section className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1440px] items-end px-5 pb-10 pt-40 sm:px-8 sm:pb-14 lg:px-12 lg:pb-16">
          <div className="w-full max-w-[860px]">
            <GlassCard content={content.card} />
            <div className="-mt-8 border-l border-white/20 pl-5 sm:pl-7">
              <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0] text-[#5ed29c]">{content.eyebrow}</p>
              <h1 className="mt-4 text-[40px] font-extrabold uppercase leading-[0.94] tracking-[0] text-white sm:text-[54px] lg:text-[72px]">
                {content.headline}<span className="text-[#5ed29c]">.</span>
              </h1>
              <p className="mt-5 max-w-lg text-[14px] leading-6 text-white/70">{content.description}</p>
              <a
                className="group mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#5ed29c] px-6 text-[12px] font-bold uppercase text-[#070b0a] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#72e1ad] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5ed29c]"
                href="#projects"
              >
                {content.ctaLabel}
                <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" size={17} />
              </a>
            </div>
          </div>
        </section>
      </div>

      <ProjectsSection content={content.projects} size={content.sectionSizes.projects} />
      <BlogSection content={content.blog} size={content.sectionSizes.blog} />
      <ResumeSection content={content.resume} size={content.sectionSizes.resume} />
      <AboutSection content={content.about} size={content.sectionSizes.about} />
      <ContentEditor content={content} onSave={saveContent} onReset={resetContent} />
    </main>
  );
}

export default App;
