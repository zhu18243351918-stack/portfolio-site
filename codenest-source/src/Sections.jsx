import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Mail, Play } from "lucide-react";
import { rememberHomeScrollPosition } from "./scrollPosition";

function detailHref(id) {
  const contentHash = window.location.hash.startsWith("#content=") ? window.location.hash : "";
  return `?detail=${id}${contentHash}`;
}

function SectionMarker({ children, inverse = false }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center px-3 font-jakarta text-[10px] font-black uppercase ${
        inverse ? "bg-[#f5ea28] text-[#090909]" : "bg-[#090909] text-white"
      }`}
    >
      {children}
    </span>
  );
}

function ProjectTicker({ content }) {
  const labels = content.items.flatMap((item) => [item.label, item.metric]);

  return (
    <div className="relative h-32 overflow-hidden bg-[#090909] sm:h-40" aria-hidden="true">
      <div className="ticker-strip ticker-strip-a absolute left-[-6%] top-6 flex w-[112%] rotate-[-4deg] bg-[#48dce7] text-[#090909]">
        {[...labels, ...labels].map((label, index) => (
          <span key={`cyan-${label}-${index}`} className="shrink-0 border-r-2 border-[#090909] px-7 py-3 text-sm font-black uppercase sm:px-10 sm:text-base">
            {label}
          </span>
        ))}
      </div>
      <div className="ticker-strip ticker-strip-b absolute left-[-6%] top-[72px] flex w-[112%] rotate-[3deg] bg-[#f5ea28] text-[#090909] sm:top-[92px]">
        {[...labels].reverse().concat(labels).map((label, index) => (
          <span key={`yellow-${label}-${index}`} className="shrink-0 border-r-2 border-[#090909] px-7 py-3 text-sm font-black uppercase sm:px-10 sm:text-base">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProjectTile({ tile, visualIndex, setCardRef, revealed }) {
  const layouts = [
    "sm:col-span-2 lg:col-span-7 lg:row-span-2",
    "lg:col-span-5",
    "lg:col-span-5",
    "lg:col-span-4",
    "lg:col-span-4",
    "lg:col-span-4",
  ];
  const showCopy = visualIndex === 0 || visualIndex === 2 || visualIndex === 4;

  return (
    <article
      ref={(node) => setCardRef(visualIndex, node)}
      className={`group relative min-h-[330px] overflow-hidden bg-[#171717] ${layouts[visualIndex] || "lg:col-span-4"} transition-[opacity,transform] duration-700 ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      } ${visualIndex === 0 ? "sm:min-h-[520px] lg:min-h-0" : ""}`}
      data-project-index={visualIndex}
    >
      <a
        className="block h-full min-h-[inherit]"
        href={detailHref(`project-${tile.projectIndex}`)}
        aria-label={`Open ${tile.item.title} gallery`}
        onClick={rememberHomeScrollPosition}
      >
        <img className="media-zoom absolute inset-0 h-full w-full object-cover" src={tile.image} alt={tile.item.title} />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.08)_62%,transparent_100%)]" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="bg-[#f5ea28] px-3 py-2 font-jakarta text-[10px] font-black text-[#090909]">{tile.item.index}</span>
          <span className="bg-[#090909] px-3 py-2 text-[10px] font-black uppercase text-white">{tile.item.label}</span>
        </div>
        <ArrowUpRight className="absolute right-5 top-5 text-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" size={24} />

        <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-7 sm:bottom-7">
          {showCopy ? (
            <>
              <h3 className="display-rounded max-w-[14ch] text-3xl uppercase leading-[0.9] sm:text-5xl">{tile.item.title}</h3>
              <p className="mt-4 line-clamp-2 max-w-xl text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">{tile.item.description}</p>
            </>
          ) : (
            <div className="flex items-end justify-between gap-4">
              <p className="max-w-[16ch] text-lg font-black uppercase leading-tight">{tile.item.title}</p>
              <span className="text-[10px] font-black uppercase text-[#f5ea28]">{tile.item.metric}</span>
            </div>
          )}
        </div>
      </a>
    </article>
  );
}

