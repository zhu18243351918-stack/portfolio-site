export const EDITOR_DRAFT_STORAGE_KEY = "portfolio_content_draft_v1";

function pathSegments(path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

export function getContentValue(content, path) {
  return pathSegments(path).reduce((value, segment) => value?.[segment], content);
}

export function setContentValue(content, path, value) {
  const segments = pathSegments(path);
  if (!segments.length) return content;

  const update = (current, depth) => {
    const segment = segments[depth];
    const clone = Array.isArray(current) ? [...current] : { ...(current || {}) };
    if (depth === segments.length - 1) {
      clone[segment] = value;
      return clone;
    }

    const nextSegment = segments[depth + 1];
    const fallback = typeof nextSegment === "number" ? [] : {};
    clone[segment] = update(current?.[segment] ?? fallback, depth + 1);
    return clone;
  };

  return update(content, 0);
}

export function contentSnapshot(content) {
  return JSON.stringify(content || {});
}

export function readEditorDraft() {
  try {
    const parsed = JSON.parse(localStorage.getItem(EDITOR_DRAFT_STORAGE_KEY) || "null");
    return parsed?.content ? parsed : null;
  } catch {
    return null;
  }
}

export function writeEditorDraft(content) {
  const record = { content, savedAt: new Date().toISOString() };
  localStorage.setItem(EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function clearEditorDraft() {
  localStorage.removeItem(EDITOR_DRAFT_STORAGE_KEY);
}

export function normalizeEditTarget(target) {
  if (!target?.path) return null;
  const segments = pathSegments(target.path);
  const itemCollections = new Set(["items", "catalogItems", "latestItems", "mosaicItems", "visualItems", "contactItems"]);
  const itemCollectionIndex = segments.findIndex((segment) => itemCollections.has(segment));
  const galleryIndex = segments.findIndex((segment) => segment === "gallery");
  const lastSegment = segments.at(-1);

  return {
    ...target,
    section: target.section || "页面",
    layoutKey: target.layoutKey || makeLayoutKey(target.section, target.path, 0),
    itemIndex:
      itemCollectionIndex >= 0 && typeof segments[itemCollectionIndex + 1] === "number"
        ? segments[itemCollectionIndex + 1]
        : null,
    field: typeof lastSegment === "string" ? lastSegment : galleryIndex >= 0 ? "gallery" : "",
    imageIndex:
      galleryIndex >= 0 && typeof segments[galleryIndex + 1] === "number"
        ? segments[galleryIndex + 1]
        : null,
  };
}

export function targetFromElement(element) {
  if (!element?.dataset?.editPath) return null;
  return normalizeEditTarget({
    path: element.dataset.editPath,
    kind: element.dataset.editKind || "text",
    label: element.dataset.editLabel || "页面内容",
    section: element.dataset.editSection || "页面",
    multiline: element.dataset.editMultiline === "true",
    galleryPath: element.dataset.editGalleryPath || "",
    layoutKey: element.dataset.editLayoutKey || "",
    autoText: element.dataset.editAutoText === "true",
    originalValue: element.dataset.editOriginalText || "",
  });
}

export function layoutBreakpoint() {
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

export function makeLayoutKey(section, path, occurrence = 0) {
  return `${section || "页面"}::${String(path || "").replaceAll(".", "__")}::${occurrence}`;
}

function directTextValue(element) {
  return [...element.childNodes]
    .filter((node) => node.nodeType === 3)
    .map((node) => node.nodeValue || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function stableTextHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function applyDirectTextValue(element, value) {
  const textNodes = [...element.childNodes].filter((node) => node.nodeType === 3);
  if (!textNodes.length) {
    element.insertBefore(document.createTextNode(String(value ?? "")), element.firstChild);
    return;
  }
  textNodes[0].nodeValue = String(value ?? "");
  textNodes.slice(1).forEach((node) => { node.nodeValue = ""; });
}

export function layoutOffset(content, layoutKey, breakpoint = layoutBreakpoint()) {
  const value = content?.layoutOffsets?.[layoutKey]?.[breakpoint];
  return {
    x: Number.isFinite(Number(value?.x)) ? Number(value.x) : 0,
    y: Number.isFinite(Number(value?.y)) ? Number(value.y) : 0,
  };
}

export function assignEditableLayoutKeys(root = document) {
  const sectionLabels = {
    top: "首页",
    "latest-cases": "最新案例推荐",
    about: "关于我",
    experience: "工作履历",
    projects: "优秀作品",
    strengths: "个人优势",
    "visual-range": "视觉作品",
    contact: "联系方式",
  };
  root.querySelectorAll("section[id]").forEach((section) => {
    if (section.dataset.editPath) return;
    const label = sectionLabels[section.id] || section.id;
    section.dataset.editPath = `sections.${section.id}`;
    section.dataset.editKind = "style";
    section.dataset.editLabel = `${label}板块`;
    section.dataset.editSection = label;
  });

  const autoTextOccurrences = new Map();
  const routeScope = new URLSearchParams(window.location.search).get("detail") || "home";
  root.querySelectorAll("body *").forEach((element) => {
    if (element.dataset.editPath) return;
    if (element.closest("[data-editor-panel], .editor-panel-v2")) return;
    if (element.closest("[data-edit-kind='text']")) return;
    if (element.matches("script, style, noscript, template, svg, path, input, textarea, select, option, video, audio, canvas")) return;
    if (element.getAttribute("aria-hidden") === "true") return;
    if ([...element.children].some((child) => child.textContent?.trim())) return;

    const originalText = directTextValue(element);
    if (!originalText) return;
    const sectionElement = element.closest("section[id]");
    const sectionId = sectionElement?.id || (element.closest("header") ? "header" : element.closest("footer") ? "footer" : "global");
    const section = sectionLabels[sectionId] || (sectionId === "header" ? "导航" : sectionId === "footer" ? "页脚" : "页面");
    const baseKey = `${routeScope.replace(/[^a-zA-Z0-9_-]/g, "_")}__${sectionId.replace(/[^a-zA-Z0-9_-]/g, "_")}__${element.tagName.toLowerCase()}__${stableTextHash(originalText)}`;
    const occurrence = autoTextOccurrences.get(baseKey) || 0;
    autoTextOccurrences.set(baseKey, occurrence + 1);
    const overrideKey = `${baseKey}__${occurrence}`;

    element.dataset.editPath = `textOverrides.${overrideKey}`;
    element.dataset.editKind = "text";
    element.dataset.editLabel = `文字：${originalText.slice(0, 24)}`;
    element.dataset.editSection = section;
    element.dataset.editMultiline = String(originalText.length > 72 || ["P", "H1", "H2", "H3", "H4", "LI"].includes(element.tagName));
    element.dataset.editAutoText = "true";
    element.dataset.editOriginalText = originalText;
  });

  const occurrences = new Map();
  root.querySelectorAll("[data-edit-path]").forEach((element) => {
    if (element.dataset.editLayoutKey) return;
    const section = element.dataset.editSection || "页面";
    const path = element.dataset.editPath;
    const base = `${section}::${path}`;
    const occurrence = occurrences.get(base) || 0;
    occurrences.set(base, occurrence + 1);
    element.dataset.editLayoutKey = makeLayoutKey(section, path, occurrence);
  });
}

export function applyEditableLayoutOffsets(content, root = document) {
  assignEditableLayoutKeys(root);
  const breakpoint = layoutBreakpoint();
  root.querySelectorAll("[data-edit-layout-key]").forEach((element) => {
    const offset = layoutOffset(content, element.dataset.editLayoutKey, breakpoint);
    element.style.setProperty("--layout-offset-x", `${offset.x}px`);
    element.style.setProperty("--layout-offset-y", `${offset.y}px`);
    element.classList.toggle("has-layout-offset", offset.x !== 0 || offset.y !== 0);
    const style = content?.styleOverrides?.[element.dataset.editLayoutKey] || {};
    if (element.dataset.editAutoText === "true") {
      const overrideKey = element.dataset.editPath?.slice("textOverrides.".length);
      if (overrideKey && Object.prototype.hasOwnProperty.call(content?.textOverrides || {}, overrideKey)) {
        applyDirectTextValue(element, content.textOverrides[overrideKey]);
      } else {
        applyDirectTextValue(element, element.dataset.editOriginalText || "");
      }
    }
    const isSectionStyle = element.dataset.editKind === "style" && element.tagName === "SECTION";
    const sizeElement = isSectionStyle ? element.querySelector("[data-editor-size-target]") || element : element;
    if (style.color) element.style.setProperty("color", style.color, "important");
    else element.style.removeProperty("color");
    if (style.backgroundColor) element.style.setProperty("background-color", style.backgroundColor, "important");
    else element.style.removeProperty("background-color");
    if (style.fontFamily) element.style.setProperty("font-family", `${JSON.stringify(style.fontFamily)}, sans-serif`, "important");
    else element.style.removeProperty("font-family");
    if (Number(style.fontSize) > 0) element.style.setProperty("font-size", `${Number(style.fontSize)}px`, "important");
    else element.style.removeProperty("font-size");
    if (Number(style.lineHeight) > 0) element.style.setProperty("line-height", String(Number(style.lineHeight)), "important");
    else element.style.removeProperty("line-height");
    if (style.marginTop !== "" && Number.isFinite(Number(style.marginTop))) element.style.setProperty("margin-top", `${Number(style.marginTop)}px`, "important");
    else element.style.removeProperty("margin-top");
    if (style.marginBottom !== "" && Number.isFinite(Number(style.marginBottom))) element.style.setProperty("margin-bottom", `${Number(style.marginBottom)}px`, "important");
    else element.style.removeProperty("margin-bottom");
    if (Number(style.width) > 0) element.style.setProperty("width", `${Number(style.width)}px`, "important");
    else element.style.removeProperty("width");
    if (isSectionStyle) {
      element.style.removeProperty("height");
      if (Number(style.height) > 0) sizeElement.style.setProperty("min-height", `${Number(style.height)}px`, "important");
      else sizeElement.style.removeProperty("min-height");
      if (style.paddingTop !== "" && Number.isFinite(Number(style.paddingTop))) sizeElement.style.setProperty("padding-top", `${Math.max(0, Number(style.paddingTop))}px`, "important");
      else sizeElement.style.removeProperty("padding-top");
      if (style.paddingBottom !== "" && Number.isFinite(Number(style.paddingBottom))) sizeElement.style.setProperty("padding-bottom", `${Math.max(0, Number(style.paddingBottom))}px`, "important");
      else sizeElement.style.removeProperty("padding-bottom");
    } else {
      if (Number(style.height) > 0) element.style.setProperty("height", `${Number(style.height)}px`, "important");
      else element.style.removeProperty("height");
    }
    if (Number.isFinite(Number(style.rotation)) && Number(style.rotation) !== 0) {
      element.style.setProperty("--editor-rotation", `${Number(style.rotation)}deg`);
    } else {
      element.style.removeProperty("--editor-rotation");
    }
  });
}

export function inferGalleryPath(path) {
  const match = String(path || "").match(/^(.*\.gallery)\.\d+$/);
  return match?.[1] || "";
}

export function imageRequirement(path) {
  if (path === "logoImage") return { label: "建议比例 1:1", ratio: 1 };
  if (path === "backgroundImage") return { label: "建议比例 16:9", ratio: 16 / 9 };
  if (path === "about.image") return { label: "建议比例 4:5", ratio: 4 / 5 };
  if (/career\.items\.\d+\.logo$/.test(path)) return { label: "建议使用横版或方形 Logo", ratio: null };
  if (/projects\.latestItems\.\d+\.image$/.test(path)) return { label: "建议比例 4:3", ratio: 4 / 3 };
  if (/projects\.catalogItems\.\d+\.image$/.test(path)) return { label: "建议比例 16:9", ratio: 16 / 9 };
  if (/projects\.visualItems\.\d+\.image$/.test(path)) return { label: "建议比例 1:1", ratio: 1 };
  if (/projects\.contactItems\.\d+\.image$/.test(path)) return { label: "按当前联系页图片框替换", ratio: null };
  if (/blog\.items\.\d+\.asset$/.test(path)) return { label: "建议比例 4:5", ratio: 4 / 5 };
  if (/\.gallery\.\d+$/.test(path)) return { label: "建议比例 16:9", ratio: 16 / 9 };
  if (/resume\.items\.\d+\.asset$/.test(path)) return { label: "建议比例 16:9", ratio: 16 / 9 };
  return { label: "建议使用清晰原图", ratio: null };
}

export function imagePathArea(path) {
  return String(path || "")
    .replace(/\.gallery\.(\d+)$/, "/gallery/$1")
    .replace(/\.(\d+)\./g, "/$1/")
    .replace(/\./g, "/")
    .replace(/\/+/, "/");
}

export function fileNameFromUrl(url) {
  if (!url) return "尚未设置图片";
  try {
    return decodeURIComponent(new URL(url, window.location.href).pathname.split("/").pop() || "图片");
  } catch {
    return String(url).split("/").pop() || "图片";
  }
}

export function formatDraftTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
}
