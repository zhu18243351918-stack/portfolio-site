import { useEffect, useMemo, useState } from "react";
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
  MousePointer2,
  Redo2,
  RotateCcw,
  Save,
  Settings,
  Trash2,
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

  useEffect(() => setDimensions(null), [target.path, value]);

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
    image: ["image", "3:4 封面"],
    gallery: "gallery",
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
        { path: "projects.description", kind: "text", label: "板块简介", section: "优秀作品", multiline: true },
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
      id: "contact",
      label: "联系方式",
      items: [
        { path: "about.bio", kind: "text", label: "联系页简介", section: "联系方式", multiline: true },
        { path: "about.email", kind: "text", label: "邮箱", section: "联系方式" },
        { path: "about.wechat", kind: "text", label: "微信号", section: "联系方式" },
        { path: "about.location", kind: "text", label: "地点", section: "联系方式" },
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

function CurrentInspector({ target, draft, publishedContent, uploadStates, onChange, onUploadImage, onSelectTarget }) {
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

  if (target.kind === "group") {
    return <GroupInspector target={target} draft={draft} publishedContent={publishedContent} uploadStates={uploadStates} onChange={onChange} onUploadImage={onUploadImage} onSelectTarget={onSelectTarget} />;
  }

  if (target.kind === "image") {
    return (
      <ImageInspector
        target={target}
        draft={draft}
        publishedContent={publishedContent}
        uploadState={uploadStates[target.path]}
        onChange={onChange}
        onUploadImage={onUploadImage}
        onSelectTarget={onSelectTarget}
      />
    );
  }

  return (
    <EditorField
      label={target.label}
      value={getContentValue(draft, target.path)}
      multiline={target.multiline || String(getContentValue(draft, target.path) || "").length > 72}
      onChange={(value) => onChange(target.path, value, target.path)}
    />
  );
}

export default function ContentEditorV2({
  isOpen,
  onOpen,
  onClose,
  session,
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
    if (!isOpen) return undefined;
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
  }, [isOpen, onClose, onRedo, onSelectTarget, onUndo, selectedTarget]);

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
      <button
        className="cursor-target fixed bottom-5 right-5 z-30 hidden size-12 place-items-center rounded-full border border-white/20 bg-black/52 text-white shadow-2xl backdrop-blur-md transition-colors hover:border-[#e5ff48] hover:text-[#e5ff48] md:grid"
        type="button"
        title="编辑内容"
        aria-label="编辑页面内容"
        onClick={onOpen}
      >
        <Settings size={19} />
      </button>

      {isOpen && (
        <section
          data-editor-panel
          className={`editor-panel-v2 fixed bottom-3 right-3 top-3 z-[80] flex w-[min(460px,calc(100vw-24px))] flex-col overflow-hidden rounded-[8px] border border-white/18 bg-[#0a0d0c]/96 text-white shadow-[0_30px_120px_rgba(0,0,0,0.58)] ${editorMode === "preview" ? "is-preview-mode" : ""}`}
          aria-label="内容编辑器"
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

            {session && (
              <div className="mt-3 grid grid-cols-2 rounded-[6px] border border-white/12 bg-black/20 p-1">
                <button className={`flex min-h-9 items-center justify-center gap-2 rounded-[4px] text-xs font-semibold ${editorMode === "edit" ? "bg-white/10 text-white" : "text-white/42 hover:text-white"}`} type="button" onClick={() => onEditorModeChange("edit")}>
                  <MousePointer2 size={14} /> 编辑
                </button>
                <button className={`flex min-h-9 items-center justify-center gap-2 rounded-[4px] text-xs font-semibold ${editorMode === "preview" ? "bg-white/10 text-white" : "text-white/42 hover:text-white"}`} type="button" onClick={() => onEditorModeChange("preview")}>
                  <Eye size={14} /> 预览
                </button>
              </div>
            )}
          </header>

          {!session ? (
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
          ) : (
            <>
              <div className="editor-panel-content flex min-h-0 flex-1 flex-col">
                {recoverableDraft && (
                  <div className="m-3 mb-0 border border-[#e5ff48]/24 bg-[#e5ff48]/7 p-3">
                    <p className="text-xs font-semibold text-white">检测到未发布草稿</p>
                    <p className="mt-1 text-[10px] text-white/42">保存于 {formatDraftTime(recoverableDraft.savedAt)}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button className="min-h-9 rounded-[4px] bg-[#e5ff48] text-[11px] font-bold text-[#090909]" type="button" onClick={onRestoreDraft}>恢复草稿</button>
                      <button className="min-h-9 rounded-[4px] border border-white/14 text-[11px] font-semibold text-white/58" type="button" onClick={onDiscardStoredDraft}>放弃草稿</button>
                    </div>
                  </div>
                )}

                <div className="grid shrink-0 grid-cols-2 border-b border-white/10 px-3 pt-3">
                  <button className={`flex min-h-10 items-center justify-center gap-2 border-b text-xs font-semibold ${activeTab === "current" ? "border-[#e5ff48] text-white" : "border-transparent text-white/38"}`} type="button" onClick={() => setActiveTab("current")}>
                    <MousePointer2 size={14} /> 当前元素
                  </button>
                  <button className={`flex min-h-10 items-center justify-center gap-2 border-b text-xs font-semibold ${activeTab === "structure" ? "border-[#e5ff48] text-white" : "border-transparent text-white/38"}`} type="button" onClick={() => setActiveTab("structure")}>
                    <LayoutList size={14} /> 页面结构
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {editorMode === "preview" && (
                    <div className="mb-4 flex gap-3 border-l-2 border-[#e5ff48] bg-[#e5ff48]/6 px-3 py-3 text-xs leading-5 text-white/56">
                      <Eye className="mt-0.5 shrink-0 text-[#e5ff48]" size={14} /> 当前为预览模式，页面链接和轮播可以正常操作。
                    </div>
                  )}
                  {activeTab === "structure" ? (
                    <StructurePanel draft={draft} selectedTarget={selectedTarget} onSelectTarget={onSelectTarget} />
                  ) : (
                    <>
                      {selectedTarget && (
                        <div className="mb-4 border-b border-white/10 pb-3">
                          <p className="text-[10px] font-semibold text-[#e5ff48]">{selectedTarget.section}</p>
                          <h3 className="mt-1 text-base font-semibold text-white">{selectedTarget.label}</h3>
                          <p className="mt-1 truncate font-mono text-[9px] text-white/26">{selectedTarget.path}</p>
                        </div>
                      )}
                      <CurrentInspector target={selectedTarget} draft={draft} publishedContent={publishedContent} uploadStates={uploadStates} onChange={onChange} onUploadImage={onUploadImage} onSelectTarget={onSelectTarget} />
                    </>
                  )}
                </div>
              </div>

              <footer className="editor-panel-footer shrink-0 border-t border-white/10 bg-[#0b0f0d] p-3">
                {notice && (
                  <div className={`mb-3 flex items-start gap-2 text-xs leading-5 ${notice.success ? "text-white/56" : "text-red-200"}`} aria-live="polite">
                    {notice.success ? <Check className="mt-0.5 shrink-0 text-[#e5ff48]" size={14} /> : <CircleAlert className="mt-0.5 shrink-0" size={14} />}
                    {notice.message}
                  </div>
                )}
                <div className="grid grid-cols-[auto_auto_1fr] gap-2">
                  <button className="grid size-11 place-items-center rounded-[5px] border border-white/14 text-white/58 hover:text-white disabled:opacity-25" type="button" title="撤销 Ctrl+Z" disabled={!canUndo} onClick={onUndo}>
                    <Undo2 size={16} />
                  </button>
                  <button className="grid size-11 place-items-center rounded-[5px] border border-white/14 text-white/58 hover:text-white disabled:opacity-25" type="button" title="重做 Ctrl+Shift+Z" disabled={!canRedo} onClick={onRedo}>
                    <Redo2 size={16} />
                  </button>
                  <button className="flex min-h-11 items-center justify-center gap-2 rounded-[5px] bg-[#e5ff48] text-xs font-bold text-[#090909] disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={!hasChanges || isUploading || isPublishing} onClick={publish}>
                    {isPublishing ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}
                    {isPublishing ? "发布中" : "发布修改"}
                  </button>
                </div>
                <button className="mt-2 flex min-h-9 w-full items-center justify-center gap-2 text-[10px] font-semibold text-white/36 hover:text-red-200 disabled:opacity-20" type="button" disabled={!hasChanges || isUploading || isPublishing} onClick={onDiscardChanges}>
                  <RotateCcw size={13} /> 放弃全部未发布修改
                </button>
              </footer>
            </>
          )}
        </section>
      )}
    </>
  );
}
