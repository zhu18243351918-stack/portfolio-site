import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play, Settings } from "lucide-react";

function resolveDetail(detailId, content) {
  if (detailId?.startsWith("project-")) {
    const index = Number(detailId.slice("project-".length));
    const item = content.projects.items[index];
    if (!item) return null;
    return {
      type: "Project gallery",
      marker: item.index,
      title: item.title,
      description: item.description,
      meta: `${item.label} / ${item.metric}`,
      gallery: item.gallery?.length ? item.gallery : [item.asset],
      galleryHeight: item.galleryHeight || 72,
    };
  }

  if (detailId?.startsWith("blog-")) {
    const index = Number(detailId.slice("blog-".length));
    const item = content.blog.items[index];
    if (!item) return null;
    return {
      type: "Article gallery",
      marker: String(index + 1).padStart(2, "0"),
      title: item.title,
      description: content.blog.description,
      meta: `${item.category} / ${item.meta}`,
      gallery: item.gallery?.length ? item.gallery : [item.asset],
      galleryHeight: item.galleryHeight || 68,
    };
  }

  if (detailId?.startsWith("resume-")) {
    const index = Number(detailId.slice("resume-".length));
    const item = content.resume.items[index];
    if (!item) return null;
    return {
      type: "Learning path gallery",
      marker: item.step,
      title: item.title,
      description: item.description,
      meta: `${content.resume.eyebrow} / Step ${item.step}`,
      gallery: item.gallery?.length ? item.gallery : [item.asset],
      galleryHeight: item.galleryHeight || 68,
    };
  }

  if (detailId === "about") {
    return {
      type: "Personal gallery",
      marker: "01",
      title: content.about.title,
      description: content.about.bio,
      meta: `${content.about.name} / ${content.about.role}`,
      gallery: content.about.gallery?.length ? content.about.gallery : [content.about.image],
      galleryHeight: content.about.galleryHeight || 72,
    };
  }

  return null;
}

