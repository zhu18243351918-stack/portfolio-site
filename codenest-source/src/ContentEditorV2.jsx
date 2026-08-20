import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  Eye,
  ImagePlus,
  LayoutList,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Move,
  MoveVertical,
  MousePointer2,
  Palette,
  Redo2,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import {
  fileNameFromUrl,
  formatDraftTime,
  getContentValue,
  imageRequirement,
  inferGalleryPath,
  layoutBreakpoint,
  layoutOffset,
  targetFromElement,
} from "./editorUtils";

const FIELD_CLASS =
  "mt-2 w-full rounded-[6px] border border-white/14 bg-white/[0.045] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#e5ff48]";

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function targetLocation(target) {
  const parts = [target.section];
  if (Number.isInteger(target.itemIndex)) parts.push(`卡片 ${String(target.itemIndex + 1).padStart(2, "0")}`);
  if (Number.isInteger(target.imageIndex)) parts.push(`图片 ${String(target.imageIndex + 1).padStart(2, "0")}`);
  if (target.label && !parts.includes(target.label)) parts.push(target.label);
  return parts.filter(Boolean).join(" > ");
}

function editableElementByLayoutKey(layoutKey) {
  return [...document.querySelectorAll("[data-edit-layout-key]")].find(
    (candidate) => candidate.dataset.editLayoutKey === layoutKey,
  );
}

function editableSizeElement(element, target) {
  if (!element) return null;
  if (target?.kind === "style") return element.querySelector("[data-editor-size-target]") || element;
  if (target?.kind === "image") return element.closest("[class*='image'], figure, picture") || element;
  return element;
}

