import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Clapperboard,
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
import ContentEditorV2 from "./ContentEditorV2";
import {
  clearEditorDraft,
  applyEditableLayoutOffsets,
  contentSnapshot,
  getContentValue,
  imagePathArea,
  imageRequirement,
  layoutBreakpoint,
  layoutOffset,
  normalizeEditTarget,
  readEditorDraft,
  setContentValue,
  targetFromElement,
  writeEditorDraft,
} from "./editorUtils";
import { CareerSection, ContactSection, ExperienceSection, LatestCasesSection, ProjectsSection, ProjectsShowcasePreview, StrengthsSection, VisualGallerySection } from "./Sections";
import { setupHomeAnimations, shouldPlayOpening } from "./animations";
import DetailPage from "./DetailPage";
import Galaxy from "./Galaxy";
import LineSidebar from "./LineSidebar";
import MusicPlayer from "./MusicPlayer";
import NavigationTransition from "./NavigationTransition";
import TargetCursor from "./TargetCursor";
import { requestPageTransition } from "./pageTransition";
import { consumeHomeScrollPosition, storeHomeScrollPosition } from "./scrollPosition";
import {
  fetchRemoteContent,
  getAdminSession,
  saveRemoteContent,
  signInAdmin,
  signOutAdmin,
  subscribeAdminSession,
  uploadPortfolioImage,
  uploadPortfolioFile,
} from "./supabase";

const navTargets = [
  { key: "home", href: "#top" },
  { key: "about", href: "#about" },
  { key: "career", href: "#experience" },
  { key: "projects", href: "#projects" },
  { key: "resume", href: "#strengths" },
  { key: "blog", href: "#contact" },
];
const CONTENT_DB_NAME = "codenest-editor";
const CONTENT_STORE_NAME = "content";
const CONTENT_RECORD_KEY = "current";
const GALAXY_FOCAL = [0.68, 0.44];
const GALAXY_ROTATION = [0.96, 0.18];
const LEGACY_OPERA_LOGO_URL_FRAGMENT = "1784107612896-c334286a-e841-4c40-b2b1-5ef3c07cd6b8";
const LEGACY_HERO_VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4";
const HERO_SCENES = [
  {
    label: "Golden Hour",
    shortLabel: "Golden",
    source: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4",
  },
  {
    label: "Still Water",
    shortLabel: "Water",
    source: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4",
  },
  {
    label: "Deep Woods",
    shortLabel: "Woods",
    source: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4",
  },
  {
    label: "Quiet Dawn",
    shortLabel: "Dawn",
    source: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4",
  },
];

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      reject(new Error("无法读取图片尺寸。"));
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });
}

const LEGACY_PROJECT_TITLES = [
  "Ship a production-ready product",
  "Learn inside a professional workflow",
  "Turn the project into career proof",
  "滔搏运动 · 全渠道运营设计与品牌升级",
  "Volga 敷尔佳 · 品牌电商视觉规范",
  "福瑞达集团 · 全渠道品牌视觉落地",
];
const LEGACY_BLOG_TITLES = [
  "Why copying code feels fast and learning feels slow",
  "A project becomes impressive when the decisions are visible",
  "How to speak about unfinished work in an interview",
];
const LEGACY_RESUME_TITLES = [
  "Foundations",
  "Guided builds",
  "Independent project",
  "Career launch",
  "Frontend craft",
  "Backend systems",
  "Team workflow",
  "Professional growth",
];

function isLegacyAsset(value) {
  return (
    typeof value === "string" &&
    (value.includes("images.unsplash.com/") ||
      value === "https://cnlfvmxwohyvksbbtplw.supabase.co/storage/v1/object/public/portfolio-assets/projects/0/1784108822264-0de2869c-d53b-4ffb-b49c-74b2f9e62a89.webp")
  );
}

function mergeItems(defaults, incoming = [], legacyTitles = []) {
  return defaults.map((item, index) => {
    const source = incoming[index] || {};
    const hasLegacyCopy = legacyTitles.includes(source.title);
    const gallery = Array.isArray(source.gallery) && source.gallery.length
      ? source.gallery
      : item.gallery;

    return {
      ...item,
      ...source,
      ...(hasLegacyCopy
        ? {
            title: item.title,
            label: item.label,
            category: item.category,
            meta: item.meta,
            metric: item.metric,
            description: item.description,
          }
        : {}),
      asset: isLegacyAsset(source.asset) ? item.asset : source.asset || item.asset,
      gallery: gallery.every(isLegacyAsset) ? item.gallery : gallery,
    };
  });
}

function migratedText(value, legacyValues, fallback) {
  if (value === undefined || value === null || legacyValues.includes(value)) return fallback;
  return value;
}

function sectionProjectSnapshot(item, projectIndex) {
  return {
    projectIndex,
    index: item.index,
    category: item.category,
    title: item.title,
    description: item.description,
    image: item.image,
  };
}

function mergeIndependentSectionItems(defaults, incoming) {
  const source = Array.isArray(incoming) ? incoming : [];
  return defaults.map((item, index) => ({
    ...item,
    ...(source[index] || {}),
    projectIndex: Number.isInteger(Number(source[index]?.projectIndex))
      ? Number(source[index].projectIndex)
      : item.projectIndex,
  }));
}

function defaultLatestItems() {
  return DEFAULT_CONTENT.projects.catalogItems
    .slice(0, 3)
    .map((item, projectIndex) => sectionProjectSnapshot(item, projectIndex));
}

function defaultVisualItems() {
  return DEFAULT_CONTENT.projects.catalogItems.flatMap((item, projectIndex) => {
    const images = item.gallery?.length ? item.gallery : [item.image];
    return images.filter(Boolean).map((image) => ({
      ...sectionProjectSnapshot(item, projectIndex),
      image,
    }));
  });
}

function defaultContactItems() {
  const items = DEFAULT_CONTENT.projects.catalogItems;
  if (!items.length) return [];
  return Array.from({ length: 7 }, (_, index) => {
    const projectIndex = index % items.length;
    return sectionProjectSnapshot(items[projectIndex], projectIndex);
  });
}