function DetailLogo({ brand, logoImage }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden bg-[#090909] font-mono text-[10px] font-black text-white">
        {logoImage ? <img className="h-full w-full object-cover" src={logoImage} alt="" /> : "A/P"}
        {!logoImage && <span className="absolute right-1 top-1 size-2 bg-[#f5ea28]" />}
      </span>
      <span className="max-w-56 truncate text-[15px] font-black text-[#090909]">{brand}</span>
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
    trackRef.current.scrollTo({
      left: trackRef.current.clientWidth * nextIndex,
      behavior: "smooth",
    });
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
    const timer = window.setInterval(() => goTo(activeIndex + 1), 4200);
    return () => window.clearInterval(timer);
  }, [activeIndex, detail, galleryLength, isPaused]);

  if (!detail) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#d9d9d5] px-4 text-[#090909]">
        <div className="frame-board w-full max-w-3xl p-0">
          <div className="module-card bg-[#f5ea28] p-8 text-[#090909] sm:p-12">
            <p className="font-jakarta text-[10px] font-black uppercase text-[#090909]/60">Gallery unavailable</p>
            <h1 className="display-rounded mt-5 text-4xl uppercase leading-[0.94] sm:text-6xl">This secondary page does not exist.</h1>
            <a className="mt-9 inline-flex min-h-11 items-center gap-2 bg-[#090909] px-5 text-sm font-black text-white" href={homeHref}>
              <ArrowLeft size={17} /> Return to portfolio
            </a>
          </div>
        </div>
      </main>
    );
  }

  const activeBackground = detail.gallery[activeIndex] || detail.gallery[0];

  return (
    <main className="relative min-h-[100dvh] overflow-x-clip bg-[#d9d9d5] text-[#090909]">
      <div className="pointer-events-none fixed inset-0 hidden opacity-20 lg:block" aria-hidden="true">
        <img className="h-full w-full scale-105 object-cover grayscale blur-[26px]" src={activeBackground} alt="" />
        <div className="absolute inset-0 bg-[#d9d9d5]/82" />
      </div>

      <header className="fixed inset-x-0 top-0 z-40 border-b-2 border-[#090909] bg-[#f7f7f2]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1540px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <a href={homeHref} aria-label="Return to portfolio">
            <DetailLogo brand={content.brand} logoImage={content.logoImage} />
          </a>
          <div className="flex items-center gap-2">
            <button
              className="grid size-10 place-items-center border-2 border-[#090909] bg-[#f5ea28] text-[#090909] md:hidden"
              type="button"
              aria-label="Edit page content"
              onClick={onEdit}
            >
              <Settings size={17} />
            </button>
            <a className="inline-flex min-h-10 items-center gap-2 border-2 border-[#090909] bg-[#090909] px-4 text-xs font-black uppercase text-white hover:bg-[#f5ea28] hover:text-[#090909]" href={homeHref}>
              <ArrowLeft size={16} /> Back
            </a>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-0 pb-0 pt-20 sm:px-5 sm:pb-10 sm:pt-24 lg:px-8 lg:pb-14 lg:pt-28">
        <div className="editorial-shell mx-auto max-w-[1500px] overflow-hidden bg-[#f7f7f2] shadow-[0_28px_90px_rgba(0,0,0,0.18)]">
          <div className="relative m-0 overflow-hidden border-[6px] border-[#090909] bg-black sm:m-3 sm:border-[10px]" style={{ height: `${detail.galleryHeight}vh`, minHeight: "430px" }}>
            <div
              ref={trackRef}
              className="gallery-track flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
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
                  className="relative h-full min-w-full snap-center"
                  data-slide-index={index}
                >
                  <img className="h-full w-full object-cover" src={image} alt={`${detail.title} slide ${index + 1}`} />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,11,9,0.38),transparent_42%)]" />
                </figure>
              ))}
            </div>

            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 sm:inset-x-6 sm:bottom-6">
              <div className="flex gap-2">
                <button className="grid size-11 place-items-center border-2 border-[#090909] bg-white text-[#090909] shadow-lg hover:bg-[#f5ea28]" type="button" aria-label="Previous image" onClick={() => goTo(activeIndex - 1)}>
                  <ChevronLeft size={19} />
                </button>
                <button className="grid size-11 place-items-center border-2 border-[#090909] bg-[#f5ea28] text-[#090909] shadow-lg hover:bg-white" type="button" aria-label={isPaused ? "Play slideshow" : "Pause slideshow"} onClick={() => setIsPaused((current) => !current)}>
                  {isPaused ? <Play size={17} /> : <Pause size={17} />}
                </button>
                <button className="grid size-11 place-items-center border-2 border-[#090909] bg-white text-[#090909] shadow-lg hover:bg-[#f5ea28]" type="button" aria-label="Next image" onClick={() => goTo(activeIndex + 1)}>
                  <ChevronRight size={19} />
                </button>
              </div>
              <span className="border-2 border-[#090909] bg-white px-4 py-3 font-jakarta text-[10px] font-black text-[#090909]">
                {String(activeIndex + 1).padStart(2, "0")} / {String(galleryLength).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="grid border-t-2 border-[#090909] lg:grid-cols-[1.18fr_0.82fr]">
            <div className="border-b-2 border-[#090909] bg-[#f7f7f2] p-6 text-[#090909] sm:p-9 lg:border-b-0 lg:border-r-2 lg:p-12">
              <p className="font-jakarta text-[10px] font-black uppercase text-[#090909]/52">{detail.type} / {detail.marker}</p>
              <h1 className="display-rounded mt-5 max-w-[14ch] text-4xl uppercase leading-[0.88] sm:text-6xl lg:text-[70px]">{detail.title}</h1>
            </div>
            <div className="flex flex-col justify-end bg-[#090909] p-6 text-white sm:p-9 lg:p-12">
              <p className="text-[10px] font-black uppercase text-[#f5ea28]">{detail.meta}</p>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/66">{detail.description}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
