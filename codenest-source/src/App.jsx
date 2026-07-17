import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Image as ImageIcon,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { CONTENT_STORAGE_KEY, DEFAULT_CONTENT } from "./content";
import { AboutSection, BlogSection, ProjectsSection, ResumeSection } from "./Sections";
import DetailPage from "./DetailPage";
import Galaxy from "./Galaxy";
import { consumeHomeScrollPosition } from "./scrollPosition";
import {
  fetchRemoteContent,
  getAdminSession,
  saveRemoteContent,
  signInAdmin,
  signOutAdmin,
  subscribeAdminSession,
  uploadPortfolioImage,
} from "./supabase";

const navTargets = [
  { key: "projects", href: "#projects" },
  { key: "blog", href: "#blog" },
  { key: "resume", href: "#resume" },
  { key: "about", href: "#about" },
];
const CONTENT_DB_NAME = "codenest-editor";
const CONTENT_STORE_NAME = "content";
const CONTENT_RECORD_KEY = "current";
const GALAXY_FOCAL = [0.68, 0.44];
const GALAXY_ROTATION = [0.96, 0.18];

function mergeContent(value = {}) {
  const mergeItems = (defaults, incoming = []) =>
    defaults.map((item, index) => ({ ...item, ...(incoming[index] || {}) }));

  return {
    ...DEFAULT_CONTENT,
    ...value,
    mediaMode: value.mediaMode === "image" ? "image" : "galaxy",
    card: {
      ...DEFAULT_CONTENT.card,
      ...(value.card || {}),
    },
    navigation: {
      ...DEFAULT_CONTENT.navigation,
      ...(value.navigation || {}),
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

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event) => setReducedMotion(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

function BackgroundMedia({ content }) {
  const reducedMotion = useReducedMotion();

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
    <div className="absolute inset-0 bg-[#020504]" aria-hidden="true">
      <Galaxy
        className="opacity-90"
        focal={GALAXY_FOCAL}
        rotation={GALAXY_ROTATION}
        starSpeed={0.34}
        density={0.82}
        hueShift={122}
        speed={0.48}
        glowIntensity={0.54}
        saturation={0.42}
        mouseInteraction={!reducedMotion}
        mouseRepulsion
        repulsionStrength={2.8}
        twinkleIntensity={0.2}
        rotationSpeed={0.018}
        disableAnimation={reducedMotion}
        transparent={false}
      />
    </div>
  );
}

function Logo({ brand, logoImage }) {
  return (
    <a className="group flex min-w-0 items-center gap-3 text-[#090909]" href="#top" aria-label={`${brand} home`}>
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden bg-[#090909] font-mono text-[10px] font-black text-white">
        {logoImage ? <img className="h-full w-full object-cover" src={logoImage} alt="" /> : "A/P"}
        {!logoImage && <span className="absolute right-1 top-1 size-2 bg-[#f5ea28] transition-transform duration-300 group-hover:scale-125" />}
      </span>
      <span className="max-w-56 truncate text-[15px] font-black tracking-[0]">{brand}</span>
    </a>
  );
}

function Navigation({ brand, logoImage, navigation, isOpen, onToggle, onClose, onEdit }) {
  const items = navTargets.map((item) => ({
    ...item,
    label: navigation?.[item.key]?.trim() || DEFAULT_CONTENT.navigation[item.key],
  }));

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
      <header className="fixed inset-x-0 top-0 z-50 border-b-2 border-[#090909] bg-[#f7f7f2]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1520px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Logo brand={brand} logoImage={logoImage} />
          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary navigation">
            {items.map((item) => (
              <a
                key={item.key}
                className="max-w-36 truncate px-2 py-2 text-[13px] font-black uppercase text-[#090909] transition-colors duration-200 hover:bg-[#f5ea28] focus-visible:bg-[#f5ea28]"
                href={item.href}
                title={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <button
            className="grid size-11 place-items-center border-2 border-[#090909] bg-[#090909] text-white md:hidden"
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
        className={`fixed inset-0 z-40 flex bg-[#f7f7f2] px-5 pb-8 pt-28 transition-[opacity,visibility] duration-300 md:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <nav className="flex w-full flex-col justify-between" aria-label="Mobile navigation">
          <div className="flex flex-col">
            {items.map((item, index) => (
              <a
                key={item.key}
                className="mb-2 flex items-center justify-between border-2 border-[#090909] bg-white px-5 py-5 text-2xl font-black text-[#090909] transition-colors hover:bg-[#f5ea28]"
                href={item.href}
                onClick={onClose}
              >
                <span className="min-w-0 break-words pr-4">{item.label}</span>
                <span className="font-jakarta text-[10px] text-[#090909]">0{index + 1}</span>
              </a>
            ))}
            <button
              className="mt-2 flex items-center justify-between border-2 border-[#090909] bg-[#090909] px-5 py-5 text-left text-xl font-black text-white transition-colors hover:bg-[#f5ea28] hover:text-[#090909]"
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
            >
              <span className="flex items-center gap-3">
                <Settings size={20} />
                Edit content
              </span>
              <span className="font-jakarta text-[10px]">ADMIN</span>
            </button>
          </div>
          <p className="max-w-64 text-xs font-bold leading-5 text-[#090909]/48">
            Build the skills. Ship the work. Start the career.
          </p>
        </nav>
      </div>
    </>
  );
}

function Field({ label, value, onChange, multiline = false }) {
  const className =
    "mt-2 w-full rounded-[10px] border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#f5ea28]";
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

function UploadButton({ label = "Upload image", onChange, disabled = false }) {
  return (
    <label
      className={`flex min-h-10 items-center justify-center gap-2 border border-dashed border-white/20 text-[10px] font-bold uppercase text-white/55 transition-colors ${
        disabled ? "cursor-wait opacity-45" : "cursor-pointer hover:border-[#f5ea28] hover:text-[#f5ea28]"
      }`}
    >
      <Upload size={14} /> {disabled ? "Uploading..." : label}
      <input className="sr-only" type="file" accept="image/*" disabled={disabled} onChange={onChange} />
    </label>
  );
}

function RangeField({ label, value, min = 80, max = 280, onChange }) {
  return (
    <label className="block text-[11px] font-bold uppercase text-white/55">
      <span className="flex items-center justify-between">
        {label}
        <span className="text-[#f5ea28]">{value}vh</span>
      </span>
      <input
        className="mt-3 w-full accent-[#f5ea28]"
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
      <summary className="cursor-pointer px-4 py-4 text-[11px] font-bold uppercase text-[#f5ea28]">{title}</summary>
      <div className="space-y-4 border-t border-white/10 p-4">{children}</div>
    </details>
  );
}

function ContentEditor({ content, session, cloudStatus, onSignIn, onSignOut, onSave, onReset, onUpload }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draft, setDraft] = useState(content);
  const isUnlocked = Boolean(session);

  useEffect(() => setDraft(content), [content]);

  useEffect(() => {
    const openEditor = () => setIsOpen(true);
    window.addEventListener("codenest:open-editor", openEditor);
    return () => window.removeEventListener("codenest:open-editor", openEditor);
  }, []);

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
    setIsAuthenticating(true);
    try {
      await onSignIn(email.trim(), password);
      setError("");
      setPassword("");
    } catch (authError) {
      setError(authError.message || "Unable to sign in.");
    } finally {
      setIsAuthenticating(false);
    }
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

  const uploadImage = async (event, area, applyValue) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setNotice("Please choose an image smaller than 12 MB.");
      return;
    }
    setIsUploading(true);
    try {
      const image = await optimizeImage(file);
      const publicUrl = await onUpload(image, area);
      applyValue(publicUrl);
      setNotice("Image uploaded. Click Save changes to publish the new URL.");
    } catch (imageError) {
      setNotice(imageError.message || "Unable to upload this image.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleImage = (event) =>
    uploadImage(event, "hero", (publicUrl) =>
      setDraft((current) => ({ ...current, mediaMode: "image", backgroundImage: publicUrl })),
    );

  const handleLogoImage = (event) => uploadImage(event, "logo", (publicUrl) => update("logoImage", publicUrl));

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
        className="fixed bottom-5 right-5 z-30 hidden size-14 place-items-center border-4 border-[#090909] bg-[#f5ea28] text-[#090909] shadow-2xl transition-colors hover:bg-[#090909] hover:text-white md:grid"
        type="button"
        title="Edit content"
        aria-label="Edit page content"
        onClick={() => setIsOpen(true)}
      >
        <Settings size={19} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/75 p-3 backdrop-blur-sm sm:p-5">
          <section className="ml-auto flex h-full w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] border-[6px] border-[#d6d8d2] bg-[#0a0f0d] text-white shadow-2xl">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
              <div className="flex items-center gap-3">
                <Settings size={17} className="text-[#f5ea28]" />
                <div>
                  <p className="text-sm font-bold">Content editor</p>
                  <p className={`text-[10px] ${cloudStatus === "online" ? "text-[#f5ea28]" : "text-white/45"}`}>
                    {cloudStatus === "online" ? "Supabase connected" : cloudStatus === "connecting" ? "Connecting..." : "Local fallback"}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {isUnlocked && (
                  <button
                    className="grid size-10 place-items-center text-white/55 hover:text-[#f5ea28]"
                    type="button"
                    title="Sign out"
                    aria-label="Sign out of editor"
                    onClick={onSignOut}
                  >
                    <LogOut size={17} />
                  </button>
                )}
                <button className="grid size-10 place-items-center" type="button" aria-label="Close editor" onClick={closeEditor}>
                  <X size={20} />
                </button>
              </div>
            </header>

            {!isUnlocked ? (
              <form className="flex flex-1 flex-col justify-center p-6" onSubmit={unlock}>
                <LockKeyhole size={28} className="text-[#f5ea28]" />
                <h2 className="mt-5 text-2xl font-extrabold">Admin sign in</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/55">Use the portfolio administrator account created in Supabase Auth.</p>
                <label className="mt-7 text-[11px] font-bold uppercase text-white/55">
                  Email
                  <input
                    className="mt-2 w-full rounded-[10px] border border-white/15 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-[#f5ea28]"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="mt-4 text-[11px] font-bold uppercase text-white/55">
                  Password
                  <input
                    className="mt-2 w-full rounded-[10px] border border-white/15 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-[#f5ea28]"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
                <button
                  className="mt-5 min-h-12 rounded-full bg-[#f5ea28] text-xs font-bold uppercase text-[#090909] disabled:cursor-wait disabled:opacity-60"
                  type="submit"
                  disabled={isAuthenticating || !email.trim() || !password}
                >
                  {isAuthenticating ? "Signing in..." : "Sign in"}
                </button>
              </form>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  <EditorGroup title="Site & navigation" open>
                    <Field label="Brand" value={draft.brand} onChange={(event) => update("brand", event.target.value)} />
                    <Field
                      label="Logo image URL"
                      value={draft.logoImage?.startsWith("data:") ? "" : draft.logoImage}
                      onChange={(event) => update("logoImage", event.target.value)}
                    />
                    <UploadButton label="Upload logo" disabled={isUploading} onChange={handleLogoImage} />
                    <div className="h-px bg-white/10" />
                    <p className="text-[10px] font-bold uppercase text-white/35">Menu labels</p>
                    <Field
                      label="Projects label"
                      value={draft.navigation.projects}
                      onChange={(event) => updateSection("navigation", "projects", event.target.value)}
                    />
                    <Field
                      label="Blog label"
                      value={draft.navigation.blog}
                      onChange={(event) => updateSection("navigation", "blog", event.target.value)}
                    />
                    <Field
                      label="Resume label"
                      value={draft.navigation.resume}
                      onChange={(event) => updateSection("navigation", "resume", event.target.value)}
                    />
                    <Field
                      label="About label"
                      value={draft.navigation.about}
                      onChange={(event) => updateSection("navigation", "about", event.target.value)}
                    />
                  </EditorGroup>

                  <EditorGroup title="Hero section">
                    <div className="grid grid-cols-2 gap-2" aria-label="Background type">
                      <button
                        className={`flex min-h-11 items-center justify-center gap-2 border text-xs font-bold ${
                          draft.mediaMode !== "image"
                            ? "border-[#f5ea28] bg-[#f5ea28] text-[#090909]"
                            : "border-white/15 text-white/65"
                        }`}
                        type="button"
                        onClick={() => update("mediaMode", "galaxy")}
                      >
                        <Sparkles size={15} /> Galaxy
                      </button>
                      <button
                        className={`flex min-h-11 items-center justify-center gap-2 border text-xs font-bold ${
                          draft.mediaMode === "image"
                            ? "border-[#f5ea28] bg-[#f5ea28] text-[#090909]"
                            : "border-white/15 text-white/65"
                        }`}
                        type="button"
                        onClick={() => update("mediaMode", "image")}
                      >
                        <ImageIcon size={15} /> Image
                      </button>
                    </div>

                    {draft.mediaMode === "image" && (
                      <>
                        <Field
                          label="Background image URL"
                          value={draft.backgroundImage?.startsWith("data:") ? "" : draft.backgroundImage}
                          onChange={(event) => update("backgroundImage", event.target.value)}
                        />
                        <UploadButton label="Upload background" disabled={isUploading} onChange={handleImage} />
                      </>
                    )}

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
                        <UploadButton
                          label="Upload project cover"
                          disabled={isUploading}
                          onChange={(event) => uploadImage(event, `projects/${index}`, (publicUrl) => updateSectionItem("projects", index, "asset", publicUrl))}
                        />
                        <RangeField
                          label="Secondary gallery height"
                          value={item.galleryHeight}
                          min={45}
                          max={92}
                          onChange={(event) => updateSectionItem("projects", index, "galleryHeight", Number(event.target.value))}
                        />
                        <p className="text-[10px] font-bold uppercase text-white/35">Secondary gallery images</p>
                        {item.gallery.map((image, imageIndex) => (
                          <div key={`${index}-${imageIndex}`} className="space-y-2">
                            <div className="grid grid-cols-[1fr_auto] gap-2">
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
                            <UploadButton
                              label={`Upload slide ${imageIndex + 1}`}
                              disabled={isUploading}
                              onChange={(event) => uploadImage(event, `projects/${index}/gallery`, (publicUrl) => updateGalleryImage("projects", index, imageIndex, publicUrl))}
                            />
                          </div>
                        ))}
                        <button
                          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-[10px] font-bold uppercase text-white/60 hover:border-[#f5ea28] hover:text-[#f5ea28]"
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
                        <UploadButton
                          label="Upload article cover"
                          disabled={isUploading}
                          onChange={(event) => uploadImage(event, `blog/${index}`, (publicUrl) => updateSectionItem("blog", index, "asset", publicUrl))}
                        />
                        <RangeField
                          label="Secondary gallery height"
                          value={item.galleryHeight}
                          min={45}
                          max={92}
                          onChange={(event) => updateSectionItem("blog", index, "galleryHeight", Number(event.target.value))}
                        />
                        <p className="text-[10px] font-bold uppercase text-white/35">Secondary gallery images</p>
                        {item.gallery.map((image, imageIndex) => (
                          <div key={`${index}-${imageIndex}`} className="space-y-2">
                            <div className="grid grid-cols-[1fr_auto] gap-2">
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
                            <UploadButton
                              label={`Upload slide ${imageIndex + 1}`}
                              disabled={isUploading}
                              onChange={(event) => uploadImage(event, `blog/${index}/gallery`, (publicUrl) => updateGalleryImage("blog", index, imageIndex, publicUrl))}
                            />
                          </div>
                        ))}
                        <button
                          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-[10px] font-bold uppercase text-white/60 hover:border-[#f5ea28] hover:text-[#f5ea28]"
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
                        <UploadButton
                          label="Upload learning-path cover"
                          disabled={isUploading}
                          onChange={(event) => uploadImage(event, `resume/${index}`, (publicUrl) => updateSectionItem("resume", index, "asset", publicUrl))}
                        />
                        <RangeField
                          label="Secondary gallery height"
                          value={item.galleryHeight}
                          min={45}
                          max={92}
                          onChange={(event) => updateSectionItem("resume", index, "galleryHeight", Number(event.target.value))}
                        />
                        <p className="text-[10px] font-bold uppercase text-white/35">Secondary gallery images</p>
                        {item.gallery.map((image, imageIndex) => (
                          <div key={`${index}-${imageIndex}`} className="space-y-2">
                            <div className="grid grid-cols-[1fr_auto] gap-2">
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
                            <UploadButton
                              label={`Upload slide ${imageIndex + 1}`}
                              disabled={isUploading}
                              onChange={(event) => uploadImage(event, `resume/${index}/gallery`, (publicUrl) => updateGalleryImage("resume", index, imageIndex, publicUrl))}
                            />
                          </div>
                        ))}
                        <button
                          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-[10px] font-bold uppercase text-white/60 hover:border-[#f5ea28] hover:text-[#f5ea28]"
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
                    <UploadButton
                      label="Upload portrait"
                      disabled={isUploading}
                      onChange={(event) => uploadImage(event, "about", (publicUrl) => updateSection("about", "image", publicUrl))}
                    />
                    <RangeField
                      label="Secondary gallery height"
                      value={draft.about.galleryHeight}
                      min={45}
                      max={92}
                      onChange={(event) => updateSection("about", "galleryHeight", Number(event.target.value))}
                    />
                    <p className="text-[10px] font-bold uppercase text-white/35">Secondary gallery images</p>
                    {draft.about.gallery.map((image, imageIndex) => (
                      <div key={imageIndex} className="space-y-2">
                        <div className="grid grid-cols-[1fr_auto] gap-2">
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
                        <UploadButton
                          label={`Upload slide ${imageIndex + 1}`}
                          disabled={isUploading}
                          onChange={(event) => uploadImage(event, "about/gallery", (publicUrl) => updateAboutGallery(imageIndex, publicUrl))}
                        />
                      </div>
                    ))}
                    <button
                      className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-[10px] font-bold uppercase text-white/60 hover:border-[#f5ea28] hover:text-[#f5ea28]"
                      type="button"
                      onClick={addAboutGalleryImage}
                    >
                      <Plus size={14} /> Add slide
                    </button>
                  </EditorGroup>

                </div>

                <footer className="grid shrink-0 grid-cols-[auto_1fr] gap-2 border-t border-white/10 p-4">
                  {notice && (
                    <p className="col-span-2 border-l-2 border-[#f5ea28] py-1 pl-3 text-xs leading-5 text-white/65" aria-live="polite">
                      {notice}
                    </p>
                  )}
                  <button
                    className="grid size-11 place-items-center border border-white/15 text-white/65 hover:text-white"
                    type="button"
                    title="Reset content"
                    disabled={isSaving || isUploading}
                    onClick={async () => {
                      const resetValue = await onReset();
                      setDraft(resetValue);
                      setNotice("Default content restored.");
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f5ea28] text-xs font-bold uppercase text-[#090909]"
                    type="button"
                    disabled={isSaving || isUploading}
                    onClick={save}
                  >
                    <Save size={16} /> {isSaving ? "Saving..." : isUploading ? "Uploading..." : "Save changes"}
                  </button>
                  <button
                    className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 text-xs font-bold uppercase text-white/70 hover:border-[#f5ea28] hover:text-[#f5ea28]"
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
  const detailId = new URLSearchParams(window.location.search).get("detail");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [content, setContent] = useState(readInitialContent);
  const [session, setSession] = useState(null);
  const [cloudStatus, setCloudStatus] = useState("connecting");
  const [isContentReady, setIsContentReady] = useState(false);
  const openEditor = () => window.dispatchEvent(new Event("codenest:open-editor"));

  useEffect(() => {
    let cancelled = false;
    const hydrateContent = async () => {
      try {
        const hashValue = window.location.hash.startsWith("#content=")
          ? window.location.hash.slice("#content=".length)
          : "";
        const sharedContent = hashValue ? decodeContent(hashValue) : null;

        if (sharedContent) {
          await writePersistentContent(sharedContent).catch(() => undefined);
          try {
            await fetchRemoteContent();
            if (!cancelled) setCloudStatus("online");
          } catch {
            if (!cancelled) setCloudStatus("offline");
          }
          return;
        }

        try {
          const remoteContent = await fetchRemoteContent();
          if (remoteContent && !cancelled) {
            const merged = mergeContent(remoteContent);
            setContent(merged);
            localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(stripLocalImages(merged)));
            await writePersistentContent(merged).catch(() => undefined);
            if (!cancelled) setCloudStatus("online");
            return;
          }
          if (!cancelled) setCloudStatus("online");
        } catch {
          if (!cancelled) setCloudStatus("offline");
        }

        const savedContent = await readPersistentContent().catch(() => null);
        if (!cancelled && savedContent) setContent(mergeContent(savedContent));
      } finally {
        if (!cancelled) setIsContentReady(true);
      }
    };

    hydrateContent();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (detailId || !isContentReady) return undefined;

    const savedPosition = consumeHomeScrollPosition();
    if (savedPosition === null) return undefined;

    let secondFrame;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const root = document.documentElement;
        const previousBehavior = root.style.scrollBehavior;
        const maximumScroll = Math.max(0, root.scrollHeight - window.innerHeight);
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, Math.min(savedPosition, maximumScroll));
        root.style.scrollBehavior = previousBehavior;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [detailId, isContentReady]);

  useEffect(() => {
    let cancelled = false;
    getAdminSession()
      .then((currentSession) => {
        if (!cancelled) setSession(currentSession);
      })
      .catch(() => undefined);
    const unsubscribe = subscribeAdminSession((currentSession) => {
      if (!cancelled) setSession(currentSession);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handleSignIn = async (email, password) => {
    const currentSession = await signInAdmin(email, password);
    setSession(currentSession);
    setCloudStatus("online");
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setSession(null);
  };

  const handleUpload = async (dataUrl, area) => {
    if (!session) throw new Error("Your admin session has expired. Sign in again before uploading.");
    try {
      const publicUrl = await uploadPortfolioImage(dataUrl, area);
      setCloudStatus("online");
      return publicUrl;
    } catch (uploadError) {
      setCloudStatus("offline");
      throw uploadError;
    }
  };

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

    try {
      if (!session) throw new Error("Your admin session has expired. Sign in again before publishing.");
      await saveRemoteContent(stripLocalImages(merged));
      setCloudStatus("online");
      return containsLocalImage(merged)
        ? "Published to Supabase. Local-only images were excluded; upload them again to make them public."
        : "Published to Supabase. All visitors will now load this version.";
    } catch (remoteError) {
      setCloudStatus("offline");
      if (fullContentSaved || backupSaved) {
        return `Saved in this browser, but cloud publishing failed: ${remoteError.message || "check the Supabase setup and try again."}`;
      }
      return "Preview updated, but neither Supabase nor browser storage accepted the changes.";
    }

  };

  const resetContent = async () => {
    localStorage.removeItem(CONTENT_STORAGE_KEY);
    await clearPersistentContent().catch(() => undefined);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setContent(DEFAULT_CONTENT);
    return DEFAULT_CONTENT;
  };

  const galleryCount = content.projects.items.reduce(
    (total, item) => total + Math.max(1, item.gallery?.length || 0),
    0,
  );

  if (detailId) {
    return (
      <>
        <DetailPage detailId={detailId} content={content} onEdit={openEditor} />
        <ContentEditor
          content={content}
          session={session}
          cloudStatus={cloudStatus}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onSave={saveContent}
          onReset={resetContent}
          onUpload={handleUpload}
        />
      </>
    );
  }

  return (
    <main id="top" className="min-h-[100dvh] overflow-x-clip bg-[#d9d9d5] text-[#090909]">
      <div className="relative min-h-[100dvh] overflow-hidden bg-[#f4b44e]">
        <Navigation
          brand={content.brand}
          logoImage={content.logoImage}
          navigation={content.navigation}
          isOpen={isMenuOpen}
          onToggle={() => setIsMenuOpen((current) => !current)}
          onClose={() => setIsMenuOpen(false)}
          onEdit={openEditor}
        />

        <section className="relative z-10 mx-auto min-h-[100dvh] max-w-[1540px] px-0 pb-0 pt-20 sm:px-5 sm:pb-10 sm:pt-24 lg:px-8 lg:pb-14">
          <div className="editorial-shell relative overflow-hidden bg-[#f7f7f2] shadow-[0_28px_90px_rgba(91,55,0,0.24)]">
            <div className="relative px-5 pb-10 pt-10 sm:px-9 sm:pb-12 sm:pt-12 lg:px-16 lg:pb-14 lg:pt-14">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="inline-flex min-h-8 items-center bg-[#090909] px-3 font-jakarta text-[10px] font-black uppercase text-white">
                  {content.eyebrow}
                </span>
                <a
                  className="group inline-flex min-h-11 items-center gap-3 rounded-full bg-[#f5ea28] px-5 text-[11px] font-black uppercase text-[#090909] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#090909]"
                  href="#projects"
                >
                  {content.ctaLabel}
                  <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" size={16} />
                </a>
              </div>

              <h1 className="display-rounded mt-8 max-w-[12ch] text-[54px] uppercase leading-[0.8] text-[#090909] sm:text-[72px] lg:max-w-none lg:text-[92px] xl:text-[108px]">
                {content.headline}<span className="text-[#d4c600]">.</span>
              </h1>
            </div>

            <div className="relative min-h-[560px] overflow-hidden bg-[#050505] sm:min-h-[640px] lg:min-h-[70vh]">
              <BackgroundMedia content={content} />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72),rgba(0,0,0,0.06)_48%,rgba(0,0,0,0.56))]" />

              <aside className="absolute left-5 top-5 z-30 max-w-[270px] border-2 border-white/70 bg-black/62 p-5 text-white backdrop-blur-md sm:left-8 sm:top-8 sm:p-6">
                <p className="font-jakarta text-[11px] font-black text-[#f5ea28]">{content.card.year}</p>
                <h2 className="mt-12 text-xl font-black leading-[1.02]">
                  {content.card.lead} <span className="font-instrument inline-block pb-1 text-2xl font-normal italic leading-[1.1]">{content.card.accent}</span> {content.card.tail}
                </h2>
                <p className="mt-4 text-[11px] leading-5 text-white/62">{content.card.description}</p>
              </aside>

              <div className="pointer-events-none absolute right-5 top-5 z-30 hidden items-center sm:flex sm:right-8 sm:top-8" aria-hidden="true">
                {content.projects.items.slice(0, 2).map((item, index) => (
                  <div key={item.index} className={`size-20 overflow-hidden rounded-full border-[5px] border-white bg-[#090909] lg:size-24 ${index ? "-ml-4" : ""}`}>
                    <img className="h-full w-full object-cover" src={item.asset} alt="" />
                  </div>
                ))}
              </div>

              <div className="absolute left-1/2 top-[48%] z-10 h-[58%] w-[82%] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] border-2 border-dashed border-white/70 p-2 sm:h-[66%] sm:w-[64%] sm:p-3 lg:w-[54%]">
                <div className="h-full overflow-hidden border-[7px] border-[#f5ea28] bg-[#111] sm:border-[10px]">
                  <img className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.025]" src={content.projects.items[0]?.asset} alt={content.projects.items[0]?.title || "Featured project"} />
                </div>
              </div>

              <div className="absolute inset-x-[-6%] bottom-20 z-20 flex rotate-[-4deg] bg-[#48dce7] text-[#090909]">
                {[...content.projects.items, ...content.projects.items].map((item, index) => (
                  <span key={`hero-cyan-${item.index}-${index}`} className="shrink-0 border-r-2 border-[#090909] px-7 py-3 text-xs font-black uppercase sm:px-10 sm:text-sm">
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="absolute inset-x-[-6%] bottom-7 z-20 flex rotate-[3deg] bg-[#f5ea28] text-[#090909]">
                {[...content.projects.items].reverse().concat(content.projects.items).map((item, index) => (
                  <span key={`hero-yellow-${item.index}-${index}`} className="shrink-0 border-r-2 border-[#090909] px-7 py-3 text-xs font-black uppercase sm:px-10 sm:text-sm">
                    {item.metric}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid border-t-2 border-[#090909] bg-white lg:grid-cols-[1.05fr_0.95fr]">
              <div className="border-b-2 border-[#090909] p-6 sm:p-9 lg:border-b-0 lg:border-r-2 lg:p-12">
                <p className="max-w-2xl text-sm leading-7 text-[#090909]/66 sm:text-base sm:leading-8">{content.description}</p>
              </div>
              <div className="grid grid-cols-3 divide-x-2 divide-[#090909]">
                {[
                  [String(content.projects.items.length).padStart(2, "0"), "Projects"],
                  [String(content.resume.items.length).padStart(2, "0"), "Capabilities"],
                  [String(galleryCount).padStart(2, "0"), "Gallery pages"],
                ].map(([value, label]) => (
                  <div key={label} className="flex min-h-32 flex-col justify-center px-3 text-center sm:min-h-40 sm:px-5">
                    <strong className="display-rounded text-3xl leading-none sm:text-5xl">{value}</strong>
                    <span className="mt-3 text-[9px] font-black uppercase text-[#090909]/50 sm:text-[10px]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <ProjectsSection content={content.projects} size={content.sectionSizes.projects} />
      <BlogSection content={content.blog} size={content.sectionSizes.blog} />
      <ResumeSection content={content.resume} size={content.sectionSizes.resume} />
      <AboutSection content={content.about} size={content.sectionSizes.about} />
      <ContentEditor
        content={content}
        session={session}
        cloudStatus={cloudStatus}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onSave={saveContent}
        onReset={resetContent}
        onUpload={handleUpload}
      />
    </main>
  );
}

export default App;