function EditorField({ label, value, multiline = false, onChange }) {
  const safeValue = value ?? "";
  return (
    <label className="block text-[11px] font-semibold text-white/56">
      {label}
      {multiline ? (
        <textarea
          className={`${FIELD_CLASS} min-h-24 resize-y leading-6`}
          value={safeValue}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input className={FIELD_CLASS} value={safeValue} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function ElementLayoutInspector({ target, draft, onChange, onUploadFont }) {
  const breakpoint = layoutBreakpoint();
  const offset = layoutOffset(draft, target.layoutKey, breakpoint);
  const stylePath = `styleOverrides.${target.layoutKey}`;
  const styles = getContentValue(draft, stylePath) || {};
  const [fontUploadError, setFontUploadError] = useState("");
  const offsetPath = `layoutOffsets.${target.layoutKey}.${breakpoint}`;
  const updateOffset = (key, value) => {
    const number = Number(value);
    onChange(offsetPath, { ...offset, [key]: Number.isFinite(number) ? number : 0 }, `${offsetPath}:${key}`);
  };
  const updateStyle = (key, value) => {
    onChange(stylePath, { ...styles, [key]: value }, `${stylePath}:${key}`);
  };

  return (
    <div className="space-y-4 border-b border-white/10 pb-5">
      <div className="flex items-start gap-3 rounded-[6px] border border-[#e5ff48]/18 bg-[#e5ff48]/6 p-3">
        <Move className="mt-0.5 shrink-0 text-[#e5ff48]" size={15} />
        <div>
          <p className="text-xs font-semibold text-white">拖动调整位置</p>
          <p className="mt-1 text-[10px] leading-5 text-white/42">直接拖动页面中的选中元素，当前位置单独保存为{breakpoint === "mobile" ? "手机端" : "桌面端"}布局。</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-[11px] font-semibold text-white/56">
          水平 X
          <input className={FIELD_CLASS} type="number" step="1" value={offset.x} onChange={(event) => updateOffset("x", event.target.value)} />
        </label>
        <label className="text-[11px] font-semibold text-white/56">
          垂直 Y
          <input className={FIELD_CLASS} type="number" step="1" value={offset.y} onChange={(event) => updateOffset("y", event.target.value)} />
        </label>
      </div>
      <button className="min-h-9 w-full rounded-[5px] border border-white/14 text-[10px] font-semibold text-white/48 hover:border-white/30 hover:text-white" type="button" onClick={() => onChange(offsetPath, { x: 0, y: 0 }, `${offsetPath}:reset`, false)}>
        重置当前位置
      </button>

      <div className="border-t border-white/10 pt-4">
        <p className="mb-3 text-xs font-semibold text-white">{target.kind === "style" ? "板块高度" : "元素尺寸"}</p>
        {target.kind === "style" ? (
          <>
            <label className="block text-[11px] font-semibold text-white/56">
              最小高度 px
              <input className={FIELD_CLASS} type="number" min="240" max="1800" step="1" placeholder="自动" value={styles.height || ""} onChange={(event) => updateStyle("height", event.target.value ? Number(event.target.value) : "")} />
            </label>
            <input className="mt-3 w-full accent-[#e5ff48]" type="range" min="240" max="1200" step="4" value={Number(styles.height) || 480} onChange={(event) => updateStyle("height", Number(event.target.value))} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-[11px] font-semibold text-white/56">
                上留白 px
                <input className={FIELD_CLASS} type="number" min="0" max="400" step="1" placeholder="默认" value={styles.paddingTop ?? ""} onChange={(event) => updateStyle("paddingTop", event.target.value === "" ? "" : Number(event.target.value))} />
              </label>
              <label className="text-[11px] font-semibold text-white/56">
                下留白 px
                <input className={FIELD_CLASS} type="number" min="0" max="400" step="1" placeholder="默认" value={styles.paddingBottom ?? ""} onChange={(event) => updateStyle("paddingBottom", event.target.value === "" ? "" : Number(event.target.value))} />
              </label>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-white/38">也可以直接拖动页面中板块顶部或底部的绿色手柄。</p>
            <button className="mt-3 min-h-9 w-full rounded-[5px] border border-white/14 text-[10px] font-semibold text-white/48 hover:border-white/30 hover:text-white" type="button" onClick={() => onChange(stylePath, { ...styles, height: "", paddingTop: "", paddingBottom: "" }, `${stylePath}:section-size-reset`, false)}>
              恢复自动高度
            </button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[11px] font-semibold text-white/56">
                宽度 px
                <input className={FIELD_CLASS} type="number" min="0" step="1" placeholder="自动" value={styles.width || ""} onChange={(event) => updateStyle("width", event.target.value ? Number(event.target.value) : "")} />
              </label>
              <label className="text-[11px] font-semibold text-white/56">
                高度 px
                <input className={FIELD_CLASS} type="number" min="0" step="1" placeholder="自动" value={styles.height || ""} onChange={(event) => updateStyle("height", event.target.value ? Number(event.target.value) : "")} />
              </label>
            </div>
            <label className="mt-3 block text-[11px] font-semibold text-white/56">
              旋转角度
              <div className="mt-2 flex items-center gap-3">
                <input className="min-w-0 flex-1 accent-[#e5ff48]" type="range" min="-30" max="30" step="1" value={Number(styles.rotation) || 0} onChange={(event) => updateStyle("rotation", Number(event.target.value))} />
                <input className={`${FIELD_CLASS} !mt-0 !w-20`} type="number" min="-180" max="180" step="1" value={Number(styles.rotation) || 0} onChange={(event) => updateStyle("rotation", Number(event.target.value) || 0)} />
              </div>
            </label>
            <button className="mt-3 min-h-9 w-full rounded-[5px] border border-white/14 text-[10px] font-semibold text-white/48 hover:border-white/30 hover:text-white" type="button" onClick={() => onChange(stylePath, { ...styles, width: "", height: "" }, `${stylePath}:size-reset`, false)}>
              恢复自动尺寸
            </button>
          </>
        )}
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white">
          <Palette size={14} className="text-[#e5ff48]" /> 颜色
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] font-semibold text-white/56">
            字体颜色
            <span className="mt-2 flex h-10 items-center gap-2 rounded-[6px] border border-white/14 bg-white/[0.045] px-2">
              <input className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" type="color" value={styles.color || "#ffffff"} onChange={(event) => updateStyle("color", event.target.value)} />
              <span className="font-mono text-[10px] text-white/42">{styles.color || "默认"}</span>
            </span>
          </label>
          <label className="text-[11px] font-semibold text-white/56">
            背景颜色
            <span className="mt-2 flex h-10 items-center gap-2 rounded-[6px] border border-white/14 bg-white/[0.045] px-2">
              <input className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" type="color" value={styles.backgroundColor || "#000000"} onChange={(event) => updateStyle("backgroundColor", event.target.value)} />
              <span className="font-mono text-[10px] text-white/42">{styles.backgroundColor || "默认"}</span>
            </span>
          </label>
        </div>
        <button className="mt-3 min-h-9 w-full rounded-[5px] border border-white/14 text-[10px] font-semibold text-white/48 hover:border-white/30 hover:text-white" type="button" onClick={() => onChange(stylePath, {}, `${stylePath}:reset`, false)}>
          恢复默认颜色
        </button>
      </div>

      {target.kind === "text" && (
        <div className="border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white">
            <Type size={14} className="text-[#e5ff48]" /> 文字排版
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="text-[11px] font-semibold text-white/56">
              字号 px
              <input className={FIELD_CLASS} type="number" min="6" max="240" step="1" placeholder="默认" value={styles.fontSize || ""} onChange={(event) => updateStyle("fontSize", event.target.value ? Number(event.target.value) : "")} />
            </label>
            <label className="text-[11px] font-semibold text-white/56">
              行距（倍）
              <input className={FIELD_CLASS} type="number" min="0.5" max="3" step="0.05" placeholder="默认" value={styles.lineHeight || ""} onChange={(event) => updateStyle("lineHeight", event.target.value ? Number(event.target.value) : "")} />
            </label>
            <label className="text-[11px] font-semibold text-white/56">
              上间距 px
              <input className={FIELD_CLASS} type="number" min="-200" max="400" step="1" placeholder="默认" value={styles.marginTop ?? ""} onChange={(event) => updateStyle("marginTop", event.target.value === "" ? "" : Number(event.target.value))} />
            </label>
            <label className="text-[11px] font-semibold text-white/56">
              下间距 px
              <input className={FIELD_CLASS} type="number" min="-200" max="400" step="1" placeholder="默认" value={styles.marginBottom ?? ""} onChange={(event) => updateStyle("marginBottom", event.target.value === "" ? "" : Number(event.target.value))} />
            </label>
          </div>
          <select className={FIELD_CLASS} value={styles.fontFamily || ""} onChange={(event) => updateStyle("fontFamily", event.target.value)}>
            <option value="">使用原始字体</option>
            <option value="Arial">Arial</option>
            <option value="Arial Narrow">Arial Narrow</option>
            <option value="Georgia">Georgia</option>
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="SimHei">黑体</option>
            <option value="SimSun">宋体</option>
            {(draft.customFonts || []).map((font) => <option key={font.family} value={font.family}>{font.family}</option>)}
          </select>
          <button className="mt-3 min-h-9 w-full rounded-[5px] border border-white/14 text-[10px] font-semibold text-white/48 hover:border-white/30 hover:text-white" type="button" onClick={() => onChange(stylePath, { ...styles, fontSize: "", lineHeight: "", marginTop: "", marginBottom: "" }, `${stylePath}:typography-reset`, false)}>
            恢复默认文字间距
          </button>
          <label className="mt-3 flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[5px] border border-[#e5ff48]/42 text-[11px] font-semibold text-[#e5ff48] hover:bg-[#e5ff48]/8">
            <Upload size={14} /> 上传本地字体
            <input className="sr-only" type="file" accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf" onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setFontUploadError("");
              try {
                await onUploadFont(file, target);
              } catch (error) {
                setFontUploadError(error?.message || "字体上传失败，请重试。");
              }
            }} />
          </label>
          <p className="mt-2 text-[10px] leading-5 text-white/36">支持 WOFF2、WOFF、TTF、OTF，建议优先使用 WOFF2，文件小于 8MB。</p>
          {fontUploadError && <p className="mt-2 text-[10px] leading-5 text-red-200">{fontUploadError}</p>}
        </div>
      )}
    </div>
  );
}

function InlineElementToolbar({ target, draft, uploadState, onChange, onUploadImage, onUploadFont, onClose }) {
  const breakpoint = layoutBreakpoint();
  const offset = layoutOffset(draft, target.layoutKey, breakpoint);
  const stylePath = `styleOverrides.${target.layoutKey}`;
  const offsetPath = `layoutOffsets.${target.layoutKey}.${breakpoint}`;
  const styles = getContentValue(draft, stylePath) || {};
  const [frameSize, setFrameSize] = useState(null);

  useEffect(() => {
    const readSize = () => {
      const element = editableElementByLayoutKey(target.layoutKey);
      if (!element) return setFrameSize(null);
      const frame = editableSizeElement(element, target);
      const rect = frame.getBoundingClientRect();
      setFrameSize(rect.width && rect.height ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null);
    };
    readSize();
    window.addEventListener("resize", readSize);
    return () => window.removeEventListener("resize", readSize);
  }, [target.kind, target.layoutKey, styles.width, styles.height, styles.paddingTop, styles.paddingBottom]);

  const setOffset = (key, value) => onChange(offsetPath, { ...offset, [key]: Number(value) || 0 }, `${offsetPath}:${key}`);
  const setStyle = (key, value) => onChange(stylePath, { ...styles, [key]: value }, `${stylePath}:${key}`);

  return (
    <div data-editor-panel className="editor-context-toolbar fixed left-1/2 top-[62px] z-[89] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-[8px] border border-white/14 bg-[#0a0d0c]/96 p-2 text-white shadow-[0_16px_52px_rgba(0,0,0,0.42)] backdrop-blur-xl">
      <div className="min-w-[120px] border-r border-white/10 px-2">
        <p className="text-[9px] font-semibold text-[#e5ff48]">{target.section}</p>
        <p className="mt-1 max-w-40 truncate text-[11px] font-semibold text-white">{target.label}</p>
      </div>
      <label className="text-[9px] font-semibold text-white/42">X<input className="mt-1 h-8 w-16 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" value={offset.x} onChange={(event) => setOffset("x", event.target.value)} /></label>
      <label className="text-[9px] font-semibold text-white/42">Y<input className="mt-1 h-8 w-16 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" value={offset.y} onChange={(event) => setOffset("y", event.target.value)} /></label>
      {target.kind === "style" ? (
        <>
          <label className="text-[9px] font-semibold text-white/42">板块高<input className="mt-1 h-8 w-20 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="240" max="1800" placeholder={frameSize?.height ? String(frameSize.height) : "自动"} value={styles.height || ""} onChange={(event) => setStyle("height", event.target.value ? Number(event.target.value) : "")} /></label>
          <label className="text-[9px] font-semibold text-white/42">上留白<input className="mt-1 h-8 w-20 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="0" max="400" placeholder="默认" value={styles.paddingTop ?? ""} onChange={(event) => setStyle("paddingTop", event.target.value === "" ? "" : Number(event.target.value))} /></label>
          <label className="text-[9px] font-semibold text-white/42">下留白<input className="mt-1 h-8 w-20 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="0" max="400" placeholder="默认" value={styles.paddingBottom ?? ""} onChange={(event) => setStyle("paddingBottom", event.target.value === "" ? "" : Number(event.target.value))} /></label>
        </>
      ) : (
        <>
          <label className="text-[9px] font-semibold text-white/42">宽<input className="mt-1 h-8 w-20 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="0" placeholder="自动" value={styles.width || ""} onChange={(event) => setStyle("width", event.target.value ? Number(event.target.value) : "")} /></label>
          <label className="text-[9px] font-semibold text-white/42">高<input className="mt-1 h-8 w-20 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="0" placeholder="自动" value={styles.height || ""} onChange={(event) => setStyle("height", event.target.value ? Number(event.target.value) : "")} /></label>
          <label className="text-[9px] font-semibold text-white/42">旋转<input className="mt-1 h-8 w-16 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="-180" max="180" value={Number(styles.rotation) || 0} onChange={(event) => setStyle("rotation", Number(event.target.value) || 0)} /></label>
          <label className="text-[9px] font-semibold text-white/42">文字<input className="mt-1 block h-8 w-10 cursor-pointer rounded-[4px] border border-white/12 bg-transparent p-1" type="color" value={styles.color || "#ffffff"} onChange={(event) => setStyle("color", event.target.value)} /></label>
        </>
      )}
      <label className="text-[9px] font-semibold text-white/42">背景<input className="mt-1 block h-8 w-10 cursor-pointer rounded-[4px] border border-white/12 bg-transparent p-1" type="color" value={styles.backgroundColor || "#000000"} onChange={(event) => setStyle("backgroundColor", event.target.value)} /></label>

      {target.kind === "text" && (
        <>
          <label className="text-[9px] font-semibold text-white/42">字号<input className="mt-1 h-8 w-16 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="6" max="240" placeholder="默认" value={styles.fontSize || ""} onChange={(event) => setStyle("fontSize", event.target.value ? Number(event.target.value) : "")} /></label>
          <label className="text-[9px] font-semibold text-white/42">行距<input className="mt-1 h-8 w-16 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="0.5" max="3" step="0.05" placeholder="默认" value={styles.lineHeight || ""} onChange={(event) => setStyle("lineHeight", event.target.value ? Number(event.target.value) : "")} /></label>
          <label className="text-[9px] font-semibold text-white/42">上距<input className="mt-1 h-8 w-16 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="-200" max="400" placeholder="默认" value={styles.marginTop ?? ""} onChange={(event) => setStyle("marginTop", event.target.value === "" ? "" : Number(event.target.value))} /></label>
          <label className="text-[9px] font-semibold text-white/42">下距<input className="mt-1 h-8 w-16 rounded-[4px] border border-white/12 bg-white/5 px-2 text-xs text-white outline-none" type="number" min="-200" max="400" placeholder="默认" value={styles.marginBottom ?? ""} onChange={(event) => setStyle("marginBottom", event.target.value === "" ? "" : Number(event.target.value))} /></label>
          <label className="text-[9px] font-semibold text-white/42">字体
            <select className="mt-1 block h-8 w-36 rounded-[4px] border border-white/12 bg-[#111513] px-2 text-[10px] text-white outline-none" value={styles.fontFamily || ""} onChange={(event) => setStyle("fontFamily", event.target.value)}>
              <option value="">原始字体</option><option value="Arial">Arial</option><option value="Arial Narrow">Arial Narrow</option><option value="Georgia">Georgia</option><option value="Microsoft YaHei">微软雅黑</option><option value="SimHei">黑体</option><option value="SimSun">宋体</option>
              {(draft.customFonts || []).map((font) => <option key={font.family} value={font.family}>{font.family}</option>)}
            </select>
          </label>
          <label className="mt-4 flex min-h-8 cursor-pointer items-center gap-2 rounded-[4px] border border-white/14 px-3 text-[10px] font-semibold text-white/58 hover:border-[#e5ff48] hover:text-[#e5ff48]">
            <Type size={13} /> 上传字体
            <input className="sr-only" type="file" accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUploadFont(file, target); }} />
          </label>
          <button className="mt-4 flex min-h-8 min-w-max items-center gap-2 rounded-[4px] border border-red-300/24 px-3 text-[10px] font-semibold text-red-200/72 hover:border-red-300/60 hover:text-red-100" type="button" onClick={() => onChange(target.path, "", `delete:${target.path}`, false)}>
            <Trash2 size={13} /> 删除文字
          </button>
        </>
      )}

      {target.kind === "image" && (
        <>
          {frameSize && <span className="min-w-max px-2 text-[9px] leading-4 text-white/42">当前 {frameSize.width}×{frameSize.height}<br /><b className="font-semibold text-[#e5ff48]">建议 {frameSize.width * 2}×{frameSize.height * 2}</b></span>}
          <label className="mt-4 flex min-h-8 cursor-pointer items-center gap-2 rounded-[4px] bg-[#e5ff48] px-3 text-[10px] font-bold text-[#090909]">
            {uploadState?.status === "uploading" ? <LoaderCircle className="animate-spin" size={13} /> : <Upload size={13} />} 替换图片
            <input className="sr-only" type="file" accept="image/*" disabled={uploadState?.status === "uploading"} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUploadImage(file, target); }} />
          </label>
        </>
      )}

      <button className="mt-4 min-h-8 min-w-max rounded-[4px] border border-white/14 px-3 text-[10px] font-semibold text-white/52 hover:text-white" type="button" onClick={() => { onChange(offsetPath, { x: 0, y: 0 }, `${offsetPath}:reset`, false); onChange(stylePath, {}, `${stylePath}:reset`, false); }}>重置</button>
      <button className="mt-4 grid size-8 shrink-0 place-items-center rounded-[4px] text-white/46 hover:bg-white/8 hover:text-white" type="button" onClick={onClose}><X size={14} /></button>
    </div>
  );
}