function mergeContent(value = {}) {
  const incomingAboutSize = Number(value.sectionSizes?.about);
  const incomingCareerSize = Number(value.sectionSizes?.career);
  const incomingProjectsSize = Number(value.sectionSizes?.projects);
  const catalogItems = DEFAULT_CONTENT.projects.catalogItems.map((item, index) => ({
    ...item,
    ...(Array.isArray(value.projects?.catalogItems) ? value.projects.catalogItems[index] : {}),
    gallery:
      Array.isArray(value.projects?.catalogItems?.[index]?.gallery) && value.projects.catalogItems[index].gallery.length
        ? value.projects.catalogItems[index].gallery
        : item.gallery,
  }));

  return {
    ...DEFAULT_CONTENT,
    ...value,
    logoImage: value.logoImage?.includes(LEGACY_OPERA_LOGO_URL_FRAGMENT)
      ? DEFAULT_CONTENT.logoImage
      : value.logoImage || DEFAULT_CONTENT.logoImage,
    eyebrow: migratedText(value.eyebrow, ["Career-Ready Curriculum"], DEFAULT_CONTENT.eyebrow),
    description: migratedText(
      value.description,
      ["Master in-demand coding skills through focused projects, expert feedback, and a portfolio designed to get you hired."],
      DEFAULT_CONTENT.description,
    ),
    mediaMode: ["video", "image", "galaxy"].includes(value.mediaMode) ? value.mediaMode : DEFAULT_CONTENT.mediaMode,
    videoUrl: migratedText(
      value.videoUrl,
      ["https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8"],
      DEFAULT_CONTENT.videoUrl,
    ),
    backgroundImage: value.backgroundImage || DEFAULT_CONTENT.backgroundImage,
    card: {
      ...DEFAULT_CONTENT.card,
      ...(value.card || {}),
    },
    navigation: {
      ...DEFAULT_CONTENT.navigation,
      ...(value.navigation || {}),
      home: value.navigation?.home ?? DEFAULT_CONTENT.navigation.home,
      projects: migratedText(value.navigation?.projects, ["PROJECTS", "工作介绍", "精选项目", "工作目录"], DEFAULT_CONTENT.navigation.projects),
      blog: migratedText(value.navigation?.blog, ["BLOG", "工作内容"], DEFAULT_CONTENT.navigation.blog),
      resume: migratedText(value.navigation?.resume, ["RESUME", "其他"], DEFAULT_CONTENT.navigation.resume),
      about: migratedText(value.navigation?.about, ["ABOUT", "个人资料"], DEFAULT_CONTENT.navigation.about),
      career: value.navigation?.career ?? DEFAULT_CONTENT.navigation.career,
    },
    sectionSizes: {
      ...DEFAULT_CONTENT.sectionSizes,
      ...(value.sectionSizes || {}),
      projects:
        incomingProjectsSize === 230
          ? DEFAULT_CONTENT.sectionSizes.projects
          : Math.min(180, Math.max(85, incomingProjectsSize || DEFAULT_CONTENT.sectionSizes.projects)),
      about:
        [80, 120].includes(incomingAboutSize)
          ? DEFAULT_CONTENT.sectionSizes.about
          : Math.min(80, Math.max(50, incomingAboutSize || DEFAULT_CONTENT.sectionSizes.about)),
      career: Math.min(190, Math.max(115, incomingCareerSize || DEFAULT_CONTENT.sectionSizes.career)),
    },
    layoutOffsets: value.layoutOffsets && typeof value.layoutOffsets === "object" ? value.layoutOffsets : {},
    styleOverrides: value.styleOverrides && typeof value.styleOverrides === "object" ? value.styleOverrides : {},
    textOverrides: value.textOverrides && typeof value.textOverrides === "object" ? value.textOverrides : {},
    customFonts: Array.isArray(value.customFonts) ? value.customFonts : [],
    career: {
      ...DEFAULT_CONTENT.career,
      ...(value.career || {}),
      items: DEFAULT_CONTENT.career.items.map((item, index) => ({
        ...item,
        ...(Array.isArray(value.career?.items) ? value.career.items[index] : {}),
      })),
    },
    projects: {
      ...DEFAULT_CONTENT.projects,
      ...(value.projects || {}),
      eyebrow: migratedText(value.projects?.eyebrow, ["Project-Based Learning", "工作介绍", "Selected Work / 01-03", "Work Index / 01-06"], DEFAULT_CONTENT.projects.eyebrow),
      title: migratedText(
        value.projects?.title,
        ["Build work that proves what you can do.", "Selected projects built for real brands.", "Selected work for brands in motion.", "Selected brand work.", "Selected work directory."],
        DEFAULT_CONTENT.projects.title,
      ),
      description: migratedText(
        value.projects?.description,
        [
          "Move from guided fundamentals to portfolio-ready products. Each project mirrors the decisions, constraints, and feedback loops of a real engineering team.",
          "从品牌升级、全渠道视觉规范到电商内容落地，每个项目都围绕真实业务目标建立视觉系统。点击项目可进入完整案例。",
          "以竖版目录快速浏览品牌升级、电商视觉、全渠道系统、AI 创意与 IP 角色作品。点击任意卡片可进入完整案例与图片轮播。",
        ],
        DEFAULT_CONTENT.projects.description,
      ),
      catalogItems,
      latestItems: mergeIndependentSectionItems(defaultLatestItems(), value.projects?.latestItems),
      visualItems: mergeIndependentSectionItems(defaultVisualItems(), value.projects?.visualItems),
      contactItems: mergeIndependentSectionItems(defaultContactItems(), value.projects?.contactItems),
      mosaicItems: DEFAULT_CONTENT.projects.mosaicItems.map((item, index) => ({
        ...item,
        ...(Array.isArray(value.projects?.mosaicItems) ? value.projects.mosaicItems[index] : {}),
      })),
      items: mergeItems(DEFAULT_CONTENT.projects.items, value.projects?.items, LEGACY_PROJECT_TITLES),
    },
    blog: {
      ...DEFAULT_CONTENT.blog,
      ...(value.blog || {}),
      eyebrow: migratedText(value.blog?.eyebrow, ["Field Notes"], DEFAULT_CONTENT.blog.eyebrow),
      title: migratedText(
        value.blog?.title,
        ["Clear thinking for the work between lessons.", "Design is a business tool, not a surface treatment.", "Strategy, systems and AI in one design practice."],
        DEFAULT_CONTENT.blog.title,
      ),
      description: migratedText(
        value.blog?.description,
        ["Short, practical notes on building, debugging, collaborating, and becoming easier to hire."],
        DEFAULT_CONTENT.blog.description,
      ),
      items: mergeItems(DEFAULT_CONTENT.blog.items, value.blog?.items, LEGACY_BLOG_TITLES),
    },
    resume: {
      ...DEFAULT_CONTENT.resume,
      ...(value.resume || {}),
      eyebrow: migratedText(value.resume?.eyebrow, ["The Learning Path"], DEFAULT_CONTENT.resume.eyebrow),
      title: migratedText(
        value.resume?.title,
        ["A curriculum that moves from understanding to ownership.", "A hybrid design practice across brand, commerce and AI.", "Brand thinking meets commercial execution."],
        DEFAULT_CONTENT.resume.title,
      ),
      description: migratedText(
        value.resume?.description,
        ["Each stage reduces support and increases responsibility, so confidence grows from evidence rather than motivation alone."],
        DEFAULT_CONTENT.resume.description,
      ),
      items: mergeItems(DEFAULT_CONTENT.resume.items, value.resume?.items, LEGACY_RESUME_TITLES),
    },
    about: {
      ...DEFAULT_CONTENT.about,
      ...(value.about || {}),
      eyebrow: migratedText(value.about?.eyebrow, ["Personal Introduction"], DEFAULT_CONTENT.about.eyebrow),
      title: migratedText(
        value.about?.title,
        ["Design is not only aesthetics, but a visual carrier to convey brand core values and personality."],
        DEFAULT_CONTENT.about.title,
      ),
      role: migratedText(
        value.about?.role,
        ["Founder / Lead Instructor", "Every Detail Builds Personality"],
        DEFAULT_CONTENT.about.role,
      ),
      bio: migratedText(
        value.about?.bio,
        ["CodeNest was built around a simple belief: people learn faster when the work feels real, the feedback is specific, and the path is calm enough to follow. Replace this text with your own background, teaching philosophy, experience, and the kind of students or clients you want to work with."],
        DEFAULT_CONTENT.about.bio,
      ),
      stats: DEFAULT_CONTENT.about.stats.map((stat, index) => ({
        ...stat,
        ...(Array.isArray(value.about?.stats) ? value.about.stats[index] : {}),
      })),
      email: migratedText(value.about?.email, ["hello@codenest.dev"], DEFAULT_CONTENT.about.email),
      wechat: value.about?.wechat ?? DEFAULT_CONTENT.about.wechat,
      location: migratedText(value.about?.location, ["Remote / Worldwide"], DEFAULT_CONTENT.about.location),
      image:
        value.about?.image === "https://cnlfvmxwohyvksbbtplw.supabase.co/storage/v1/object/public/portfolio-assets/about/1784108950962-f6f94c8f-1b9f-4307-af1b-ee934d7f89a0.webp"
          ? DEFAULT_CONTENT.about.image
          : value.about?.image || DEFAULT_CONTENT.about.image,
      gallery:
        Array.isArray(value.about?.gallery) && value.about.gallery.length && !value.about.gallery.every(isLegacyAsset)
          ? value.about.gallery
          : DEFAULT_CONTENT.about.gallery,
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

function VideoBackground({ source, poster, reducedMotion }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion || !source) return undefined;
    let hls;
    let cancelled = false;

    if (source.includes(".m3u8")) {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: false, lowLatencyMode: false });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => undefined));
        } else {
          video.src = source;
          video.play().catch(() => undefined);
        }
      });
    } else {
      video.src = source;
      video.play().catch(() => undefined);
    }

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [reducedMotion, source]);

  if (reducedMotion) {
    return <img className="absolute inset-0 h-full w-full object-cover" src={poster} alt="" aria-hidden="true" />;
  }

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      aria-hidden="true"
    />
  );
}

