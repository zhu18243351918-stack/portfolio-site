import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

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
    <span className="flex items-center gap-3">
      <span className="relative grid size-8 place-items-center overflow-hidden border border-white/45 font-mono text-[10px] font-bold">
        {logoImage ? <img className="h-full w-full object-cover" src={logoImage} alt="" /> : "C/N"}
        {!logoImage && <span className="absolute -right-1 -top-1 size-2 bg-[#5ed29c]" />}
      </span>
      <span className="text-[15px] font-bold">{brand}</span>
    </span>
  );
}

export default function DetailPage({ detailId, content }) {
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
      <main className="grid min-h-[100dvh] place-items-center bg-[#070b0a] px-6 text-white">
        <div className="text-center">
          <p className="font-jakarta text-[11px] font-bold uppercase text-[#5ed29c]">Gallery unavailable</p>
          <h1 className="mt-4 text-4xl font-semibold">This secondary page does not exist.</h1>
          <a className="mt-8 inline-flex items-center gap-2 text-sm text-white/65 hover:text-[#5ed29c]" href={homeHref}>
            <ArrowLeft size={17} /> Return to CodeNest
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] overflow-x-clip bg-[#070b0a] text-white">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#070b0a]/75 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href={homeHref} aria-label="Return to CodeNest">
            <DetailLogo brand={content.brand} logoImage={content.logoImage} />
          </a>
          <a className="inline-flex items-center gap-2 text-xs font-bold uppercase text-white/60 hover:text-[#5ed29c]" href={homeHref}>
            <ArrowLeft size={16} /> Back
          </a>
        </div>
      </header>

      <section className="px-3 pb-12 pt-24 sm:px-5 lg:px-8 lg:pb-20 lg:pt-28">
        <div className="mx-auto max-w-[1700px] border border-white/12 bg-[#090e0c] p-2 sm:p-4 lg:p-5">
          <div className="relative overflow-hidden bg-black/30" style={{ height: `${detail.galleryHeight}vh`, minHeight: "420px" }}>
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
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,11,10,0.42),transparent_45%)]" />
                  <span className="absolute bottom-5 right-5 font-jakarta text-[11px] font-bold text-[#5ed29c]">
                    {String(index + 1).padStart(2, "0")} / {String(galleryLength).padStart(2, "0")}
                  </span>
                </figure>
              ))}
            </div>

            <div className="absolute bottom-5 left-5 flex gap-2">
              <button className="grid size-11 place-items-center border border-white/20 bg-black/30 backdrop-blur-md hover:border-[#5ed29c]" type="button" aria-label="Previous image" onClick={() => goTo(activeIndex - 1)}>
                <ChevronLeft size={19} />
              </button>
              <button className="grid size-11 place-items-center border border-white/20 bg-black/30 backdrop-blur-md hover:border-[#5ed29c]" type="button" aria-label={isPaused ? "Play slideshow" : "Pause slideshow"} onClick={() => setIsPaused((current) => !current)}>
                {isPaused ? <Play size={17} /> : <Pause size={17} />}
              </button>
              <button className="grid size-11 place-items-center border border-white/20 bg-black/30 backdrop-blur-md hover:border-[#5ed29c]" type="button" aria-label="Next image" onClick={() => goTo(activeIndex + 1)}>
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          <div className="grid gap-10 px-3 pb-6 pt-10 sm:px-5 lg:grid-cols-[1fr_0.65fr] lg:items-end lg:px-6 lg:pb-8 lg:pt-14">
            <div>
              <p className="font-jakarta text-[11px] font-bold uppercase text-[#5ed29c]">{detail.type} / {detail.marker}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[0] sm:text-6xl lg:text-[74px]">{detail.title}</h1>
            </div>
            <div className="lg:justify-self-end">
              <p className="text-[10px] font-bold uppercase text-white/35">{detail.meta}</p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">{detail.description}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