function AllSectionHeightHandles({ draft, selectedTarget, onSelectTarget, onChange }) {
  const [visibleSections, setVisibleSections] = useState([]);
  const dragRef = useRef(null);
  const routeKey = window.location.search;

  useEffect(() => {
    const sections = [...document.querySelectorAll("section[data-edit-kind='style'][data-edit-layout-key]")];
    if (!sections.length) return undefined;
    const readSections = () => {
      const next = sections
        .map((element) => {
          const target = targetFromElement(element);
          const sizeElement = editableSizeElement(element, target);
          if (!target || !sizeElement) return null;
          const rect = sizeElement.getBoundingClientRect();
          return {
            element,
            sizeElement,
            target,
            left: rect.left,
            top: rect.top,
            width: rect.width,
            bottom: rect.bottom,
            height: Math.round(rect.height),
            paddingTop: Math.round(Number.parseFloat(getComputedStyle(sizeElement).paddingTop) || 0),
            paddingBottom: Math.round(Number.parseFloat(getComputedStyle(sizeElement).paddingBottom) || 0),
          };
        })
        .filter((item) => item && item.bottom > 88 && item.top < window.innerHeight - 6 && item.width > 80);
      setVisibleSections(next);
    };

    readSections();
    const observer = new ResizeObserver(readSections);
    sections.forEach((section) => observer.observe(editableSizeElement(section, targetFromElement(section)) || section));
    window.addEventListener("resize", readSections);
    window.addEventListener("scroll", readSections, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", readSections);
      window.removeEventListener("scroll", readSections, true);
    };
  }, [draft, routeKey]);

  const startResize = (item, mode, event) => {
    event.preventDefault();
    event.stopPropagation();
    const stylePath = `styleOverrides.${item.target.layoutKey}`;
    const styles = getContentValue(draft, stylePath) || {};
    dragRef.current = {
      ...item,
      styles,
      stylePath,
      handleElement: event.currentTarget,
      pointerId: event.pointerId,
      mode,
      startY: event.clientY,
      startHeight: item.height,
      startPaddingTop: item.paddingTop,
      startPaddingBottom: item.paddingBottom,
      height: item.height,
      paddingTop: item.paddingTop,
      paddingBottom: item.paddingBottom,
    };
    onSelectTarget(item.target);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const resize = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = event.clientY - drag.startY;
    if (drag.mode === "height") {
      drag.height = Math.round(Math.max(240, Math.min(1800, drag.startHeight + delta)));
      drag.sizeElement.style.setProperty("min-height", `${drag.height}px`, "important");
    } else if (drag.mode === "paddingTop") {
      drag.paddingTop = Math.round(Math.max(0, Math.min(400, drag.startPaddingTop + delta)));
      drag.sizeElement.style.setProperty("padding-top", `${drag.paddingTop}px`, "important");
    } else {
      drag.paddingBottom = Math.round(Math.max(0, Math.min(400, drag.startPaddingBottom - delta)));
      drag.sizeElement.style.setProperty("padding-bottom", `${drag.paddingBottom}px`, "important");
    }
    const rect = drag.sizeElement.getBoundingClientRect();
    setVisibleSections((current) => current.map((item) => (
      item.target.layoutKey === drag.target.layoutKey
        ? { ...item, top: rect.top, bottom: rect.bottom, height: Math.round(rect.height), paddingTop: drag.paddingTop, paddingBottom: drag.paddingBottom }
        : item
    )));
  };

  const finishResize = (event) => {
    const drag = dragRef.current;
    if (!drag || (event.pointerId != null && drag.pointerId !== event.pointerId)) return;
    drag.handleElement.releasePointerCapture?.(drag.pointerId);
    dragRef.current = null;
    const key = drag.mode;
    onChange(drag.stylePath, { ...drag.styles, [key]: drag[key] }, `${drag.stylePath}:${key}`, false);
  };

  useEffect(() => {
    const handleMove = (event) => resize(event);
    const handleFinish = (event) => finishResize(event);
    document.addEventListener("pointermove", handleMove, true);
    document.addEventListener("pointerup", handleFinish, true);
    document.addEventListener("pointercancel", handleFinish, true);
    return () => {
      document.removeEventListener("pointermove", handleMove, true);
      document.removeEventListener("pointerup", handleFinish, true);
      document.removeEventListener("pointercancel", handleFinish, true);
    };
  });

  return visibleSections.flatMap((item) => {
    const isSelected = selectedTarget?.layoutKey === item.target.layoutKey;
    const centerLeft = Math.max(item.left + 12, Math.min(item.left + item.width - 74, item.left + item.width / 2 - 31));
    const edgeLeft = Math.max(item.left + 12, Math.min(item.left + item.width - 74, item.left + 18));
    const controls = [];
    const topPaddingPosition = item.top + item.paddingTop;
    const bottomPaddingPosition = item.bottom - item.paddingBottom;

    if (item.paddingTop > 0 && topPaddingPosition > 88 && topPaddingPosition < window.innerHeight - 6) {
      controls.push(
        <button
          key={`${item.target.layoutKey}-padding-top`}
          data-editor-panel
          className={`editor-section-spacing-handle fixed z-[87] flex h-7 min-w-[62px] cursor-ns-resize items-center justify-center gap-1 rounded-[5px] border px-2 text-[9px] font-semibold shadow-lg ${isSelected ? "border-[#e5ff48] bg-[#0a0d0c] text-[#e5ff48]" : "border-white/18 bg-[#0a0d0c]/92 text-white/72 hover:border-[#e5ff48] hover:text-[#e5ff48]"}`}
          style={{ left: edgeLeft, top: topPaddingPosition - 14 }}
          type="button"
          title={`${item.target.label}：拖动调整上留白`}
          aria-label={`${item.target.label}，上留白 ${item.paddingTop}px，拖动调整`}
          onPointerDown={(event) => startResize(item, "paddingTop", event)}
        >
          <MoveVertical size={12} /> 上 {item.paddingTop}
        </button>,
      );
    }

    if (item.paddingBottom > 0 && bottomPaddingPosition > 88 && bottomPaddingPosition < window.innerHeight - 6) {
      controls.push(
        <button
          key={`${item.target.layoutKey}-padding-bottom`}
          data-editor-panel
          className={`editor-section-spacing-handle fixed z-[87] flex h-7 min-w-[62px] cursor-ns-resize items-center justify-center gap-1 rounded-[5px] border px-2 text-[9px] font-semibold shadow-lg ${isSelected ? "border-[#e5ff48] bg-[#0a0d0c] text-[#e5ff48]" : "border-white/18 bg-[#0a0d0c]/92 text-white/72 hover:border-[#e5ff48] hover:text-[#e5ff48]"}`}
          style={{ left: edgeLeft, top: bottomPaddingPosition - 14 }}
          type="button"
          title={`${item.target.label}：拖动调整下留白`}
          aria-label={`${item.target.label}，下留白 ${item.paddingBottom}px，拖动调整`}
          onPointerDown={(event) => startResize(item, "paddingBottom", event)}
        >
          <MoveVertical size={12} /> 下 {item.paddingBottom}
        </button>,
      );
    }

    if (item.bottom > 88 && item.bottom < window.innerHeight - 6) controls.push(
      <button
        key={`${item.target.layoutKey}-height`}
        data-editor-panel
        className={`editor-section-height-handle fixed z-[87] flex h-7 min-w-[62px] cursor-ns-resize items-center justify-center gap-1 rounded-[5px] border px-2 text-[9px] font-semibold shadow-lg ${isSelected ? "border-[#e5ff48] bg-[#e5ff48] text-[#090909]" : "border-white/18 bg-[#0a0d0c]/92 text-white/72 hover:border-[#e5ff48] hover:text-[#e5ff48]"}`}
        style={{ left: centerLeft, top: item.bottom - 14 }}
        type="button"
        title={`${item.target.label}：拖动调整板块高度`}
        aria-label={`${item.target.label}，当前高度 ${item.height}px，拖动调整板块高度`}
        onPointerDown={(event) => startResize(item, "height", event)}
      >
        <MoveVertical size={12} /> {item.height}
      </button>,
    );
    return controls;
  });
}

