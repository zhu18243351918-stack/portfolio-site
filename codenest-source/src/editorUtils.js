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
  const itemCollectionIndex = segments.findIndex((segment) => segment === "items" || segment === "catalogItems");
  const galleryIndex = segments.findIndex((segment) => segment === "gallery");
  const lastSegment = segments.at(-1);

  return {
    ...target,
    section: target.section || "页面",
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
  if (/projects\.catalogItems\.\d+\.image$/.test(path)) return { label: "建议比例 3:4", ratio: 3 / 4 };
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