function BackgroundMedia({ content }) {
  const reducedMotion = useReducedMotion();

  if (content.mediaMode === "video" && content.videoUrl) {
    return <VideoBackground source={content.videoUrl} poster={content.backgroundImage || DEFAULT_CONTENT.backgroundImage} reducedMotion={reducedMotion} />;
  }

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

function HeroSceneBackground({ content, activeScene }) {
  const reducedMotion = useReducedMotion();
  const videoRefs = useRef([]);
  const pauseTimerRef = useRef(null);
  const [displayedScene, setDisplayedScene] = useState(activeScene);
  const hasSceneMode = content.mediaMode === "video" && !content.videoUrl?.includes(".m3u8");
  const firstSource = content.videoUrl && content.videoUrl !== LEGACY_HERO_VIDEO_URL
    ? content.videoUrl
    : HERO_SCENES[0].source;
  const scenes = HERO_SCENES.map((scene, index) => (index === 0 ? { ...scene, source: firstSource } : scene));

  useEffect(() => {
    if (!hasSceneMode || reducedMotion) return undefined;
    let cancelled = false;
    const targetVideo = videoRefs.current[activeScene];
    if (!targetVideo) return undefined;

    targetVideo.preload = "auto";
    if (targetVideo.networkState === HTMLMediaElement.NETWORK_EMPTY) targetVideo.load();

    const revealWhenPlaying = async () => {
      try {
        await targetVideo.play();
        if (cancelled) return;
        setDisplayedScene(activeScene);
        window.clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = window.setTimeout(() => {
          videoRefs.current.forEach((video, index) => {
            if (video && index !== activeScene) video.pause();
          });
        }, 1100);
      } catch {
        // Keep the current scene visible if the next file cannot start yet.
      }
    };

    revealWhenPlaying();
    return () => {
      cancelled = true;
    };
  }, [activeScene, hasSceneMode, reducedMotion]);

  useEffect(() => {
    if (!hasSceneMode || reducedMotion) return undefined;
    const nextIndex = (displayedScene + 1) % scenes.length;
    const nextVideo = videoRefs.current[nextIndex];
    if (!nextVideo) return undefined;
    nextVideo.preload = "auto";
    if (nextVideo.networkState === HTMLMediaElement.NETWORK_EMPTY) nextVideo.load();
    return undefined;
  }, [displayedScene, hasSceneMode, reducedMotion, scenes.length]);

  useEffect(() => () => window.clearTimeout(pauseTimerRef.current), []);

  if (!hasSceneMode) {
    return (
      <div data-hero-media className="absolute inset-0 opacity-60">
        <BackgroundMedia content={content} />
      </div>
    );
  }

  if (reducedMotion) {
    return (
      <div data-hero-media className="absolute inset-0">
        <img className="h-full w-full object-cover opacity-75" src={content.backgroundImage || DEFAULT_CONTENT.backgroundImage} alt="" aria-hidden="true" />
        <img className="hero-scene-overlay absolute inset-0 h-full w-full object-cover" src="./portfolio/hero-scene-overlay.png" alt="" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div data-hero-media className="hero-scene-media absolute inset-0">
      {scenes.map((scene, index) => (
        <video
          key={scene.source}
          ref={(node) => { videoRefs.current[index] = node; }}
          className={`hero-scene-video absolute inset-0 h-full w-full object-cover ${displayedScene === index ? "is-active" : ""}`}
          src={scene.source}
          poster={content.backgroundImage || DEFAULT_CONTENT.backgroundImage}
          preload={index === displayedScene || index === (displayedScene + 1) % scenes.length ? "auto" : "metadata"}
          autoPlay={index === 0}
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ))}
      <img
        className="hero-scene-overlay absolute inset-0 h-full w-full object-cover"
        src="./portfolio/hero-scene-overlay.png"
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}

function Logo({ brand, logoImage }) {
  return (
    <a className="cursor-target group flex min-w-0 items-center gap-3 text-[#f1efe4]" href="#top" aria-label={`${brand} home`}>
      <span
        className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[4px] border border-white/20 bg-white/8 font-mono text-[10px] font-black text-white backdrop-blur-md"
        data-edit-path="logoImage"
        data-edit-kind="image"
        data-edit-label="Logo"
        data-edit-section="首页"
      >
        {logoImage ? <img className="h-full w-full object-cover" src={logoImage} alt="" /> : "A/P"}
        {!logoImage && <span className="absolute right-1 top-1 size-2 bg-[#e5ff48] transition-transform duration-300 group-hover:scale-125" />}
      </span>
      <span className="max-w-56 truncate text-[14px] font-bold tracking-[0]" data-edit-path="brand" data-edit-kind="text" data-edit-label="品牌名称" data-edit-section="首页">{brand}</span>
    </a>
  );
}

const sidebarTargets = [
  { id: "top", label: "首页" },
  { id: "about", key: "about" },
  { id: "experience", key: "career" },
  { id: "projects", key: "projects" },
  { id: "strengths", key: "resume" },
  { id: "contact", key: "blog" },
];

function PortfolioSidebar({ navigation }) {
  const sidebarRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const labels = sidebarTargets.map((target) =>
    target.label ?? navigation?.[target.key] ?? DEFAULT_CONTENT.navigation[target.key],
  );

  useEffect(() => {
    const sections = sidebarTargets.map((target) => document.getElementById(target.id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const nextIndex = sections.indexOf(entry.target);
          if (nextIndex >= 0) setActiveIndex(nextIndex);
        });
      },
      { rootMargin: "-40% 0px -58% 0px", threshold: 0 },
    );

    sections.forEach((section) => section && observer.observe(section));
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const handleWindowPointerMove = (event) => {
      const rect = sidebarRef.current?.getBoundingClientRect();
      if (!rect) return;
      const isInside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!isInside) setIsSidebarOpen(false);
    };
    window.addEventListener("pointermove", handleWindowPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleWindowPointerMove);
  }, [isSidebarOpen]);

  const handleItemClick = useCallback((index) => {
    const target = document.getElementById(sidebarTargets[index].id);
    if (!target) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    const hash = sidebarTargets[index].id === "top" ? "" : `#${sidebarTargets[index].id}`;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    setActiveIndex(index);
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className={`portfolio-sidebar-shell${isSidebarOpen ? " is-open" : ""}`}
      tabIndex={0}
      aria-label="Portfolio sections"
      title="展开侧边导航"
      onPointerEnter={() => setIsSidebarOpen(true)}
      onPointerMove={() => setIsSidebarOpen(true)}
      onPointerLeave={() => setIsSidebarOpen(false)}
    >
      <span className="portfolio-sidebar-hint" aria-hidden="true">
        <Menu size={14} />
      </span>
      <LineSidebar items={labels} activeIndex={activeIndex} onItemClick={handleItemClick} />
    </aside>
  );
}

function Navigation({ brand, logoImage, navigation, isOpen, onToggle, onClose, onEdit }) {
  const items = navTargets.map((item) => ({
    ...item,
    label: navigation?.[item.key] ?? DEFAULT_CONTENT.navigation[item.key],
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
      <header data-hero-nav className="fixed inset-x-0 top-0 z-50 border-b border-white/12 bg-[#07080a]/56 text-[#f1efe4] backdrop-blur-xl">
        <div className="portfolio-layout mx-auto flex h-[84px] max-w-[1700px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Logo brand={brand} logoImage={logoImage} />
          <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Primary navigation">
            {items.map((item) => (
              <a
                key={item.key}
                className="cursor-target max-w-36 truncate py-2 text-[11px] font-bold uppercase text-white/58 transition-colors duration-200 hover:text-[#e5ff48] focus-visible:text-[#e5ff48]"
                href={item.href}
                title={item.label}
                data-edit-path={`navigation.${item.key}`}
                data-edit-kind="text"
                data-edit-label={`${item.label}菜单文字`}
                data-edit-section="导航"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <MusicPlayer />
            <a className="cursor-target hidden min-h-11 items-center gap-3 rounded-full bg-[#e5ff48] px-5 text-[10px] font-bold uppercase text-[#090a0c] transition-transform hover:-translate-y-0.5 sm:inline-flex" href="#contact">
              Contact <ArrowRight size={15} />
            </a>
            <button
              className="grid size-11 place-items-center rounded-full border border-white/20 bg-black/20 text-white lg:hidden"
              type="button"
              aria-label={isOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              onClick={onToggle}
            >
              {isOpen ? <X size={22} strokeWidth={1.7} /> : <Menu size={22} strokeWidth={1.7} />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 flex bg-[#08090b] px-5 pb-8 pt-28 text-white transition-[opacity,visibility] duration-300 lg:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <nav className="flex w-full flex-col justify-between" aria-label="Mobile navigation">
          <div className="flex flex-col">
            {items.map((item, index) => (
              <a
                key={item.key}
                className="mb-1 flex items-center justify-between border-b border-white/14 px-1 py-6 text-3xl font-semibold text-[#f1efe4] transition-colors hover:text-[#e5ff48]"
                href={item.href}
                onClick={onClose}
                data-edit-path={`navigation.${item.key}`}
                data-edit-kind="text"
                data-edit-label={`${item.label}菜单文字`}
                data-edit-section="导航"
              >
                <span className="min-w-0 break-words pr-4">{item.label}</span>
                <span className="font-mono text-[10px] text-white/36">0{index + 1}</span>
              </a>
            ))}
            <button
              className="mt-8 flex items-center justify-between rounded-[4px] border border-white/14 bg-white/5 px-5 py-5 text-left text-base font-semibold text-white transition-colors hover:border-[#e5ff48] hover:text-[#e5ff48]"
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
            >
              <span className="flex items-center gap-3">
                <Settings size={20} />
                编辑内容
              </span>
              <span className="font-jakarta text-[10px]">管理</span>
            </button>
          </div>
          <p className="max-w-72 text-xs font-medium leading-6 text-white/38">
            Visual Designer / AI Designer / Brand Designer
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

function UploadButton({ label = "上传图片", onChange, disabled = false }) {
  return (
    <label
      className={`flex min-h-10 items-center justify-center gap-2 border border-dashed border-white/20 text-[10px] font-bold uppercase text-white/55 transition-colors ${
        disabled ? "cursor-wait opacity-45" : "cursor-pointer hover:border-[#f5ea28] hover:text-[#f5ea28]"
      }`}
    >
      <Upload size={14} /> {disabled ? "上传中..." : label}
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
      setError("登录失败，请检查邮箱和密码后重试。");
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
  const updateCatalogItem = (index, key, value) =>
    setDraft((current) => ({
      ...current,
      projects: {
        ...current.projects,
        catalogItems: current.projects.catalogItems.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item,
        ),
      },
    }));
  const updateCatalogGalleryImage = (itemIndex, imageIndex, value) =>
    setDraft((current) => ({
      ...current,
      projects: {
        ...current.projects,
        catalogItems: current.projects.catalogItems.map((item, index) =>
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
  const addCatalogGalleryImage = (itemIndex) =>
    setDraft((current) => ({
      ...current,
      projects: {
        ...current.projects,
        catalogItems: current.projects.catalogItems.map((item, index) =>
          index === itemIndex ? { ...item, gallery: [...item.gallery, item.image] } : item,
        ),
      },
    }));
  const removeCatalogGalleryImage = (itemIndex, imageIndex) =>
    setDraft((current) => ({
      ...current,
      projects: {
        ...current.projects,
        catalogItems: current.projects.catalogItems.map((item, index) =>
          index === itemIndex && item.gallery.length > 1
            ? { ...item, gallery: item.gallery.filter((_, galleryIndex) => galleryIndex !== imageIndex) }
            : item,
        ),
      },
    }));
  const updateAboutStat = (index, key, value) =>
    setDraft((current) => ({
      ...current,
      about: {
        ...current.about,
        stats: current.about.stats.map((stat, statIndex) =>
          statIndex === index ? { ...stat, [key]: value } : stat,
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
      setNotice("请选择小于 12MB 的图片。");
      return;
    }
    setIsUploading(true);
    try {
      const publicUrl = await onUpload(file, area);
      applyValue(publicUrl);
      setNotice("原图已上传，未进行二次压缩。点击“保存修改”后发布。");
    } catch (imageError) {
      setNotice("图片上传失败，请稍后重试。");
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
          ? "分享链接已复制。本地图片不会包含在链接中，请先上传为公开图片。"
          : "分享链接已复制，包含当前文字和图片链接。",
      );
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("无法复制分享链接，请允许剪贴板权限后重试。");
    }
  };

  return (
    <>
      <button
        className="cursor-target fixed bottom-5 right-5 z-30 hidden size-12 place-items-center rounded-full border border-white/20 bg-black/52 text-white shadow-2xl backdrop-blur-md transition-colors hover:border-[#e5ff48] hover:text-[#e5ff48] md:grid"
        type="button"
        title="编辑内容"
        aria-label="编辑页面内容"
        onClick={() => setIsOpen(true)}
      >
        <Settings size={19} />
      </button>

      {isOpen && (
        <div className="editor-surface fixed inset-0 z-[70] bg-black/75 p-3 backdrop-blur-sm sm:p-5">
          <section className="ml-auto flex h-full w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] border-[6px] border-[#d6d8d2] bg-[#0a0f0d] text-white shadow-2xl">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
              <div className="flex items-center gap-3">
                <Settings size={17} className="text-[#f5ea28]" />
                <div>
                  <p className="text-sm font-bold">内容编辑器</p>
                  <p className={`text-[10px] ${cloudStatus === "online" ? "text-[#f5ea28]" : "text-white/45"}`}>
                    {cloudStatus === "online" ? "Supabase 已连接" : cloudStatus === "connecting" ? "正在连接..." : "本地预览模式"}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {isUnlocked && (
                  <button
                    className="grid size-10 place-items-center text-white/55 hover:text-[#f5ea28]"
                    type="button"
                    title="退出登录"
                    aria-label="退出编辑器登录"
                    onClick={onSignOut}
                  >
                    <LogOut size={17} />
                  </button>
                )}
                <button className="grid size-10 place-items-center" type="button" aria-label="关闭编辑器" onClick={closeEditor}>
                  <X size={20} />
                </button>
              </div>
            </header>

            {!isUnlocked ? (
              <form className="flex flex-1 flex-col justify-center p-6" onSubmit={unlock}>
                <LockKeyhole size={28} className="text-[#f5ea28]" />
                <h2 className="mt-5 text-2xl font-extrabold">管理员登录</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/55">使用在 Supabase Auth 中创建的作品集管理员账号登录。</p>
                <label className="mt-7 text-[11px] font-bold uppercase text-white/55">
                  邮箱
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
                  密码
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
                  {isAuthenticating ? "登录中..." : "登录"}
                </button>
              </form>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  <EditorGroup title="网站与导航" open>
                    <Field label="品牌名称" value={draft.brand} onChange={(event) => update("brand", event.target.value)} />
                    <Field
                      label="Logo 图片链接"
                      value={draft.logoImage?.startsWith("data:") ? "" : draft.logoImage}
                      onChange={(event) => update("logoImage", event.target.value)}
                    />
                    <UploadButton label="上传 Logo" disabled={isUploading} onChange={handleLogoImage} />
                    <div className="h-px bg-white/10" />
                    <p className="text-[10px] font-bold uppercase text-white/35">菜单文字</p>
                    <Field
                      label="首页菜单文字"
                      value={draft.navigation.home}
                      onChange={(event) => updateSection("navigation", "home", event.target.value)}
                    />
                    <Field
                      label="关于我菜单文字"
                      value={draft.navigation.about}
                      onChange={(event) => updateSection("navigation", "about", event.target.value)}
                    />
                    <Field
                      label="工作履历菜单文字"
                      value={draft.navigation.career}
                      onChange={(event) => updateSection("navigation", "career", event.target.value)}
                    />
                    <Field
                      label="精选项目菜单文字"
                      value={draft.navigation.projects}
                      onChange={(event) => updateSection("navigation", "projects", event.target.value)}
                    />
                    <Field
                      label="联系菜单文字"
                      value={draft.navigation.blog}
                      onChange={(event) => updateSection("navigation", "blog", event.target.value)}
                    />
                    <Field
                      label="个人优势菜单文字"
                      value={draft.navigation.resume}
                      onChange={(event) => updateSection("navigation", "resume", event.target.value)}
                    />
                  </EditorGroup>

                  <EditorGroup title="首屏设置">
                    <div className="grid grid-cols-3 gap-2" aria-label="背景类型">
                      <button
                        className={`flex min-h-11 items-center justify-center gap-2 border text-xs font-bold ${
                          draft.mediaMode === "video"
                            ? "border-[#e5ff48] bg-[#e5ff48] text-[#090909]"
                            : "border-white/15 text-white/65"
                        }`}
                        type="button"
                        onClick={() => update("mediaMode", "video")}
                      >
                        <Clapperboard size={15} /> 视频
                      </button>
                      <button
                        className={`flex min-h-11 items-center justify-center gap-2 border text-xs font-bold ${
                          draft.mediaMode === "galaxy"
                            ? "border-[#e5ff48] bg-[#e5ff48] text-[#090909]"
                            : "border-white/15 text-white/65"
                        }`}
                        type="button"
                        onClick={() => update("mediaMode", "galaxy")}
                      >
                        <Sparkles size={15} /> 星空
                      </button>
                      <button
                        className={`flex min-h-11 items-center justify-center gap-2 border text-xs font-bold ${
                          draft.mediaMode === "image"
                            ? "border-[#e5ff48] bg-[#e5ff48] text-[#090909]"
                            : "border-white/15 text-white/65"
                        }`}
                        type="button"
                        onClick={() => update("mediaMode", "image")}
                      >
                        <ImageIcon size={15} /> 图片
                      </button>
                    </div>

                    {draft.mediaMode === "video" && (
                      <Field
                        label="背景视频链接（MP4 或 HLS）"
                        value={draft.videoUrl || ""}
                        onChange={(event) => update("videoUrl", event.target.value)}
                      />
                    )}

                    {draft.mediaMode === "image" && (
                      <>
                        <Field
                          label="背景图片链接"
                          value={draft.backgroundImage?.startsWith("data:") ? "" : draft.backgroundImage}
                          onChange={(event) => update("backgroundImage", event.target.value)}
                        />
                        <UploadButton label="上传背景图片" disabled={isUploading} onChange={handleImage} />
                      </>
                    )}

                    <Field label="小标题" value={draft.eyebrow} onChange={(event) => update("eyebrow", event.target.value)} />
                    <Field label="主标题" value={draft.headline} onChange={(event) => update("headline", event.target.value)} />
                    <Field label="描述文字" value={draft.description} multiline onChange={(event) => update("description", event.target.value)} />
                    <Field label="主按钮文字" value={draft.ctaLabel} onChange={(event) => update("ctaLabel", event.target.value)} />
                    <div className="h-px bg-white/10" />
                    <p className="text-[10px] font-bold uppercase text-white/35">首屏信息卡</p>
                    <Field label="年份标签" value={draft.card.year} onChange={(event) => updateCard("year", event.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="前段文字" value={draft.card.lead} onChange={(event) => updateCard("lead", event.target.value)} />
                      <Field label="强调词" value={draft.card.accent} onChange={(event) => updateCard("accent", event.target.value)} />
                    </div>
                    <Field label="后段文字" value={draft.card.tail} onChange={(event) => updateCard("tail", event.target.value)} />
                    <Field label="信息卡说明" value={draft.card.description} multiline onChange={(event) => updateCard("description", event.target.value)} />
                  </EditorGroup>

                  <EditorGroup title="板块高度">
                    <RangeField label="优秀作品" value={draft.sectionSizes.projects} min={85} max={180} onChange={(event) => updateSize("projects", event.target.value)} />
                    <RangeField label="个人优势展示" value={draft.sectionSizes.blog} onChange={(event) => updateSize("blog", event.target.value)} />
                    <RangeField label="能力列表" value={draft.sectionSizes.resume} onChange={(event) => updateSize("resume", event.target.value)} />
                    <RangeField label="个人介绍" value={draft.sectionSizes.about} min={50} max={80} onChange={(event) => updateSize("about", event.target.value)} />
                    <RangeField label="工作履历" value={draft.sectionSizes.career} min={115} max={190} onChange={(event) => updateSize("career", event.target.value)} />
                  </EditorGroup>

                  <EditorGroup title="工作履历">
                    <Field label="小标题" value={draft.career.eyebrow} onChange={(event) => updateSection("career", "eyebrow", event.target.value)} />
                    <Field label="标题" value={draft.career.title} multiline onChange={(event) => updateSection("career", "title", event.target.value)} />
                    <Field label="描述文字" value={draft.career.description} multiline onChange={(event) => updateSection("career", "description", event.target.value)} />
                    {draft.career.items.map((item, index) => (
                      <div key={`${item.index}-${index}`} className="space-y-4 border-t border-white/10 pt-4">
                        <p className="text-[10px] font-bold uppercase text-white/35">工作履历 {index + 1}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="序号" value={item.index} onChange={(event) => updateSectionItem("career", index, "index", event.target.value)} />
                          <Field label="工作时间" value={item.period} onChange={(event) => updateSectionItem("career", index, "period", event.target.value)} />
                        </div>
                        <Field label="公司名称" value={item.company} onChange={(event) => updateSectionItem("career", index, "company", event.target.value)} />
                        <Field label="公司性质 / 职位" value={item.meta} onChange={(event) => updateSectionItem("career", index, "meta", event.target.value)} />
                        <Field label="公司 Logo 图片链接" value={item.logo || ""} onChange={(event) => updateSectionItem("career", index, "logo", event.target.value)} />
                        <UploadButton
                          label="上传公司 Logo"
                          disabled={isUploading}
                          onChange={(event) => uploadImage(event, `career/${index}/logo`, (publicUrl) => updateSectionItem("career", index, "logo", publicUrl))}
                        />
                        <Field label="工作内容" value={item.responsibilities} multiline onChange={(event) => updateSectionItem("career", index, "responsibilities", event.target.value)} />
                        <Field label="重点项目名称" value={item.projectTitle} onChange={(event) => updateSectionItem("career", index, "projectTitle", event.target.value)} />
                        <Field label="重点项目介绍" value={item.projectDescription} multiline onChange={(event) => updateSectionItem("career", index, "projectDescription", event.target.value)} />
                        <Field label="悬停展开的更多信息" value={item.moreDetails || ""} multiline onChange={(event) => updateSectionItem("career", index, "moreDetails", event.target.value)} />
                      </div>
                    ))}
                  </EditorGroup>

                  <EditorGroup title="优秀作品">
                    <Field label="小标题" value={draft.projects.eyebrow} onChange={(event) => updateSection("projects", "eyebrow", event.target.value)} />
                    <Field label="标题" value={draft.projects.title} multiline onChange={(event) => updateSection("projects", "title", event.target.value)} />
                    <Field label="中文翻译" value={draft.projects.subtitle || ""} onChange={(event) => updateSection("projects", "subtitle", event.target.value)} />
                    <Field label="描述文字" value={draft.projects.description} multiline onChange={(event) => updateSection("projects", "description", event.target.value)} />
                    {draft.projects.catalogItems.map((item, index) => (
                      <div key={`${item.index}-${index}`} className="space-y-4 border-t border-white/10 pt-4">
                        <p className="text-[10px] font-bold uppercase text-white/35">目录卡片 {index + 1}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="序号" value={item.index} onChange={(event) => updateCatalogItem(index, "index", event.target.value)} />
                          <Field label="分类标签" value={item.category} onChange={(event) => updateCatalogItem(index, "category", event.target.value)} />
                        </div>
                        <Field label="作品标题" value={item.title} onChange={(event) => updateCatalogItem(index, "title", event.target.value)} />
                        <Field label="作品简介" value={item.description} multiline onChange={(event) => updateCatalogItem(index, "description", event.target.value)} />
                        <Field label="竖版封面图片链接" value={item.image} onChange={(event) => updateCatalogItem(index, "image", event.target.value)} />
                        <UploadButton
                          label="上传竖版封面"
                          disabled={isUploading}
                          onChange={(event) => uploadImage(event, `catalog/${index}/cover`, (publicUrl) => updateCatalogItem(index, "image", publicUrl))}
                        />
                        <p className="text-[10px] font-bold uppercase text-white/35">二级页作品图片</p>
                        {item.gallery.map((image, imageIndex) => (
                          <div key={`${index}-${imageIndex}`} className="space-y-2">
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                              <Field
                                label={`第 ${imageIndex + 1} 张图片链接`}
                                value={image}
                                onChange={(event) => updateCatalogGalleryImage(index, imageIndex, event.target.value)}
                              />
                              <button
                                className="mt-5 grid size-10 place-items-center border border-white/15 text-white/45 hover:border-red-300 hover:text-red-300"
                                type="button"
                                title="删除图片"
                                onClick={() => removeCatalogGalleryImage(index, imageIndex)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <UploadButton
                              label={`上传第 ${imageIndex + 1} 张图片`}
                              disabled={isUploading}
                              onChange={(event) => uploadImage(event, `catalog/${index}/gallery`, (publicUrl) => updateCatalogGalleryImage(index, imageIndex, publicUrl))}
                            />
                          </div>
                        ))}
                        <button
                          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-[10px] font-bold uppercase text-white/60 hover:border-[#f5ea28] hover:text-[#f5ea28]"
                          type="button"
                          onClick={() => addCatalogGalleryImage(index)}
                        >
                          <Plus size={14} /> 添加图片
                        </button>
                      </div>
                    ))}
                  </EditorGroup>

                  <EditorGroup title="个人优势展示">
                    <Field label="小标题" value={draft.blog.eyebrow} onChange={(event) => updateSection("blog", "eyebrow", event.target.value)} />
                    <Field label="标题" value={draft.blog.title} multiline onChange={(event) => updateSection("blog", "title", event.target.value)} />
                    <Field label="描述文字" value={draft.blog.description} multiline onChange={(event) => updateSection("blog", "description", event.target.value)} />
                    {draft.blog.items.map((item, index) => (
                      <div key={`${item.category}-${index}`} className="space-y-4 border-t border-white/10 pt-4">
                        <p className="text-[10px] font-bold uppercase text-white/35">优势卡片 {index + 1}</p>
                        <Field label="分类" value={item.category} onChange={(event) => updateSectionItem("blog", index, "category", event.target.value)} />
                        <Field label="标题" value={item.title} multiline onChange={(event) => updateSectionItem("blog", index, "title", event.target.value)} />
                        <Field label="副标签" value={item.meta} onChange={(event) => updateSectionItem("blog", index, "meta", event.target.value)} />
                        <Field label="封面图片链接" value={item.asset} onChange={(event) => updateSectionItem("blog", index, "asset", event.target.value)} />
                        <UploadButton
                          label="上传卡片封面"
                          disabled={isUploading}
                          onChange={(event) => uploadImage(event, `blog/${index}`, (publicUrl) => updateSectionItem("blog", index, "asset", publicUrl))}
                        />
                        <p className="text-[10px] font-bold uppercase text-white/35">二级页轮播图片</p>
                        {item.gallery.map((image, imageIndex) => (
                          <div key={`${index}-${imageIndex}`} className="space-y-2">
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                              <Field
                                label={`第 ${imageIndex + 1} 张图片链接`}
                                value={image}
                                onChange={(event) => updateGalleryImage("blog", index, imageIndex, event.target.value)}
                              />
                              <button
                                className="mt-5 grid size-10 place-items-center border border-white/15 text-white/45 hover:border-red-300 hover:text-red-300"
                                type="button"
                                title="删除图片"
                                onClick={() => removeGalleryImage("blog", index, imageIndex)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <UploadButton
                              label={`上传第 ${imageIndex + 1} 张图片`}
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
                          <Plus size={14} /> 添加图片
                        </button>
                      </div>
                    ))}
                  </EditorGroup>

                  <EditorGroup title="能力列表">
                    <Field label="小标题" value={draft.resume.eyebrow} onChange={(event) => updateSection("resume", "eyebrow", event.target.value)} />
                    <Field label="标题" value={draft.resume.title} multiline onChange={(event) => updateSection("resume", "title", event.target.value)} />
                    <Field label="描述文字" value={draft.resume.description} multiline onChange={(event) => updateSection("resume", "description", event.target.value)} />
                    {draft.resume.items.map((item, index) => (
                      <div key={item.step} className="space-y-4 border-t border-white/10 pt-4">
                        <p className="text-[10px] font-bold uppercase text-white/35">能力项 {index + 1}</p>
                        <Field label="标题" value={item.title} onChange={(event) => updateSectionItem("resume", index, "title", event.target.value)} />
                        <Field label="描述文字" value={item.description} multiline onChange={(event) => updateSectionItem("resume", index, "description", event.target.value)} />
                        <Field label="封面图片链接" value={item.asset} onChange={(event) => updateSectionItem("resume", index, "asset", event.target.value)} />
                        <UploadButton
                          label="上传能力封面"
                          disabled={isUploading}
                          onChange={(event) => uploadImage(event, `resume/${index}`, (publicUrl) => updateSectionItem("resume", index, "asset", publicUrl))}
                        />
                        <p className="text-[10px] font-bold uppercase text-white/35">二级页轮播图片</p>
                        {item.gallery.map((image, imageIndex) => (
                          <div key={`${index}-${imageIndex}`} className="space-y-2">
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                              <Field
                                label={`第 ${imageIndex + 1} 张图片链接`}
                                value={image}
                                onChange={(event) => updateGalleryImage("resume", index, imageIndex, event.target.value)}
                              />
                              <button
                                className="mt-5 grid size-10 place-items-center border border-white/15 text-white/45 hover:border-red-300 hover:text-red-300"
                                type="button"
                                title="删除图片"
                                onClick={() => removeGalleryImage("resume", index, imageIndex)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <UploadButton
                              label={`上传第 ${imageIndex + 1} 张图片`}
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
                          <Plus size={14} /> 添加图片
                        </button>
                      </div>
                    ))}
                  </EditorGroup>

                  <EditorGroup title="个人介绍">
                    <Field label="小标题" value={draft.about.eyebrow} onChange={(event) => updateSection("about", "eyebrow", event.target.value)} />
                    <Field label="标题" value={draft.about.title} multiline onChange={(event) => updateSection("about", "title", event.target.value)} />
                    <Field label="姓名" value={draft.about.name} onChange={(event) => updateSection("about", "name", event.target.value)} />
                    <Field label="身份 / 职位" value={draft.about.role} onChange={(event) => updateSection("about", "role", event.target.value)} />
                    <Field label="个人简介" value={draft.about.bio} multiline onChange={(event) => updateSection("about", "bio", event.target.value)} />
                    <Field label="邮箱" value={draft.about.email} onChange={(event) => updateSection("about", "email", event.target.value)} />
                    <Field label="微信号" value={draft.about.wechat || ""} onChange={(event) => updateSection("about", "wechat", event.target.value)} />
                    <Field label="地点 / 状态" value={draft.about.location} onChange={(event) => updateSection("about", "location", event.target.value)} />
                    <div className="h-px bg-white/10" />
                    <p className="text-[10px] font-bold uppercase text-white/35">个人数据</p>
                    {draft.about.stats.map((stat, index) => (
                      <div key={index} className="grid grid-cols-[0.7fr_1.3fr] gap-3">
                        <Field label={`数据 ${index + 1} 数值`} value={stat.value} onChange={(event) => updateAboutStat(index, "value", event.target.value)} />
                        <Field label={`数据 ${index + 1} 说明`} value={stat.label} onChange={(event) => updateAboutStat(index, "label", event.target.value)} />
                      </div>
                    ))}
                    <Field label="人物图片链接" value={draft.about.image} onChange={(event) => updateSection("about", "image", event.target.value)} />
                    <UploadButton
                      label="上传人物图片"
                      disabled={isUploading}
                      onChange={(event) => uploadImage(event, "about", (publicUrl) => updateSection("about", "image", publicUrl))}
                    />
                    <p className="text-[10px] font-bold uppercase text-white/35">二级页轮播图片</p>
                    {draft.about.gallery.map((image, imageIndex) => (
                      <div key={imageIndex} className="space-y-2">
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <Field label={`第 ${imageIndex + 1} 张图片链接`} value={image} onChange={(event) => updateAboutGallery(imageIndex, event.target.value)} />
                          <button
                            className="mt-5 grid size-10 place-items-center border border-white/15 text-white/45 hover:border-red-300 hover:text-red-300"
                            type="button"
                            title="删除图片"
                            onClick={() => removeAboutGalleryImage(imageIndex)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <UploadButton
                          label={`上传第 ${imageIndex + 1} 张图片`}
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
                      <Plus size={14} /> 添加图片
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
                    title="恢复默认内容"
                    disabled={isSaving || isUploading}
                    onClick={async () => {
                      const resetValue = await onReset();
                      setDraft(resetValue);
                      setNotice("已恢复默认内容。");
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
                    <Save size={16} /> {isSaving ? "保存中..." : isUploading ? "上传中..." : "保存修改"}
                  </button>
                  <button
                    className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 text-xs font-bold uppercase text-white/70 hover:border-[#f5ea28] hover:text-[#f5ea28]"
                    type="button"
                    onClick={copyLink}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "链接已复制" : "复制内容分享链接"}
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
  const initialSearchParams = new URLSearchParams(window.location.search);
  const [detailId, setDetailId] = useState(() => initialSearchParams.get("detail"));
  const isLightTheme = initialSearchParams.get("theme") !== "dark";
  const isShowcasePreview = initialSearchParams.get("showcase") !== "classic";
  const isStudioPersonaPreview = initialSearchParams.get("persona") !== "original";
  const pageRef = useRef(null);
  const playOpeningRef = useRef(shouldPlayOpening());
  const sceneTransitionTimerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHeroScene, setActiveHeroScene] = useState(0);
  const [isSceneTransitioning, setIsSceneTransitioning] = useState(false);
  const [content, setContent] = useState(readInitialContent);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("edit");
  const [selectedEditTarget, setSelectedEditTarget] = useState(null);
  const [draftHistory, setDraftHistory] = useState({ entries: [], index: -1 });
  const [recoverableDraft, setRecoverableDraft] = useState(readEditorDraft);
  const [draftStatus, setDraftStatus] = useState("idle");
  const [previewOverrides, setPreviewOverrides] = useState({});
  const [uploadStates, setUploadStates] = useState({});
  const [session, setSession] = useState(null);
  const [isEditorUnlocked, setIsEditorUnlocked] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("connecting");
  const [isContentReady, setIsContentReady] = useState(false);
  const hasEditedDraftRef = useRef(false);
  const lastDraftChangeRef = useRef({ key: "", time: 0 });
  const previewObjectUrlsRef = useRef(new Set());
  const dragLayoutRef = useRef(null);
  const openEditor = useCallback(() => {
    setIsEditorOpen(true);
    setEditorMode("edit");
    if (session) setIsEditorUnlocked(true);
  }, [session]);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("portfolio-light-document", isLightTheme);
    return () => document.documentElement.classList.remove("portfolio-light-document");
  }, [isLightTheme]);

  const handleRouteNavigation = useCallback(({ href, historyMode = "push" }) => {
    const destination = new URL(href, window.location.href);
    const nextDetailId = destination.searchParams.get("detail");

    if (historyMode === "push") {
      window.history.pushState(null, "", `${destination.pathname}${destination.search}${destination.hash}`);
    }

    setDetailId(nextDetailId);
    setIsEditorOpen(false);
    setIsEditorUnlocked(false);
    setSelectedEditTarget(null);
    if (nextDetailId) window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const draftContent = draftHistory.index >= 0 ? draftHistory.entries[draftHistory.index] : content;
  const hasDraftChanges = useMemo(
    () => contentSnapshot(draftContent) !== contentSnapshot(content),
    [content, draftContent],
  );
  const renderedContent = useMemo(() => {
    const previewContent = Object.entries(previewOverrides).reduce(
      (current, [path, value]) => setContentValue(current, path, value),
      draftContent,
    );

    if (!isStudioPersonaPreview) return previewContent;

    return {
      ...previewContent,
      about: {
        ...previewContent.about,
        image: "/portfolio/concept/anthony-blue-studio-books.png",
        imageFocus: "50% 28%",
      },
    };
  }, [draftContent, isStudioPersonaPreview, previewOverrides]);
  const canUndoDraft = draftHistory.index > 0;
  const canRedoDraft = draftHistory.index >= 0 && draftHistory.index < draftHistory.entries.length - 1;

  const resetDraftHistory = useCallback((value, edited = false) => {
    setDraftHistory({ entries: [value], index: 0 });
    hasEditedDraftRef.current = edited;
    lastDraftChangeRef.current = { key: "", time: 0 };
  }, []);

  const applyDraftChange = useCallback((path, value, historyKey = path, coalesce = true) => {
    const now = Date.now();
    hasEditedDraftRef.current = true;
    setRecoverableDraft(null);
    setDraftStatus("saving");
    setUploadStates((current) => {
      const matchingKeys = Object.keys(current).filter(
        (key) => key === path || key.startsWith(`${path}.`) || path.startsWith(`${key}.`),
      );
      if (!matchingKeys.length) return current;
      const next = { ...current };
      matchingKeys.forEach((key) => delete next[key]);
      return next;
    });
    setDraftHistory((current) => {
      const base = current.index >= 0 ? current.entries[current.index] : content;
      const next = setContentValue(base, path, value);
      if (contentSnapshot(base) === contentSnapshot(next)) return current;

      const entries = current.entries.length ? current.entries.slice(0, current.index + 1) : [base];
      const shouldCoalesce =
        coalesce &&
        current.index === current.entries.length - 1 &&
        lastDraftChangeRef.current.key === historyKey &&
        now - lastDraftChangeRef.current.time < 700;

      lastDraftChangeRef.current = { key: historyKey, time: now };
      if (shouldCoalesce) {
        entries[entries.length - 1] = next;
        return { entries, index: entries.length - 1 };
      }

      const nextEntries = [...entries, next].slice(-50);
      return { entries: nextEntries, index: nextEntries.length - 1 };
    });
  }, [content]);

  const undoDraft = useCallback(() => {
    setDraftHistory((current) => {
      if (current.index <= 0) return current;
      hasEditedDraftRef.current = true;
      setDraftStatus("saving");
      lastDraftChangeRef.current = { key: "", time: 0 };
      return { ...current, index: current.index - 1 };
    });
  }, []);

  const redoDraft = useCallback(() => {
    setDraftHistory((current) => {
      if (current.index < 0 || current.index >= current.entries.length - 1) return current;
      hasEditedDraftRef.current = true;
      setDraftStatus("saving");
      lastDraftChangeRef.current = { key: "", time: 0 };
      return { ...current, index: current.index + 1 };
    });
  }, []);

  useEffect(() => {
    const handlePopState = () => requestPageTransition(window.location.href, "pop");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!hasEditedDraftRef.current) resetDraftHistory(content);
  }, [content, resetDraftHistory]);

  useEffect(() => {
    if (!isContentReady || !recoverableDraft?.content) return;
    const recovered = mergeContent(recoverableDraft.content);
    if (contentSnapshot(recovered) !== contentSnapshot(content)) return;
    clearEditorDraft();
    setRecoverableDraft(null);
  }, [content, isContentReady, recoverableDraft]);

  useEffect(() => {
    if (!hasEditedDraftRef.current) return undefined;
    if (!hasDraftChanges) {
      clearEditorDraft();
      setDraftStatus("idle");
      return undefined;
    }

    setDraftStatus("saving");
    const timer = window.setTimeout(() => {
      try {
        writeEditorDraft(draftContent);
        setDraftStatus("saved");
      } catch {
        setDraftStatus("error");
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draftContent, hasDraftChanges]);

  useEffect(() => {
    const canEditPage = Boolean(session && isEditorUnlocked && isEditorOpen && editorMode === "edit");
    document.body.classList.toggle("portfolio-editing", canEditPage);
    document.body.classList.toggle("portfolio-editor-preview", Boolean(session && isEditorUnlocked && isEditorOpen && editorMode === "preview"));

    const handleEditableClick = (event) => {
      if (!canEditPage || event.target.closest("[data-editor-panel]")) return;
      const editable = event.target.closest("[data-edit-path]");
      if (!editable) return;
      const selected = targetFromElement(editable);
      event.preventDefault();
      event.stopPropagation();
      setSelectedEditTarget(selected);
    };

    const handleEditableDoubleClick = (event) => {
      if (!canEditPage || event.target.closest("[data-editor-panel]")) return;
      const editable = event.target.closest("[data-edit-path][data-edit-kind='text']");
      if (!editable) return;
      event.preventDefault();
      event.stopPropagation();
      const target = targetFromElement(editable);
      const protectedChildren = target.autoText
        ? [...editable.children].map((child) => ({ child, value: child.getAttribute("contenteditable") }))
        : [];
      protectedChildren.forEach(({ child }) => child.setAttribute("contenteditable", "false"));
      editable.contentEditable = "true";
      editable.spellcheck = false;
      editable.classList.add("is-inline-editing");
      editable.focus({ preventScroll: true });
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editable);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      const finish = () => {
        editable.contentEditable = "false";
        editable.classList.remove("is-inline-editing");
        editable.removeEventListener("blur", finish);
        editable.removeEventListener("keydown", handleInlineKeyDown);
        protectedChildren.forEach(({ child, value }) => {
          if (value === null) child.removeAttribute("contenteditable");
          else child.setAttribute("contenteditable", value);
        });
        const nextValue = target.autoText
          ? [...editable.childNodes]
              .filter((node) => node.nodeType === 3)
              .map((node) => node.nodeValue || "")
              .join(" ")
              .replace(/\s+/g, " ")
              .trim()
          : editable.innerText.trim();
        const storedValue = getContentValue(draftContent, target.path);
        const currentValue = storedValue === undefined && target.autoText ? target.originalValue : storedValue;
        if (nextValue !== String(currentValue ?? "")) {
          applyDraftChange(target.path, nextValue, `inline:${target.path}`, false);
        }
      };
      const handleInlineKeyDown = (keyboardEvent) => {
        if (keyboardEvent.key === "Escape") {
          const storedValue = getContentValue(draftContent, target.path);
          const restoredValue = String(storedValue === undefined && target.autoText ? target.originalValue : storedValue ?? "");
          if (target.autoText) {
            const textNodes = [...editable.childNodes].filter((node) => node.nodeType === 3);
            if (textNodes.length) {
              textNodes[0].nodeValue = restoredValue;
              textNodes.slice(1).forEach((node) => { node.nodeValue = ""; });
            } else {
              editable.insertBefore(document.createTextNode(restoredValue), editable.firstChild);
            }
          } else {
            editable.innerText = restoredValue;
          }
          editable.blur();
        } else if (keyboardEvent.key === "Enter" && !target.multiline && !keyboardEvent.shiftKey) {
          keyboardEvent.preventDefault();
          editable.blur();
        }
      };
      editable.addEventListener("blur", finish);
      editable.addEventListener("keydown", handleInlineKeyDown);
      setSelectedEditTarget(target);
    };

    const handlePointerDown = (event) => {
      if (!canEditPage || event.button !== 0 || event.target.closest("[data-editor-panel]")) return;
      const dragRoot = event.target.closest("[data-edit-drag-root='true']");
      const candidates = document.elementsFromPoint(event.clientX, event.clientY).filter((element) => element.matches?.("[data-edit-path]"));
      const editable = dragRoot || candidates.find((element) => element.dataset.editKind !== "style") || candidates[0];
      if (!editable || editable.isContentEditable) return;
      const target = targetFromElement(editable);
      if (!target?.layoutKey) return;
      event.preventDefault();
      event.stopPropagation();
      const breakpoint = layoutBreakpoint();
      const startOffset = layoutOffset(draftContent, target.layoutKey, breakpoint);
      dragLayoutRef.current = {
        element: editable,
        target,
        breakpoint,
        startX: event.clientX,
        startY: event.clientY,
        originX: startOffset.x,
        originY: startOffset.y,
        x: startOffset.x,
        y: startOffset.y,
        pointerId: event.pointerId,
        moved: false,
      };
      editable.setPointerCapture?.(event.pointerId);
      editable.classList.add("is-editor-dragging");
      setSelectedEditTarget(target);
    };

    const handlePointerMove = (event) => {
      const drag = dragLayoutRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 3) return;
      drag.moved = true;
      const x = Math.round(drag.originX + event.clientX - drag.startX);
      const y = Math.round(drag.originY + event.clientY - drag.startY);
      drag.x = x;
      drag.y = y;
      drag.element.style.setProperty("--layout-offset-x", `${x}px`);
      drag.element.style.setProperty("--layout-offset-y", `${y}px`);
      drag.element.classList.toggle("has-layout-offset", x !== 0 || y !== 0);
    };

    const handlePointerUp = (event) => {
      const drag = dragLayoutRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      drag.element.releasePointerCapture?.(event.pointerId);
      drag.element.classList.remove("is-editor-dragging");
      dragLayoutRef.current = null;
      if (!drag.moved || (drag.x === drag.originX && drag.y === drag.originY)) return;
      applyDraftChange(
        `layoutOffsets.${drag.target.layoutKey}.${drag.breakpoint}`,
        { x: drag.x, y: drag.y },
        `layout:${drag.target.layoutKey}:${drag.breakpoint}`,
        false,
      );
    };

    document.addEventListener("click", handleEditableClick, true);
    document.addEventListener("dblclick", handleEditableDoubleClick, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerup", handlePointerUp, true);
    document.addEventListener("pointercancel", handlePointerUp, true);
    return () => {
      document.body.classList.remove("portfolio-editing", "portfolio-editor-preview");
      document.removeEventListener("click", handleEditableClick, true);
      document.removeEventListener("dblclick", handleEditableDoubleClick, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("pointerup", handlePointerUp, true);
      document.removeEventListener("pointercancel", handlePointerUp, true);
    };
  }, [applyDraftChange, draftContent, editorMode, isEditorOpen, isEditorUnlocked, session]);

  useLayoutEffect(() => {
    applyEditableLayoutOffsets(renderedContent);
  }, [detailId, renderedContent]);

  useEffect(() => {
    const styleId = "portfolio-custom-fonts";
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = (renderedContent.customFonts || [])
      .filter((font) => font?.family && font?.url)
      .map((font) => `@font-face{font-family:${JSON.stringify(font.family)};src:url(${JSON.stringify(font.url)});font-display:swap;}`)
      .join("\n");
  }, [renderedContent.customFonts]);

  useEffect(() => {
    const handleResize = () => applyEditableLayoutOffsets(renderedContent);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderedContent]);

  useEffect(() => {
    document.querySelectorAll(".is-editor-selected").forEach((element) => element.classList.remove("is-editor-selected"));
    if (!session || !isEditorUnlocked || !isEditorOpen || editorMode !== "edit" || !selectedEditTarget?.layoutKey) return undefined;
    document.querySelectorAll("[data-edit-layout-key]").forEach((element) => {
      if (element.dataset.editLayoutKey === selectedEditTarget.layoutKey) element.classList.add("is-editor-selected");
    });
    return () => document.querySelectorAll(".is-editor-selected").forEach((element) => element.classList.remove("is-editor-selected"));
  }, [editorMode, isEditorOpen, isEditorUnlocked, selectedEditTarget, session]);

  useEffect(() => () => {
    previewObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewObjectUrlsRef.current.clear();
  }, []);

  const changeHeroScene = useCallback((nextScene) => {
    if (nextScene === activeHeroScene || isSceneTransitioning) return;
    setIsSceneTransitioning(true);
    setActiveHeroScene(nextScene);
    window.clearTimeout(sceneTransitionTimerRef.current);
    sceneTransitionTimerRef.current = window.setTimeout(() => setIsSceneTransitioning(false), 1000);
  }, [activeHeroScene, isSceneTransitioning]);

  useEffect(() => {
    if (detailId || content.mediaMode !== "video" || content.videoUrl?.includes(".m3u8")) return undefined;
    const autoSwitchTimer = window.setTimeout(() => {
      changeHeroScene((activeHeroScene + 1) % HERO_SCENES.length);
    }, 8500);
    return () => window.clearTimeout(autoSwitchTimer);
  }, [activeHeroScene, changeHeroScene, content.mediaMode, content.videoUrl, detailId]);

  useEffect(() => () => window.clearTimeout(sceneTransitionTimerRef.current), []);

  useLayoutEffect(() => {
    if (detailId) return undefined;
    return setupHomeAnimations(pageRef.current, { playOpening: playOpeningRef.current });
  }, [detailId]);

  useEffect(() => {
    if (detailId) return undefined;
    window.addEventListener("pagehide", storeHomeScrollPosition);
    return () => window.removeEventListener("pagehide", storeHomeScrollPosition);
  }, [detailId]);

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
    setIsEditorUnlocked(true);
    setCloudStatus("online");
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setSession(null);
    setIsEditorUnlocked(false);
    setIsEditorOpen(false);
    setSelectedEditTarget(null);
  };

  const handleUpload = async (dataUrl, area) => {
    if (!session) throw new Error("管理员登录已过期，请重新登录后上传。");
    try {
      const publicUrl = await uploadPortfolioImage(dataUrl, area);
      setCloudStatus("online");
      return publicUrl;
    } catch (uploadError) {
      setCloudStatus("offline");
      throw uploadError;
    }
  };

  const handleEditorImageUpload = async (file, target) => {
    const path = target.path;
    if (!file || !path) return;
    if (file.size > 12 * 1024 * 1024) {
      setUploadStates((current) => ({
        ...current,
        [path]: { status: "error", error: "请选择小于 12MB 的图片。" },
      }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const previousValue = getContentValue(draftContent, path) || "";
    previewObjectUrlsRef.current.add(objectUrl);
    setPreviewOverrides((current) => ({ ...current, [path]: objectUrl }));
    setUploadStates((current) => ({
      ...current,
      [path]: {
        status: "uploading",
        file,
        fileName: file.name,
        fileSize: file.size,
        previousValue,
        error: "",
        warning: "",
      },
    }));

    const dimensions = await readImageDimensions(file).catch(() => null);
    const requirement = imageRequirement(path);
    const actualRatio = dimensions?.height ? dimensions.width / dimensions.height : null;
    const ratioMismatch = requirement.ratio && actualRatio
      ? Math.abs(actualRatio / requirement.ratio - 1) > 0.08
      : false;
    const warning = ratioMismatch
      ? `当前图片比例约为 ${dimensions.width}:${dimensions.height}，${requirement.label}。仍会按当前文件上传。`
      : "";

    setUploadStates((current) => ({
      ...current,
      [path]: { ...current[path], dimensions, warning },
    }));

    try {
      const publicUrl = await handleUpload(file, imagePathArea(path));
      applyDraftChange(path, publicUrl, `${path}:upload`, false);
      setUploadStates((current) => ({
        ...current,
        [path]: {
          status: "success",
          file,
          fileName: file.name,
          fileSize: file.size,
          previousValue,
          dimensions,
          warning,
          publicUrl,
        },
      }));
    } catch {
      setUploadStates((current) => ({
        ...current,
        [path]: {
          status: "error",
          file,
          fileName: file.name,
          fileSize: file.size,
          previousValue,
          dimensions,
          warning,
          error: "图片上传失败，页面已恢复原图。请检查网络后重试。",
        },
      }));
    } finally {
      setPreviewOverrides((current) => {
        const next = { ...current };
        delete next[path];
        return next;
      });
      previewObjectUrlsRef.current.delete(objectUrl);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleEditorFontUpload = async (file, target) => {
    if (!session) throw new Error("请先登录管理员账号。");
    if (!file || !target?.layoutKey) return;
    if (file.size > 8 * 1024 * 1024) throw new Error("字体文件请小于 8MB。");
    const family = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]+/g, " ").trim() || `Custom Font ${Date.now()}`;
    const localUrl = URL.createObjectURL(file);
    previewObjectUrlsRef.current.add(localUrl);
    const localFont = new FontFace(family, `url(${localUrl})`);
    await localFont.load();
    document.fonts.add(localFont);
    applyDraftChange(`styleOverrides.${target.layoutKey}`, {
      ...(draftContent.styleOverrides?.[target.layoutKey] || {}),
      fontFamily: family,
    }, `font:${target.layoutKey}`, false);
    try {
      const publicUrl = await uploadPortfolioFile(file, "fonts");
      const fonts = (draftContent.customFonts || []).filter((font) => font.family !== family);
      applyDraftChange("customFonts", [...fonts, { family, url: publicUrl, fileName: file.name }], `font-upload:${family}`, false);
      return { family, url: publicUrl };
    } catch (error) {
      throw error;
    }
  };

  const saveContent = async (nextContent) => {
    const merged = mergeContent(nextContent);

    if (!session) {
      return { success: false, content: merged, message: "管理员登录已过期，请重新登录后发布。" };
    }
    try {
      await saveRemoteContent(stripLocalImages(merged));
    } catch {
      setCloudStatus("offline");
      return { success: false, content: merged, message: "发布失败，草稿仍保存在当前浏览器中，请检查 Supabase 或网络后重试。" };
    }

    setContent(merged);
    setCloudStatus("online");
    try {
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(stripLocalImages(merged)));
    } catch {
      // Remote publish is authoritative; a blocked local cache must not turn success into failure.
    }
    await writePersistentContent(merged).catch(() => undefined);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    return { success: true, content: merged, message: "已发布到 Supabase，所有访问者都将看到当前版本。" };
  };

  const restoreRecoverableDraft = useCallback(() => {
    if (!recoverableDraft?.content) return;
    const restored = mergeContent(recoverableDraft.content);
    setDraftHistory({ entries: [content, restored], index: 1 });
    hasEditedDraftRef.current = true;
    setRecoverableDraft(null);
    setDraftStatus("saved");
  }, [content, recoverableDraft]);

  const discardStoredDraft = useCallback(() => {
    clearEditorDraft();
    setRecoverableDraft(null);
  }, []);

  const discardDraftChanges = useCallback(() => {
    previewObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewObjectUrlsRef.current.clear();
    setPreviewOverrides({});
    setUploadStates({});
    clearEditorDraft();
    setRecoverableDraft(null);
    setSelectedEditTarget(null);
    resetDraftHistory(content);
    setDraftStatus("idle");
  }, [content, resetDraftHistory]);

  const publishDraft = useCallback(async () => {
    const result = await saveContent(draftContent);
    if (result.success) {
      clearEditorDraft();
      setRecoverableDraft(null);
      hasEditedDraftRef.current = false;
      resetDraftHistory(result.content);
      setDraftStatus("published");
    } else {
      setDraftStatus("publish-error");
    }
    return result;
  }, [draftContent, resetDraftHistory, session]);

  const selectEditTarget = useCallback((target) => {
    setSelectedEditTarget(normalizeEditTarget(target));
    if (target) setEditorMode("edit");
  }, []);

  const resetContent = async () => {
    localStorage.removeItem(CONTENT_STORAGE_KEY);
    await clearPersistentContent().catch(() => undefined);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setContent(DEFAULT_CONTENT);
    return DEFAULT_CONTENT;
  };

  const editorProps = {
    isOpen: isEditorOpen,
    onOpen: openEditor,
    onClose: () => {
      setIsEditorOpen(false);
      setIsEditorUnlocked(false);
      setSelectedEditTarget(null);
    },
    session,
    isUnlocked: isEditorUnlocked,
    cloudStatus,
    onSignIn: handleSignIn,
    onSignOut: handleSignOut,
    editorMode,
    onEditorModeChange: setEditorMode,
    draft: renderedContent,
    publishedContent: content,
    selectedTarget: selectedEditTarget,
    onSelectTarget: selectEditTarget,
    recoverableDraft,
    onRestoreDraft: restoreRecoverableDraft,
    onDiscardStoredDraft: discardStoredDraft,
    hasChanges: hasDraftChanges,
    draftStatus,
    canUndo: canUndoDraft,
    canRedo: canRedoDraft,
    onUndo: undoDraft,
    onRedo: redoDraft,
    onChange: applyDraftChange,
    onUploadImage: handleEditorImageUpload,
    onUploadFont: handleEditorFontUpload,
    uploadStates,
    onPublish: publishDraft,
    onDiscardChanges: discardDraftChanges,
  };

  if (detailId) {
    return (
      <>
        <NavigationTransition onNavigate={handleRouteNavigation} />
        <TargetCursor cursorColor={isLightTheme ? "#111318" : "#f1efe4"} cursorColorOnTarget="#b6d600" />
        <DetailPage detailId={detailId} content={renderedContent} onEdit={openEditor} themeMode={isLightTheme ? "light" : "dark"} />
        <ContentEditorV2 {...editorProps} />
      </>
    );
  }

  return (
    <>
      <NavigationTransition onNavigate={handleRouteNavigation} />
      <TargetCursor cursorColor={isLightTheme ? "#111318" : "#f1efe4"} cursorColorOnTarget="#b6d600" />
      <Navigation
        brand={renderedContent.brand}
        logoImage={renderedContent.logoImage}
        navigation={renderedContent.navigation}
        isOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen((current) => !current)}
        onClose={() => setIsMenuOpen(false)}
        onEdit={openEditor}
      />
      <main ref={pageRef} className={"min-h-[100dvh] overflow-x-clip bg-[#08090b] text-[#efede1]" + (isLightTheme ? " portfolio-light-mode" : "")}>
      <section id="top" data-hero className="portfolio-hero relative min-h-[100dvh] overflow-hidden bg-[#08090b]">
        <HeroSceneBackground content={renderedContent} activeScene={activeHeroScene} />
        <div className="portfolio-hero__tone portfolio-hero__tone--horizontal absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.92)_0%,rgba(5,6,8,0.42)_52%,rgba(5,6,8,0.66)_100%)]" />
        <div className="portfolio-hero__tone portfolio-hero__tone--vertical absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.2)_0%,rgba(5,6,8,0.12)_40%,rgba(5,6,8,0.94)_100%)]" />
        <div className="hero-cinematic-vignette absolute inset-0" aria-hidden="true" />
        <div className="noise-overlay absolute inset-0 opacity-35" aria-hidden="true" />
        <div className="hero-grid absolute inset-0" aria-hidden="true" />

        <div className="portfolio-layout relative z-10 mx-auto flex min-h-[100dvh] max-w-[1700px] flex-col justify-end px-5 pb-9 pt-32 sm:px-8 sm:pb-12 lg:px-12 lg:pb-14">
          <div className="max-w-[1500px]">
            <div data-hero-meta className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
              <span className="portfolio-hero__eyebrow text-[10px] font-bold uppercase text-[#e5ff48]" data-edit-path="eyebrow" data-edit-kind="text" data-edit-label="首页身份标签" data-edit-section="首页">{renderedContent.eyebrow}</span>
              <span className="portfolio-hero__meta-line hidden h-px w-16 bg-white/28 sm:block" />
              <span className="portfolio-hero__meta text-[10px] font-bold uppercase text-white/46">Shanghai · Available 2026</span>
            </div>

            <h1 className="portfolio-hero__title display-editorial mt-7 max-w-[13ch] text-[56px] leading-[1.02] text-[#f1efe4] sm:text-[82px] sm:leading-[0.9] lg:text-[118px] lg:leading-[0.84] xl:text-[150px] 2xl:text-[164px]" data-edit-path="headline" data-edit-kind="text" data-edit-label="首页主标题" data-edit-section="首页">
              {renderedContent.headline.trim().split(/\s+/).map((word, index, words) => (
                <span key={`${word}-${index}`}>
                  <span className="hero-word-mask">
                    <span data-hero-word className="hero-word">
                      {word}
                      {index === words.length - 1 && <span data-hero-period className="portfolio-hero__period inline-block text-[#e5ff48]">.</span>}
                    </span>
                  </span>
                  {index < words.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:gap-20">
              <p data-hero-copy className="portfolio-hero__description max-w-2xl text-sm leading-7 text-white/58 sm:text-base sm:leading-8" data-edit-path="description" data-edit-kind="text" data-edit-label="首页简介" data-edit-section="首页" data-edit-multiline="true">{renderedContent.description}</p>
              <div data-hero-cta className="flex flex-wrap gap-3 lg:justify-self-end">
                <a className="portfolio-hero__cta portfolio-hero__cta--primary cursor-target group inline-flex min-h-14 items-center gap-5 rounded-full bg-[#e5ff48] px-6 text-[11px] font-bold uppercase text-[#090a0c] transition-transform hover:-translate-y-1" href="#projects">
                  <span data-edit-path="ctaLabel" data-edit-kind="text" data-edit-label="首页按钮文字" data-edit-section="首页">{renderedContent.ctaLabel}</span>
                  <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} />
                </a>
                <a className="cursor-target inline-flex min-h-14 items-center gap-3 rounded-full border border-white/24 bg-black/16 px-6 text-[11px] font-bold uppercase text-white backdrop-blur-md transition-colors hover:border-white/54" href={`mailto:${renderedContent.about.email}`}>
                  Contact me
                </a>
              </div>
            </div>

            <div data-hero-foot className="portfolio-hero__foot mt-10 grid gap-5 border-t border-white/16 pt-6 text-[10px] font-bold uppercase text-white/38 sm:grid-cols-3 lg:mt-14">
              <span data-edit-path="card.year" data-edit-kind="text" data-edit-label="首页年份" data-edit-section="首页">{renderedContent.card.year}</span>
              <span className="sm:text-center" data-edit-path="about.role" data-edit-kind="text" data-edit-label="身份 / 职位" data-edit-section="关于我">{renderedContent.about.role}</span>
              {renderedContent.mediaMode === "video" && !renderedContent.videoUrl?.includes(".m3u8") ? (
                <div className="hero-scene-switcher grid grid-cols-4 gap-1 sm:justify-self-end" aria-label="Hero scenes">
                  {HERO_SCENES.map((scene, index) => (
                    <button
                      key={scene.label}
                      className={`cursor-target min-h-7 border-b px-1 text-[8px] font-bold uppercase transition-colors duration-500 sm:px-2 sm:text-[9px] ${
                        activeHeroScene === index ? "border-[#e5ff48] text-white" : "border-transparent text-white/34 hover:text-white/72"
                      }`}
                      type="button"
                      aria-label={`Show ${scene.label} scene`}
                      aria-pressed={activeHeroScene === index}
                      onClick={() => changeHeroScene(index)}
                    >
                      <span className="sm:hidden">{scene.shortLabel}</span>
                      <span className="hidden sm:inline">{scene.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="sm:text-right">Selected work / Brand systems</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <LatestCasesSection content={renderedContent.projects} />
      <ExperienceSection content={renderedContent.about} size={renderedContent.sectionSizes.about} />
      <CareerSection content={renderedContent.career} size={renderedContent.sectionSizes.career} />
      {isShowcasePreview ? (
        <ProjectsShowcasePreview content={renderedContent.projects} />
      ) : (
        <ProjectsSection content={renderedContent.projects} size={renderedContent.sectionSizes.projects} />
      )}
      <StrengthsSection content={renderedContent.blog} capabilities={renderedContent.resume} size={Math.max(renderedContent.sectionSizes.blog, renderedContent.sectionSizes.resume)} />
      {isShowcasePreview && <VisualGallerySection content={renderedContent.projects} />}
      <ContactSection content={renderedContent.about} projects={renderedContent.projects} />
      <ContentEditorV2 {...editorProps} />
      </main>
    </>
  );
}

export default App;