function StatusLine({ cloudStatus, draftStatus, hasChanges, isUploading }) {
  let label = cloudStatus === "online" ? "Supabase 已连接" : cloudStatus === "connecting" ? "正在连接 Supabase" : "云端连接异常";
  let tone = cloudStatus === "online" ? "text-[#e5ff48]" : "text-amber-200";

  if (isUploading) {
    label = "图片上传中";
    tone = "text-[#e5ff48]";
  } else if (draftStatus === "saving") {
    label = "正在保存草稿";
    tone = "text-white/58";
  } else if (draftStatus === "saved" && hasChanges) {
    label = "草稿已自动保存";
    tone = "text-[#e5ff48]";
  } else if (draftStatus === "error") {
    label = "草稿保存失败";
    tone = "text-red-200";
  } else if (draftStatus === "published") {
    label = "发布成功";
    tone = "text-[#e5ff48]";
  } else if (draftStatus === "publish-error") {
    label = "发布失败，草稿仍在本机";
    tone = "text-red-200";
  } else if (hasChanges) {
    label = "有未发布修改";
    tone = "text-amber-200";
  }

  return <p className={`text-[10px] font-semibold ${tone}`}>{label}</p>;
}

function GalleryEditor({ galleryPath, draft, selectedTarget, onSelectTarget, onChange, onUploadImage }) {
  const images = getContentValue(draft, galleryPath) || [];
  const [dragIndex, setDragIndex] = useState(null);

  const moveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= images.length || fromIndex === toIndex) return;
    const next = [...images];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(galleryPath, next, `${galleryPath}:reorder`, false);
  };

  const removeImage = (index) => {
    const next = images.filter((_, imageIndex) => imageIndex !== index);
    onChange(galleryPath, next, `${galleryPath}:remove`, false);
    if (selectedTarget?.path === `${galleryPath}.${index}`) onSelectTarget(null);
  };

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-white">二级页图库</p>
          <p className="mt-1 text-[10px] text-white/38">拖动排序，或使用箭头调整顺序</p>
        </div>
        <label className="grid size-9 cursor-pointer place-items-center rounded-[5px] border border-white/15 text-white/58 hover:border-[#e5ff48] hover:text-[#e5ff48]" title="添加图库图片">
          <ImagePlus size={16} />
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onUploadImage(file, {
                  path: `${galleryPath}.${images.length}`,
                  kind: "image",
                  label: `图库图片 ${images.length + 1}`,
                  section: selectedTarget?.section || "二级页图库",
                  galleryPath,
                });
              }
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {images.length ? (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => {
            const path = `${galleryPath}.${index}`;
            const isSelected = selectedTarget?.path === path;
            return (
              <div
                key={`${image}-${index}`}
                className={`group relative overflow-hidden rounded-[5px] border bg-[#101215] ${isSelected ? "border-[#e5ff48]" : "border-white/12"}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) moveImage(dragIndex, index);
                  setDragIndex(null);
                }}
              >
                <button
                  className="block aspect-video w-full overflow-hidden"
                  type="button"
                  onClick={() => onSelectTarget({ path, kind: "image", label: `图库图片 ${index + 1}`, section: selectedTarget?.section || "二级页图库", galleryPath })}
                >
                  <img className="h-full w-full object-cover" src={image} alt="" />
                </button>
                <div className="flex items-center justify-between border-t border-white/10 px-1 py-1">
                  <span className="pl-1 font-mono text-[9px] text-white/38">{String(index + 1).padStart(2, "0")}</span>
                  <div className="flex">
                    <button className="grid size-7 place-items-center text-white/42 hover:text-white disabled:opacity-20" type="button" disabled={index === 0} title="向前移动" onClick={() => moveImage(index, index - 1)}>
                      <ArrowUp size={13} />
                    </button>
                    <button className="grid size-7 place-items-center text-white/42 hover:text-white disabled:opacity-20" type="button" disabled={index === images.length - 1} title="向后移动" onClick={() => moveImage(index, index + 1)}>
                      <ArrowDown size={13} />
                    </button>
                    <button className="grid size-7 place-items-center text-white/42 hover:text-red-300" type="button" title="删除图片" onClick={() => removeImage(index)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-white/14 px-4 py-6 text-center text-xs text-white/38">暂时没有图库图片</div>
      )}
    </div>
  );
}

function ImageInspector({ target, draft, publishedContent, uploadState, onChange, onUploadImage, onSelectTarget }) {
  const value = getContentValue(draft, target.path) || "";
  const publishedValue = getContentValue(publishedContent, target.path) || "";
  const requirement = imageRequirement(target.path);
  const galleryPath = target.galleryPath || inferGalleryPath(target.path);
  const restoreValue = uploadState?.previousValue ?? publishedValue;
  const [dimensions, setDimensions] = useState(null);
  const [frameSize, setFrameSize] = useState(null);

  useEffect(() => setDimensions(null), [target.path, value]);
  useEffect(() => {
    const readFrameSize = () => {
      const element = [...document.querySelectorAll("[data-edit-layout-key]")].find(
        (candidate) => candidate.dataset.editLayoutKey === target.layoutKey,
      );
      if (!element) return setFrameSize(null);
      const frame = element.closest("[class*='image'], figure, picture") || element;
      const rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return setFrameSize(null);
      setFrameSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };
    readFrameSize();
    window.addEventListener("resize", readFrameSize);
    return () => window.removeEventListener("resize", readFrameSize);
  }, [target.layoutKey, value]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[6px] border border-white/14 bg-[#111317]">
        <div className="grid aspect-video place-items-center overflow-hidden bg-[linear-gradient(135deg,#15181c,#0c0e11)]">
          {value ? (
            <img
              className="max-h-full max-w-full object-contain"
              src={value}
              alt="当前图片预览"
              onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            />
          ) : (
            <ImagePlus size={28} className="text-white/20" />
          )}
        </div>
        <div className="space-y-1 border-t border-white/10 px-3 py-3">
          <p className="truncate text-xs font-semibold text-white/72">{fileNameFromUrl(value)}</p>
          <p className="text-[10px] text-white/38">
            {dimensions ? `${dimensions.width} × ${dimensions.height} px` : "尺寸读取中"}
            {uploadState?.fileSize ? ` · ${formatFileSize(uploadState.fileSize)}` : ""}
          </p>
          <p className="text-[10px] text-white/38">{requirement.label}</p>
          {frameSize && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              <div>
                <p className="text-[9px] font-semibold text-white/30">当前图片框</p>
                <p className="mt-1 font-mono text-[11px] text-white/72">{frameSize.width} × {frameSize.height}px</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-white/30">建议上传尺寸</p>
                <p className="mt-1 font-mono text-[11px] text-[#e5ff48]">{frameSize.width * 2} × {frameSize.height * 2}px</p>
              </div>
              <p className="col-span-2 text-[10px] text-white/38">比例约 {(frameSize.width / frameSize.height).toFixed(2)} : 1，按建议尺寸导出可兼顾清晰度与加载速度。</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-l-2 border-white/16 bg-white/[0.035] px-3 py-2.5">
        <p className="text-[9px] font-semibold uppercase text-white/30">当前位置</p>
        <p className="mt-1 text-xs leading-5 text-white/68">{targetLocation(target)}</p>
      </div>

      {uploadState?.warning && (
        <div className="flex gap-2 border-l-2 border-amber-300 bg-amber-200/6 px-3 py-2 text-xs leading-5 text-amber-100">
          <CircleAlert className="mt-0.5 shrink-0" size={14} /> {uploadState.warning}
        </div>
      )}
      {uploadState?.error && (
        <div className="border-l-2 border-red-300 bg-red-300/6 px-3 py-2 text-xs leading-5 text-red-200">
          <div className="flex gap-2">
            <CircleAlert className="mt-0.5 shrink-0" size={14} /> {uploadState.error}
          </div>
          {uploadState.file && (
            <button className="mt-2 min-h-8 rounded-[4px] border border-red-200/28 px-3 text-[10px] font-semibold text-red-100 hover:bg-red-200/8" type="button" onClick={() => onUploadImage(uploadState.file, target)}>
              重试上传
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <label className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[5px] border text-xs font-semibold ${uploadState?.status === "uploading" ? "cursor-wait border-white/10 text-white/32" : "border-[#e5ff48]/55 text-[#e5ff48] hover:bg-[#e5ff48]/8"}`}>
          {uploadState?.status === "uploading" ? <LoaderCircle className="animate-spin" size={15} /> : <Upload size={15} />}
          {uploadState?.status === "uploading" ? "上传中" : "替换这张图片"}
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            disabled={uploadState?.status === "uploading"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploadImage(file, { ...target, galleryPath });
              event.target.value = "";
            }}
          />
        </label>
        <button
          className="grid size-11 place-items-center rounded-[5px] border border-white/14 text-white/48 hover:border-white/34 hover:text-white disabled:opacity-30"
          type="button"
          title="恢复上一张图片"
          disabled={!restoreValue || value === restoreValue}
          onClick={() => onChange(target.path, restoreValue, `${target.path}:restore`, false)}
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <details className="border-t border-white/10 pt-3">
        <summary className="cursor-pointer text-[10px] font-semibold text-white/42">高级设置：图片 URL</summary>
        <div className="mt-3">
          <EditorField label="图片链接" value={value} onChange={(nextValue) => onChange(target.path, nextValue, target.path)} />
        </div>
      </details>

      {galleryPath && (
        <GalleryEditor
          galleryPath={galleryPath}
          draft={draft}
          selectedTarget={target}
          onSelectTarget={onSelectTarget}
          onChange={onChange}
          onUploadImage={onUploadImage}
        />
      )}
    </div>
  );
}

const GROUP_SCHEMAS = [
  {
    pattern: /^career\.items\.\d+$/,
    fields: [
      ["index", "序号"], ["period", "工作时间"], ["company", "公司名称"], ["meta", "公司性质 / 职位"],
      ["responsibilities", "工作内容", true], ["projectTitle", "重点项目名称"], ["projectDescription", "重点项目介绍", true], ["moreDetails", "更多信息", true],
    ],
    image: ["logo", "公司 Logo"],
  },
  {
    pattern: /^projects\.catalogItems\.\d+$/,
    fields: [["index", "序号"], ["category", "分类标签"], ["title", "作品标题"], ["description", "作品简介", true]],
    image: ["image", "16:9 封面"],
    gallery: "gallery",
  },
  {
    pattern: /^projects\.latestItems\.\d+$/,
    fields: [["category", "分类标签"], ["title", "案例标题"], ["description", "案例说明", true]],
    image: ["image", "4:3 最新案例图片"],
  },
  {
    pattern: /^projects\.mosaicItems\.\d+$/,
    fields: [["index", "序号"], ["category", "分类标签"], ["title", "作品标题"], ["description", "作品简介", true]],
    image: ["image", "拼贴图片"],
  },
  {
    pattern: /^projects\.visualItems\.\d+$/,
    fields: [["category", "分类标签"], ["title", "作品标题"]],
    image: ["image", "1:1 视觉样本"],
  },
  {
    pattern: /^projects\.contactItems\.\d+$/,
    fields: [["title", "关联项目名称"]],
    image: ["image", "联系页独立图片"],
  },
  {
    pattern: /^blog\.items\.\d+$/,
    fields: [["category", "分类"], ["title", "标题", true], ["meta", "副标签"]],
    image: ["asset", "卡片封面"],
    gallery: "gallery",
  },
  {
    pattern: /^resume\.items\.\d+$/,
    fields: [["step", "序号"], ["title", "标题"], ["description", "描述", true]],
    image: ["asset", "详情页封面"],
    gallery: "gallery",
  },
];

function GroupInspector({ target, draft, publishedContent, uploadStates, onChange, onUploadImage, onSelectTarget }) {
  const schema = GROUP_SCHEMAS.find((candidate) => candidate.pattern.test(target.path));
  if (!schema) return <p className="text-sm leading-7 text-white/48">请选择具体文字或图片进行编辑。</p>;

  const imagePath = schema.image ? `${target.path}.${schema.image[0]}` : "";
  const galleryPath = schema.gallery ? `${target.path}.${schema.gallery}` : "";

  return (
    <div className="space-y-4">
      {schema.fields.map(([field, label, multiline]) => {
        const path = `${target.path}.${field}`;
        return (
          <EditorField
            key={path}
            label={label}
            multiline={Boolean(multiline)}
            value={getContentValue(draft, path)}
            onChange={(value) => onChange(path, value, path)}
          />
        );
      })}
      {imagePath && (
        <div className="border-t border-white/10 pt-4">
          <p className="mb-3 text-xs font-semibold text-white">{schema.image[1]}</p>
          <ImageInspector
            target={{ ...target, path: imagePath, kind: "image", label: schema.image[1], galleryPath }}
            draft={draft}
            publishedContent={publishedContent}
            uploadState={uploadStates[imagePath]}
            onChange={onChange}
            onUploadImage={onUploadImage}
            onSelectTarget={onSelectTarget}
          />
        </div>
      )}
      {!imagePath && galleryPath && (
        <GalleryEditor galleryPath={galleryPath} draft={draft} selectedTarget={target} onSelectTarget={onSelectTarget} onChange={onChange} onUploadImage={onUploadImage} />
      )}
    </div>
  );
}

function buildStructure(content) {
  return [
    {
      id: "top",
      label: "首页",
      items: [
        { path: "brand", kind: "text", label: "品牌名称", section: "首页" },
        { path: "logoImage", kind: "image", label: "Logo", section: "首页" },
        { path: "eyebrow", kind: "text", label: "首页身份标签", section: "首页" },
        { path: "headline", kind: "text", label: "首页主标题", section: "首页" },
        { path: "description", kind: "text", label: "首页简介", section: "首页", multiline: true },
      ],
    },
    {
      id: "latest-cases",
      label: "最新案例推荐",
      items: [
        { path: "projects.latestTitleLead", kind: "text", label: "大标题", section: "最新案例推荐" },
        { path: "projects.latestTitleAccent", kind: "text", label: "强调标题", section: "最新案例推荐" },
        { path: "projects.latestDescription", kind: "text", label: "板块说明", section: "最新案例推荐", multiline: true },
        ...(content.projects?.latestItems || []).map((item, index) => ({ path: `projects.latestItems.${index}`, kind: "group", label: item.title || `最新案例 ${index + 1}`, section: "最新案例推荐" })),
      ],
    },
    {
      id: "about",
      label: "关于我",
      items: [
        { path: "about.image", kind: "image", label: "人物图片", section: "关于我", galleryPath: "about.gallery" },
        { path: "about.title", kind: "text", label: "个人介绍标题", section: "关于我", multiline: true },
        { path: "about.bio", kind: "text", label: "个人简介", section: "关于我", multiline: true },
        { path: "about.email", kind: "text", label: "邮箱", section: "关于我" },
        { path: "about.wechat", kind: "text", label: "微信号", section: "关于我" },
        { path: "about.location", kind: "text", label: "地点", section: "关于我" },
      ],
    },
    {
      id: "experience",
      label: "工作履历",
      items: [
        { path: "career.title", kind: "text", label: "板块标题", section: "工作履历", multiline: true },
        { path: "career.description", kind: "text", label: "板块简介", section: "工作履历", multiline: true },
        ...(content.career?.items || []).map((item, index) => ({ path: `career.items.${index}`, kind: "group", label: item.company || `工作履历 ${index + 1}`, section: "工作履历" })),
      ],
    },
    {
      id: "projects",
      label: "优秀作品",
      items: [
        { path: "projects.title", kind: "text", label: "板块标题", section: "优秀作品", multiline: true },
        { path: "projects.subtitle", kind: "text", label: "中文翻译", section: "优秀作品" },
        { path: "projects.description", kind: "text", label: "板块简介", section: "优秀作品", multiline: true },
        ...(content.projects?.mosaicItems || []).map((item, index) => ({ path: `projects.mosaicItems.${index}`, kind: "group", label: item.title || `拼贴作品 ${index + 1}`, section: "优秀作品" })),
        ...(content.projects?.catalogItems || []).map((item, index) => ({ path: `projects.catalogItems.${index}`, kind: "group", label: item.title || `作品 ${index + 1}`, section: "优秀作品" })),
      ],
    },
    {
      id: "strengths",
      label: "个人优势",
      items: [
        { path: "blog.title", kind: "text", label: "优势板块标题", section: "个人优势", multiline: true },
        { path: "blog.description", kind: "text", label: "优势板块简介", section: "个人优势", multiline: true },
        ...(content.blog?.items || []).map((item, index) => ({ path: `blog.items.${index}`, kind: "group", label: item.title || `优势卡片 ${index + 1}`, section: "个人优势" })),
        ...(content.resume?.items || []).map((item, index) => ({ path: `resume.items.${index}`, kind: "group", label: item.title || `能力 ${index + 1}`, section: "能力列表" })),
      ],
    },
    {
      id: "visual-range",
      label: "视觉作品",
      items: (content.projects?.visualItems || []).map((item, index) => ({ path: `projects.visualItems.${index}`, kind: "group", label: item.title || `视觉样本 ${index + 1}`, section: "视觉作品" })),
    },
    {
      id: "contact",
      label: "联系方式",
      items: [
        { path: "about.bio", kind: "text", label: "联系页简介", section: "联系方式", multiline: true },
        { path: "about.email", kind: "text", label: "邮箱", section: "联系方式" },
        { path: "about.wechat", kind: "text", label: "微信号", section: "联系方式" },
        { path: "about.location", kind: "text", label: "地点", section: "联系方式" },
        ...(content.projects?.contactItems || []).map((item, index) => ({ path: `projects.contactItems.${index}`, kind: "group", label: item.title || `联系页图片 ${index + 1}`, section: "联系方式" })),
      ],
    },
  ];
}

function StructurePanel({ draft, selectedTarget, onSelectTarget }) {
  const sections = useMemo(() => buildStructure(draft), [draft]);

  const chooseTarget = (target, sectionId) => {
    onSelectTarget(target);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <details key={section.id} className="border border-white/10" open={section.items.some((item) => item.path === selectedTarget?.path)}>
          <summary className="cursor-pointer px-3 py-3 text-xs font-semibold text-white/74">{section.label}</summary>
          <div className="border-t border-white/10 p-1.5">
            {section.items.map((item) => (
              <button
                key={`${section.id}-${item.path}`}
                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-[4px] px-3 text-left text-xs transition-colors ${selectedTarget?.path === item.path ? "bg-[#e5ff48]/12 text-[#e5ff48]" : "text-white/52 hover:bg-white/[0.045] hover:text-white"}`}
                type="button"
                onClick={() => chooseTarget(item, section.id)}
              >
                <span className="truncate">{item.label}</span>
                <span className="font-mono text-[9px] text-white/24">{item.kind === "image" ? "IMG" : item.kind === "group" ? "SET" : "TXT"}</span>
              </button>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function CurrentInspector({ target, draft, publishedContent, uploadStates, onChange, onUploadImage, onUploadFont, onSelectTarget }) {
  if (!target) {
    return (
      <div className="grid min-h-72 place-items-center border border-dashed border-white/12 px-8 text-center">
        <div>
          <MousePointer2 className="mx-auto text-[#e5ff48]" size={24} />
          <p className="mt-4 text-sm font-semibold text-white">点击左侧页面内容</p>
          <p className="mt-2 text-xs leading-6 text-white/42">选择文字、图片或作品卡片后，这里只显示对应的编辑项。</p>
        </div>
      </div>
    );
  }

  let contentInspector = null;
  if (target.kind === "group") {
    contentInspector = <GroupInspector target={target} draft={draft} publishedContent={publishedContent} uploadStates={uploadStates} onChange={onChange} onUploadImage={onUploadImage} onSelectTarget={onSelectTarget} />;
  } else if (target.kind === "image") {
    contentInspector = (
      <ImageInspector target={target} draft={draft} publishedContent={publishedContent} uploadState={uploadStates[target.path]} onChange={onChange} onUploadImage={onUploadImage} onSelectTarget={onSelectTarget} />
    );
  } else if (target.kind !== "style") {
    const storedValue = getContentValue(draft, target.path);
    const editableValue = storedValue === undefined && target.autoText ? target.originalValue : storedValue;
    contentInspector = (
      <div className="space-y-3">
        <EditorField label={target.label} value={editableValue} multiline={target.multiline || String(editableValue || "").length > 72} onChange={(value) => onChange(target.path, value, target.path)} />
        <button className="flex min-h-10 w-full items-center justify-center gap-2 rounded-[5px] border border-red-300/24 text-[11px] font-semibold text-red-200/72 hover:border-red-300/60 hover:text-red-100" type="button" onClick={() => onChange(target.path, "", `delete:${target.path}`, false)}>
          <Trash2 size={14} /> 删除这段文字
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ElementLayoutInspector target={target} draft={draft} onChange={onChange} onUploadFont={onUploadFont} />
      {contentInspector}
    </div>
  );
}

export default function ContentEditorV2({
  isOpen,
  onOpen,
  onClose,
  session,
  isUnlocked,
  cloudStatus,
  onSignIn,
  onSignOut,
  editorMode,
  onEditorModeChange,
  draft,
  publishedContent,
  selectedTarget,
  onSelectTarget,
  recoverableDraft,
  onRestoreDraft,
  onDiscardStoredDraft,
  hasChanges,
  draftStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onChange,
  onUploadImage,
  onUploadFont,
  uploadStates,
  onPublish,
  onDiscardChanges,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [notice, setNotice] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const isUploading = Object.values(uploadStates).some((state) => state.status === "uploading");

  useEffect(() => {
    if (!isOpen || !isUnlocked) return undefined;
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
      }
      if (event.key === "Escape") {
        if (selectedTarget) onSelectTarget(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUnlocked, onClose, onRedo, onSelectTarget, onUndo, selectedTarget]);

  useEffect(() => {
    if (selectedTarget) setActiveTab("current");
  }, [selectedTarget]);

  useEffect(() => {
    if (!isOpen || selectedTarget || !window.matchMedia("(max-width: 767px)").matches) return;
    setActiveTab("structure");
  }, [isOpen, selectedTarget]);

  useEffect(() => {
    if (draftStatus === "saving") setNotice(null);
  }, [draftStatus]);

  const unlock = async (event) => {
    event.preventDefault();
    setIsAuthenticating(true);
    setAuthError("");
    try {
      await onSignIn(email.trim(), password);
      setPassword("");
      onEditorModeChange("edit");
    } catch {
      setAuthError("登录失败，请检查邮箱和密码。\n");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const publish = async () => {
    setIsPublishing(true);
    setNotice(null);
    try {
      const result = await onPublish();
      setNotice({ message: result.message, success: result.success });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      {!isOpen && <button
        className="cursor-target fixed bottom-5 right-5 z-30 flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/64 px-4 text-[11px] font-bold text-white shadow-2xl backdrop-blur-md transition-colors hover:border-[#e5ff48] hover:text-[#e5ff48]"
        type="button"
        title={session ? "解锁页面编辑" : "登录管理员账号并解锁编辑"}
        aria-label={session ? "解锁页面编辑" : "登录页面编辑"}
        onClick={onOpen}
      >
        {session ? <LockKeyhole size={16} /> : <Settings size={16} />}
        <span>{session ? "解锁编辑" : "登录编辑"}</span>
      </button>}

      {isOpen && isUnlocked && (
        <div data-editor-panel className="editor-inline-toolbar fixed left-1/2 top-3 z-[90] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-1 rounded-[8px] border border-white/16 bg-[#080b0a]/94 p-1.5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <span className="hidden px-2 text-[10px] font-semibold text-[#e5ff48] sm:block">页面编辑已解锁</span>
          <button className={`flex min-h-9 items-center gap-2 rounded-[5px] px-3 text-[11px] font-semibold ${editorMode === "edit" ? "bg-white/12 text-white" : "text-white/46"}`} type="button" onClick={() => onEditorModeChange("edit")}>
            <MousePointer2 size={14} /> 编辑
          </button>
          <button className={`flex min-h-9 items-center gap-2 rounded-[5px] px-3 text-[11px] font-semibold ${editorMode === "preview" ? "bg-white/12 text-white" : "text-white/46"}`} type="button" onClick={() => onEditorModeChange("preview")}>
            <Eye size={14} /> 预览
          </button>
          <button className="grid size-9 place-items-center rounded-[5px] text-white/52 hover:bg-white/8 hover:text-white disabled:opacity-25" type="button" title="撤销 Ctrl+Z" disabled={!canUndo} onClick={onUndo}><Undo2 size={15} /></button>
          <button className="grid size-9 place-items-center rounded-[5px] text-white/52 hover:bg-white/8 hover:text-white disabled:opacity-25" type="button" title="重做 Ctrl+Shift+Z" disabled={!canRedo} onClick={onRedo}><Redo2 size={15} /></button>
          <button className="flex min-h-9 items-center gap-2 rounded-[5px] bg-[#e5ff48] px-3 text-[11px] font-bold text-[#090909] disabled:opacity-35" type="button" disabled={!hasChanges || isUploading || isPublishing} onClick={publish}>
            {isPublishing ? <LoaderCircle className="animate-spin" size={14} /> : <Save size={14} />} 发布
          </button>
          <button className="grid size-9 place-items-center rounded-[5px] text-white/52 hover:bg-white/8 hover:text-red-200 disabled:opacity-25" type="button" title="放弃未发布修改" disabled={!hasChanges || isUploading || isPublishing} onClick={onDiscardChanges}><RotateCcw size={15} /></button>
          <button className="grid size-9 place-items-center rounded-[5px] text-white/52 hover:bg-white/8 hover:text-white" type="button" title="锁定编辑工具" aria-label="锁定页面编辑" onClick={onClose}><LockKeyhole size={15} /></button>
          <button className="grid size-9 place-items-center rounded-[5px] text-white/52 hover:bg-white/8 hover:text-red-200" type="button" title="退出管理员账号" onClick={onSignOut}><LogOut size={15} /></button>
        </div>
      )}

      {isOpen && isUnlocked && recoverableDraft && (
        <div data-editor-panel className="fixed left-1/2 top-16 z-[89] flex -translate-x-1/2 items-center gap-2 rounded-[6px] border border-[#e5ff48]/24 bg-[#0a0d0c]/96 p-2 shadow-xl backdrop-blur-xl">
          <span className="px-2 text-[10px] text-white/54">检测到 {formatDraftTime(recoverableDraft.savedAt)} 的未发布草稿</span>
          <button className="min-h-8 rounded-[4px] bg-[#e5ff48] px-3 text-[10px] font-bold text-[#090909]" type="button" onClick={onRestoreDraft}>恢复</button>
          <button className="min-h-8 rounded-[4px] border border-white/14 px-3 text-[10px] font-semibold text-white/52" type="button" onClick={onDiscardStoredDraft}>放弃</button>
        </div>
      )}

      {isOpen && !isUnlocked && !session && (
        <section
          data-editor-panel
          className="editor-panel-v2 fixed left-1/2 top-1/2 z-[100] flex w-[min(420px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[8px] border border-white/18 bg-[#0a0d0c]/98 text-white shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
          aria-label="解锁页面编辑"
        >
          <header className="shrink-0 border-b border-white/10 bg-[#0b0f0d] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[5px] border border-[#e5ff48]/26 bg-[#e5ff48]/8 text-[#e5ff48]">
                  <Settings size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">内容编辑器</p>
                  <StatusLine cloudStatus={cloudStatus} draftStatus={draftStatus} hasChanges={hasChanges} isUploading={isUploading} />
                </div>
              </div>
              <div className="flex items-center">
                {session && (
                  <button className="grid size-9 place-items-center text-white/46 hover:text-white" type="button" title="退出登录" onClick={onSignOut}>
                    <LogOut size={16} />
                  </button>
                )}
                <button className="grid size-9 place-items-center text-white/64 hover:text-white" type="button" title="关闭编辑器" onClick={onClose}>
                  <X size={18} />
                </button>
              </div>
            </div>

          </header>

            <form className="flex flex-1 flex-col justify-center overflow-y-auto p-6" onSubmit={unlock}>
              <LockKeyhole size={26} className="text-[#e5ff48]" />
              <h2 className="mt-5 text-2xl font-bold">管理员登录</h2>
              <p className="mt-2 text-sm leading-6 text-white/48">登录后可点选页面内容进行实时编辑。</p>
              <label className="mt-7 text-[11px] font-semibold text-white/56">
                邮箱
                <input className={`${FIELD_CLASS} py-3`} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="mt-4 text-[11px] font-semibold text-white/56">
                密码
                <input className={`${FIELD_CLASS} py-3`} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              {authError && <p className="mt-3 text-xs text-red-300">{authError}</p>}
              <button className="mt-5 min-h-12 rounded-[6px] bg-[#e5ff48] text-xs font-bold text-[#090909] disabled:opacity-50" type="submit" disabled={isAuthenticating || !email.trim() || !password}>
                {isAuthenticating ? "登录中..." : "登录"}
              </button>
            </form>
        </section>
      )}

      {isOpen && isUnlocked && selectedTarget && editorMode === "edit" && (
        <InlineElementToolbar target={selectedTarget} draft={draft} uploadState={uploadStates[selectedTarget.path]} onChange={onChange} onUploadImage={onUploadImage} onUploadFont={onUploadFont} onClose={() => onSelectTarget(null)} />
      )}

      {isOpen && isUnlocked && editorMode === "edit" && (
        <AllSectionHeightHandles draft={draft} selectedTarget={selectedTarget} onSelectTarget={onSelectTarget} onChange={onChange} />
      )}

    </>
  );
}