export function ProjectsSection({ content, size }) {
  const cardRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(() => new Set());
  const visualTiles = content.items.flatMap((item, projectIndex) => [
    { item, projectIndex, image: item.asset },
    { item, projectIndex, image: item.gallery?.[1] || item.gallery?.[0] || item.asset },
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.projectIndex);
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= 0.45) setActiveIndex(index);
            setRevealed((current) => new Set(current).add(index));
          }
        });
      },
      { threshold: [0.12, 0.45, 0.72] },
    );

    cardRefs.current.forEach((card) => card && observer.observe(card));
    return () => observer.disconnect();
  }, [content.items]);

  const setCardRef = (index, node) => {
    cardRefs.current[index] = node;
  };

  return (
    <section id="projects" className="bg-[#d9d9d5] px-0 py-0 lg:px-8 lg:py-20" style={{ minHeight: `${size}vh` }}>
      <div className="editorial-shell mx-auto max-w-[1500px] bg-[#f7f7f2]">
        <header className="grid gap-8 px-5 py-14 sm:px-9 sm:py-20 lg:grid-cols-[1.18fr_0.82fr] lg:items-end lg:px-16 lg:py-24">
          <div>
            <SectionMarker>{content.eyebrow}</SectionMarker>
            <h2 className="display-rounded mt-6 max-w-[14ch] text-5xl uppercase leading-[0.86] text-[#090909] sm:text-7xl lg:text-[82px]">
              {content.title}
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-xl text-sm leading-7 text-[#090909]/64 sm:text-base sm:leading-8">{content.description}</p>
            <nav className="mt-8 flex flex-wrap gap-2" aria-label="Project navigation">
              {content.items.map((item, index) => (
                <button
                  key={item.index}
                  className={`min-h-10 border-2 border-[#090909] px-4 text-[11px] font-black uppercase transition-colors ${
                    Math.floor(activeIndex / 2) === index ? "bg-[#f5ea28] text-[#090909]" : "bg-transparent text-[#090909] hover:bg-[#090909] hover:text-white"
                  }`}
                  type="button"
                  onClick={() => cardRefs.current[index * 2]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                >
                  {item.index} / {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <ProjectTicker content={content} />

        <div className="grid gap-1 bg-[#090909] p-1 sm:grid-cols-2 lg:auto-rows-[minmax(250px,34vh)] lg:grid-cols-12">
          {visualTiles.map((tile, visualIndex) => (
            <ProjectTile
              key={`${tile.item.index}-${visualIndex}-${tile.image}`}
              tile={tile}
              visualIndex={visualIndex}
              setCardRef={setCardRef}
              revealed={revealed.has(visualIndex)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlogSection({ content, size }) {
  const layouts = ["lg:col-span-7 lg:row-span-2", "lg:col-span-5", "lg:col-span-5"];

  return (
    <section id="blog" className="bg-[#d9d9d5] px-0 lg:px-8" style={{ minHeight: `${size}vh` }}>
      <div className="editorial-shell mx-auto max-w-[1500px] bg-[#f7f7f2] px-5 py-16 sm:px-9 sm:py-20 lg:px-16 lg:py-24">
        <div className="flex flex-col items-start gap-7 border-b-4 border-[#090909] pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionMarker inverse>{content.eyebrow}</SectionMarker>
            <h2 className="display-rounded mt-6 max-w-[13ch] text-5xl uppercase leading-[0.86] text-[#090909] sm:text-7xl lg:text-[78px]">{content.title}</h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#090909]/62 sm:text-base">{content.description}</p>
        </div>

        <div className="mt-10 grid gap-3 lg:auto-rows-[minmax(300px,34vh)] lg:grid-cols-12">
          {content.items.map((item, index) => (
            <a
              key={`${item.category}-${item.title}`}
              className={`group relative min-h-[360px] overflow-hidden bg-[#090909] ${layouts[index] || "lg:col-span-4"}`}
              href={detailHref(`blog-${index}`)}
              onClick={rememberHomeScrollPosition}
            >
              <img className="media-zoom absolute inset-0 h-full w-full object-cover" src={item.asset} alt={item.title} />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.04)_70%)]" />
              <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-7 sm:bottom-7">
                <p className="text-[10px] font-black uppercase text-[#f5ea28]">{item.category} / {item.meta}</p>
                <h3 className={`display-rounded mt-3 max-w-[14ch] uppercase leading-[0.9] ${index === 0 ? "text-4xl sm:text-6xl" : "text-3xl sm:text-4xl"}`}>
                  {item.title}
                </h3>
              </div>
              <span className="absolute right-5 top-5 grid size-11 place-items-center bg-[#f5ea28] text-[#090909] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
                <ArrowUpRight size={20} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResumeSection({ content, size }) {
  const aspectClasses = [
    "aspect-[4/5]",
    "aspect-square",
    "aspect-[4/3]",
    "aspect-[3/4]",
    "aspect-[4/3]",
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
  ];

  return (
    <section id="resume" className="bg-[#d9d9d5] px-0 lg:px-8" style={{ minHeight: `${size}vh` }}>
      <div className="editorial-shell mx-auto max-w-[1500px] bg-[#101010] text-white">
        <header className="grid gap-8 px-5 py-14 sm:px-9 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-16 lg:py-24">
          <div className="min-w-0">
            <SectionMarker inverse>{content.eyebrow}</SectionMarker>
            <h2 className="display-rounded mt-6 w-full max-w-[15ch] text-[34px] uppercase leading-[0.9] sm:text-6xl sm:leading-[0.86] lg:text-[70px]">{content.title}</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8 lg:justify-self-end">{content.description}</p>
        </header>

        <div className="h-2 bg-[linear-gradient(90deg,#f5ea28_0_35%,#48dce7_35%_64%,#f044c4_64%_82%,#3149ba_82%)]" />

        <div className="columns-1 gap-2 p-2 sm:columns-2 lg:columns-4">
          {content.items.map((item, index) => (
            <a
              key={item.step}
              className={`group relative mb-2 inline-block w-full break-inside-avoid overflow-hidden bg-[#222] ${aspectClasses[index % aspectClasses.length]}`}
              href={detailHref(`resume-${index}`)}
              aria-label={`Open ${item.title} gallery`}
              onClick={rememberHomeScrollPosition}
            >
              <img className="media-zoom absolute inset-0 h-full w-full object-cover" src={item.asset} alt={item.title} />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.9),transparent_64%)]" />
              <div className="absolute left-4 top-4 bg-[#f5ea28] px-3 py-2 font-jakarta text-[10px] font-black text-[#090909]">{item.step}</div>
              <ArrowUpRight className="absolute right-4 top-4 text-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" size={21} />
              <div className="absolute inset-x-5 bottom-5">
                <h3 className="display-rounded text-2xl uppercase leading-[0.92] sm:text-3xl">{item.title}</h3>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/66">{item.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection({ content, size }) {
  const previewImages = (content.gallery?.length ? content.gallery : [content.image]).slice(0, 5);
  const positions = [
    "left-[8%] top-[24%] size-16 sm:size-24",
    "right-[10%] top-[19%] size-20 sm:size-28",
    "left-[18%] bottom-[16%] size-14 sm:size-20",
    "right-[22%] bottom-[12%] size-16 sm:size-24",
    "left-[47%] top-[15%] size-12 sm:size-16",
  ];

  return (
    <section id="about" className="bg-[#d9d9d5] px-0 pb-0 lg:px-8 lg:pb-8" style={{ minHeight: `${size}vh` }}>
      <div className="editorial-shell mx-auto max-w-[1500px] bg-[#f7f7f2]">
        <a
          className="group relative block min-h-[700px] overflow-hidden bg-[#090909] sm:min-h-[820px]"
          href={detailHref("about")}
          aria-label="Open personal gallery"
          onClick={rememberHomeScrollPosition}
        >
          <img className="media-zoom absolute inset-0 h-full w-full object-cover grayscale" src={content.image} alt={content.name} />
          <div className="absolute inset-0 bg-black/56" />

          {previewImages.map((image, index) => (
            <div key={`${image}-${index}`} className={`absolute hidden overflow-hidden rounded-full border-4 border-white bg-[#d9d9d5] shadow-2xl sm:block ${positions[index]}`}>
              <img className="h-full w-full object-cover" src={image} alt="" />
            </div>
          ))}

          <div className="absolute inset-x-5 top-16 z-10 text-center text-white sm:inset-x-10 sm:top-20">
            <SectionMarker inverse>{content.eyebrow}</SectionMarker>
            <h2 className="display-rounded mx-auto mt-7 max-w-[18ch] text-[32px] uppercase leading-[0.92] sm:max-w-[14ch] sm:text-[56px] sm:leading-[0.86] lg:text-[78px]">{content.title}</h2>
          </div>

          <div className="absolute bottom-12 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center text-center text-white">
            <span className="grid size-20 place-items-center rounded-full bg-[#f5ea28] text-[#090909] transition-transform duration-300 group-hover:scale-105">
              <Play size={26} fill="currentColor" />
            </span>
            <p className="mt-5 text-sm font-black uppercase">{content.name}</p>
            <p className="mt-2 text-xs text-white/62">{content.role}</p>
          </div>
        </a>

        <div className="grid gap-10 px-5 py-14 sm:px-9 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-16 lg:py-24">
          <div>
            <p className="display-rounded max-w-[15ch] text-4xl uppercase leading-[0.9] text-[#090909] sm:text-6xl">{content.name}</p>
            <p className="mt-5 text-sm font-black uppercase text-[#090909]/48">{content.role}</p>
          </div>
          <div>
            <p className="max-w-2xl text-sm leading-7 text-[#090909]/66 sm:text-base sm:leading-8">{content.bio}</p>
            <div className="mt-9 grid gap-5 border-t-2 border-[#090909] pt-7 sm:grid-cols-2">
              <a className="inline-flex items-center gap-2 text-sm font-black hover:text-[#c5b800]" href={`mailto:${content.email}`}>
                <Mail size={16} /> {content.email}
              </a>
              <p className="text-sm font-black">{content.location}</p>
            </div>
            <a className="mt-8 inline-flex min-h-12 items-center gap-3 bg-[#090909] px-5 text-xs font-black uppercase text-white hover:bg-[#f5ea28] hover:text-[#090909]" href={detailHref("about")} onClick={rememberHomeScrollPosition}>
              Open gallery <ArrowRight size={17} />
            </a>
          </div>
        </div>

        <footer className="flex flex-col gap-4 border-t-2 border-[#090909] bg-white px-5 py-8 text-[11px] font-bold uppercase text-[#090909]/52 sm:flex-row sm:items-center sm:justify-between sm:px-9 lg:px-16">
          <span>{content.name} / {content.role}</span>
          <a className="inline-flex items-center gap-2 text-[#090909] hover:text-[#c5b800]" href="#top">Return to top <ArrowUpRight size={14} /></a>
        </footer>
      </div>
    </section>
  );
}
