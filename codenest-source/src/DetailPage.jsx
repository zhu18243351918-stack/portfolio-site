import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play, Settings } from "lucide-react";
import { resetSpecularEdge, steerSpecularEdge } from "./specularEdge";

function resolveDetail(detailId, content) {
  if (detailId?.startsWith("project-")) {
    const index = Number(detailId.slice("project-".length));
    const item = content.projects.items[index];
    if (!item) return null;
    return {
      type: "Selected project",
      marker: item.index,
      title: item.title,
      description: item.description,
      meta: `${item.label} / ${item.metric}`,
      gallery: item.gallery?.length ? item.gallery : [item.asset],
      galleryHeight: item.galleryHeight || 76,
    };
  }

  if (detailId?.startsWith("blog-")) {
    const index = Number(detailId.slice("blog-".length));
    const item = content.blog.items[index];
    if (!item) return null;
    return {
      type: "Design strength",
      marker: String(index + 1).padStart(2, "0"),
      title: item.title,
      description: content.blog.description,
      meta: `${item.category} / ${item.meta}`,
      gallery: item.gallery?.length ? item.gallery : [item.asset],
      galleryHeight: item.galleryHeight || 70,
    };
  }

  if (detailId?.startsWith("resume-")) {
    const index = Number(detailId.slice("resume-".length));
    const item = content.resume.items[index];
    if (!item) return null;
    return {
      type: "Capability",
      marker: item.step,
      title: item.title,
      description: item.description,
      meta: `${content.resume.eyebrow} / ${item.step}`,
      gallery: item.gallery?.length ? item.gallery : [item.asset],
      galleryHeight: item.galleryHeight || 70,
    };
  }

  if (detailId === "about") {
    return {
      type: "Profile / Experience",
      marker: "01",
      title: content.about.title,
      description: content.about.bio,
      meta: `${content.about.name} / ${content.about.role}`,
      gallery: content.about.gallery?.length ? content.about.gallery : [content.about.image],
      galleryHeight: content.about.galleryHeight || 76,
    };
  }

  return null;
}

function DetailLogo({ brand, logoImage }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[4px] border border-white/18 bg-white/7 font-mono text-[10px] font-black text-white">
        {logoImage ? <img className="h-full w-full object-cover" src={logoImage} alt="" /> : "A/P"}
        {!logoImage && <span className="absolute right-1 top-1 size-2 bg-[#e5ff48]" />}
      </span>
      <span className="max-w-56 truncate text-[14px] font-bold text-[#f1efe4]">{brand}</span>
    </span>
  );
}

