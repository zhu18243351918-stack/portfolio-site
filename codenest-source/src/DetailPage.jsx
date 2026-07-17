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
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[#d6d8d2] font-mono text-[10px] font-black text-[#172018]">
        {logoImage ? <img className="h-full w-full object-cover" src={logoImage} alt="" /> : "A/P"}
        {!logoImage && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#cf4c3e]" />}
      </span>
      <span className="max-w-56 truncate text-[15px] font-bold text-[#ece9df]">{brand}</span>
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
      <main className="grid min-h-[100dvh] place-items-center bg-[#090c0a] px-4 text-[#ece9df]">
        <div className="frame-board w-full max-w-3xl p-0">
          <div className="module-card bg-[#cf4c3e] p-8 text-[#f5eee6] sm:p-12">
            <p className="font-jakarta text-[10px] font-black uppercase text-white/70">Gallery unavailable</p>
            <h1 className="display-rounded mt-5 text-4xl uppercase leading-[0.94] sm:text-6xl">This secondary page does not exist.</h1>
            <a className="mt-9 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ece9df] px-5 text-sm font-black text-[#172018]" href={homeHref}>
              <ArrowLeft size={17} /> Return to portfolio
            </a>
          </div>
        </div>
      </main>
    );
  }

  const activeBackground = detail.gallery[activeIndex] || detail.gallery[0];

  return (
    <main className="relative min-h-[100dvh] overflow-x-clip bg-[#090c0a] text-[#ece9df]">
      <div className="pointer-events-none fixed inset-0 hidden md:block" aria-hidden="true">
        <img className="h-full w-full scale-105 object-cover opacity-18 blur-[18px]" src={activeBackground} alt="" />
        <div className="absolute inset-0 bg-[#090c0a]/76" />
      </div>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#090c0a]/78 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1540px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <a href={homeHref} aria-label="Return to portfolio">
            <DetailLogo brand={content.brand} logoImage={content.logoImage} />
          </a>
          <div className="flex items-center gap-2">
            <button
              className="grid size-10 place-items-center rounded-full border border-white/15 text-white/68 hover:border-[#df6254] hover:text-[#df6254] md:hidden"
              type="button"
              aria-label="Edit page content"
              onClick={onEdit}
            >
              <Settings size={17} />
            </button>
            <a className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold uppercase text-white/68 hover:border-[#df6254] hover:text-[#df6254]" href={homeHref}>
              <ArrowLeft size={16} /> Back
            </a>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-3 pb-8 pt-24 sm:px-5 lg:px-7 lg:pb-14 lg:pt-28">
        <div className="frame-board mx-auto max-w-[1540px] p-0">
          <div className="module-card relative overflow-hidden bg-black/30" style={{ height: `${detail.galleryHeight}vh`, minHeight: "390px" }}>
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
                <button className="grid size-11 place-items-center rounded-full bg-[#ece9df] text-[#172018] shadow-lg hover:bg-white" type="button" aria-label="Previous image" onClick={() => goTo(activeIndex - 1)}>
                  <ChevronLeft size={19} />
                </button>
                <button className="grid size-11 place-items-center rounded-full bg-[#cf4c3e] text-[#f5eee6] shadow-lg hover:bg-[#df6254]" type="button" aria-label={isPaused ? "Play slideshow" : "Pause slideshow"} onClick={() => setIsPaused((current) => !current)}>
                  {isPaused ? <Play size={17} /> : <Pause size={17} />}
                </button>
                <button className="grid size-11 place-items-center rounded-full bg-[#ece9df] text-[#172018] shadow-lg hover:bg-white" type="button" aria-label="Next image" onClick={() => goTo(activeIndex + 1)}>
                  <ChevronRight size={19} />
                </button>
              </div>
              <span className="rounded-full bg-[#ece9df] px-4 py-3 font-jakarta text-[10px] font-black text-[#172018]">
                {String(activeIndex + 1).padStart(2, "0")} / {String(galleryLength).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="mt-2 grid gap-2 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="module-card bg-[#ece9df] p-6 text-[#172018] sm:p-9 lg:p-11">
              <p className="font-jakarta text-[10px] font-black uppercase text-[#cf4c3e]">{detail.type} / {detail.marker}</p>
              <h1 className="display-rounded mt-5 max-w-[13ch] text-4xl uppercase leading-[0.92] sm:text-6xl lg:text-[72px]">{detail.title}</h1>
            </div>
            <div className="module-card flex flex-col justify-end bg-[#415241] p-6 sm:p-9 lg:p-11">
              <p className="text-[10px] font-black uppercase text-white/48">{detail.meta}</p>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/65">{detail.description}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