export default function DetailPage({ detailId, content, onEdit }) {
  const detail = useMemo(() => resolveDetail(detailId, content), [content, detailId]);
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const galleryLength = detail?.gallery.length || 0;
  const homeHref = `${window.location.pathname}${window.location.hash.startsWith("#content=") ? window.location.hash : ""}`;

  const goTo = (index) => {
    if (!trackRef.current || !galleryLength) return;
    const nextIndex = (index + galleryLength) % galleryLength;
    trackRef.current.scrollTo({ left: trackRef.current.clientWidth * nextIndex, behavior: "smooth" });
    setActiveIndex(nextIndex);
  };

  useEffect(() => {
    if (!detail) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            setActiveIndex(Number(entry.target.dataset.slideIndex));
          }
        });
      },
      { root: trackRef.current, threshold: [0.65] },
    );
    slideRefs.current.forEach((slide) => slide && observer.observe(slide));
    return () => observer.disconnect();
  }, [detail]);

  useEffect(() => {
    if (!detail || isPaused || galleryLength < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const timer = window.setInterval(() => goTo(activeIndex + 1), 4600);
    return () => window.clearInterval(timer);
  }, [activeIndex, detail, galleryLength, isPaused]);

  if (!detail) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#08090b] px-5 text-[#efede1]">
        <div className="w-full max-w-3xl border border-white/14 bg-[#0d0f12] p-8 sm:p-12">
          <p className="text-[10px] font-bold uppercase text-[#e5ff48]">Gallery unavailable</p>
          <h1 className="display-editorial mt-5 text-4xl leading-[0.94] sm:text-6xl">This secondary page does not exist.</h1>
          <a className="cursor-target mt-9 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e5ff48] px-6 text-sm font-bold text-[#090a0c]" href={homeHref}>
            <ArrowLeft size={17} /> Return to portfolio
          </a>
        </div>
      </main>
    );
  }

  const activeBackground = detail.gallery[activeIndex] || detail.gallery[0];

  return (
    <main className="relative min-h-[100dvh] overflow-x-clip bg-[#08090b] text-[#efede1]">
      <div className="pointer-events-none fixed inset-0 opacity-22" aria-hidden="true">
        <img className="h-full w-full scale-110 object-cover grayscale blur-[32px]" src={activeBackground} alt="" />
        <div className="absolute inset-0 bg-[#08090b]/88" />
      </div>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/12 bg-[#08090b]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[84px] max-w-[1700px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a className="cursor-target" href={homeHref} aria-label="Return to portfolio">
            <DetailLogo brand={content.brand} logoImage={content.logoImage} />
          </a>
          <div className="flex items-center gap-2">
            <button className="cursor-target grid size-11 place-items-center rounded-full border border-white/18 bg-white/6 text-white md:hidden" type="button" aria-label="Edit page content" onClick={onEdit}>
              <Settings size={17} />
            </button>
            <a className="cursor-target inline-flex min-h-11 items-center gap-2 rounded-full border border-white/18 bg-white/6 px-5 text-[10px] font-bold uppercase text-white hover:border-[#e5ff48] hover:text-[#e5ff48]" href={homeHref}>
              <ArrowLeft size={15} /> Back
            </a>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-0 pb-12 pt-[84px] sm:px-8 sm:pb-16 lg:px-12 lg:pb-24 lg:pt-28">
        <div className="mx-auto max-w-[1700px]">
          <div
            className="specular-frame relative overflow-hidden border-y border-white/14 bg-[#0d0f12] sm:rounded-[6px] sm:border"
            style={{ height: `${detail.galleryHeight}vh`, minHeight: "460px", maxHeight: "980px" }}
            onPointerMove={steerSpecularEdge}
            onPointerLeave={resetSpecularEdge}
          >
            <div
              ref={trackRef}
              className="gallery-track flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
              aria-label={`${detail.title} image gallery`}
              tabIndex="0"
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") goTo(activeIndex - 1);
                if (event.key === "ArrowRight") goTo(activeIndex + 1);
              }}
            >
              {detail.gallery.map((image, index) => (
                <figure
                  key={`${image}-${index}`}
                  ref={(node) => {
                    slideRefs.current[index] = node;
                  }}
                  className="relative h-full min-w-full snap-center overflow-hidden bg-[#0b0d10]"
                  data-slide-index={index}
                >
                  <div className="absolute inset-0 grid place-items-center p-0 sm:p-4 lg:p-7">
                    <img
                      className="block h-auto w-auto max-h-full max-w-full object-contain"
                      src={image}
                      alt={`${detail.title} slide ${index + 1}`}
                    />
                  </div>
                </figure>
              ))}
            </div>

            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 sm:inset-x-6 sm:bottom-6">
              <div className="flex gap-2">
                <button className="cursor-target grid size-11 place-items-center rounded-full border border-white/20 bg-black/52 text-white backdrop-blur-md hover:border-[#e5ff48] hover:text-[#e5ff48]" type="button" aria-label="Previous image" onClick={() => goTo(activeIndex - 1)}>
                  <ChevronLeft size={18} />
                </button>
                <button className="cursor-target grid size-11 place-items-center rounded-full bg-[#e5ff48] text-[#090a0c] shadow-lg" type="button" aria-label={isPaused ? "Play slideshow" : "Pause slideshow"} onClick={() => setIsPaused((current) => !current)}>
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button className="cursor-target grid size-11 place-items-center rounded-full border border-white/20 bg-black/52 text-white backdrop-blur-md hover:border-[#e5ff48] hover:text-[#e5ff48]" type="button" aria-label="Next image" onClick={() => goTo(activeIndex + 1)}>
                  <ChevronRight size={18} />
                </button>
              </div>
              <span className="rounded-full border border-white/20 bg-black/52 px-4 py-3 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                {String(activeIndex + 1).padStart(2, "0")} / {String(galleryLength).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="grid border-b border-white/14 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="border-b border-white/14 px-5 py-10 sm:px-8 sm:py-14 lg:border-b-0 lg:border-r lg:px-12 lg:py-[72px]">
              <p className="text-[10px] font-bold uppercase text-[#e5ff48]">{detail.type} / {detail.marker}</p>
              <h1 className="display-editorial mt-5 max-w-[15ch] text-4xl leading-[0.92] sm:text-6xl lg:text-[78px]">{detail.title}</h1>
            </div>
            <div className="flex flex-col justify-end px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-[72px]">
              <p className="text-[10px] font-bold uppercase text-white/44">{detail.meta}</p>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/56">{detail.description}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
