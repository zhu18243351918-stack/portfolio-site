import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { rememberHomeScrollPosition } from "./scrollPosition";

function detailHref(id) {
  const contentHash = window.location.hash.startsWith("#content=") ? window.location.hash : "";
  return `?detail=${id}${contentHash}`;
}

function ProjectCard({ item, index, setCardRef, revealed }) {
  const isLead = index === 0;
  const isAccent = index === 1;
  const layoutClass = isLead ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5";

  return (
    <article
      ref={(node) => setCardRef(index, node)}
      className={`module-card module-lift relative min-h-[420px] overflow-hidden ${layoutClass} ${
        isAccent ? "bg-[#cf4c3e]" : index === 2 ? "bg-[#415241]" : "bg-[#111612]"
      } transition-[opacity,transform] duration-700 ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      data-project-index={index}
    >
      <a
        className="group block h-full"
        href={detailHref(`project-${index}`)}
        aria-label={`Open ${item.title} gallery`}
        onClick={rememberHomeScrollPosition}
      >
        {isLead ? (
          <>
            <img className="media-zoom absolute inset-0 h-full w-full object-cover opacity-88" src={item.asset} alt={item.title} />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,11,9,0.9)_0%,rgba(8,11,9,0.18)_65%,transparent_100%)]" />
            <div className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8">
              <div className="flex items-center justify-between gap-5 text-[10px] font-bold uppercase text-white/65">
                <span>{item.label}</span>
                <span>{item.metric}</span>
              </div>
              <h3 className="display-rounded mt-4 max-w-[12ch] text-4xl uppercase leading-[0.92] text-[#ece9df] sm:text-6xl">
                {item.title}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/62">{item.description}</p>
            </div>
            <ArrowUpRight className="absolute right-6 top-6 text-[#ece9df] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" size={24} />
          </>
        ) : (
          <div className="flex h-full min-h-[420px] flex-col justify-between p-5 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div
                className={`overflow-hidden bg-black/15 ${
                  isAccent ? "size-36 rounded-full sm:size-44" : "h-40 w-[62%] rounded-[22px] sm:h-48"
                }`}
              >
                <img className="media-zoom h-full w-full object-cover" src={item.asset} alt={item.title} />
              </div>
              <ArrowUpRight
                className={`${isAccent ? "text-[#f5eee6]" : "text-[#ece9df]"} transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1`}
                size={23}
              />
            </div>

            <div className={isAccent ? "text-[#f5eee6]" : "text-[#ece9df]"}>
              <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase opacity-65">
                <span>{item.label}</span>
                <span>{item.index}</span>
              </div>
              <h3 className="display-rounded mt-4 max-w-[13ch] text-3xl uppercase leading-[0.94] sm:text-4xl">{item.title}</h3>
              <p className="mt-4 line-clamp-3 max-w-lg text-xs leading-5 opacity-65 sm:text-sm sm:leading-6">{item.description}</p>
              <p className="mt-5 text-xs font-black uppercase">{item.metric}</p>
            </div>
          </div>
        )}
      </a>
    </article>
  );
}

export function ProjectsSection({ content, size }) {
  const cardRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(() => new Set());

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
    <section id="projects" className="bg-[#090c0a] px-3 py-16 sm:px-5 lg:px-7 lg:py-24" style={{ minHeight: `${size}vh` }}>
      <div className="frame-board mx-auto max-w-[1500px] p-0">
        <div className="grid gap-2 lg:grid-cols-[0.78fr_1.22fr]">
          <header className="module-card bg-[#151a16] p-6 sm:p-9 lg:p-11">
            <p className="font-jakarta text-[10px] font-bold uppercase text-[#df6254]">{content.eyebrow}</p>
            <h2 className="display-rounded mt-5 max-w-[12ch] text-4xl uppercase leading-[0.92] text-[#ece9df] sm:text-6xl">
              {content.title}
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/52">{content.description}</p>
          </header>

          <nav className="module-card hide-scrollbar flex items-stretch gap-2 overflow-x-auto bg-[#111512] p-2" aria-label="Project navigation">
            {content.items.map((item, index) => (
              <button
                key={item.index}
                className={`module-card min-w-[190px] flex-1 px-5 py-5 text-left transition-colors sm:min-w-[220px] ${
                  activeIndex === index
                    ? "bg-[#cf4c3e] text-[#f5eee6]"
                    : "bg-[#415241] text-[#ece9df] hover:bg-[#4c604d]"
                }`}
                type="button"
                onClick={() => cardRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" })}
              >
                <span className="text-[10px] font-black uppercase opacity-65">{item.index}</span>
                <span className="mt-3 block text-sm font-bold leading-5">{item.title}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-2 grid gap-2 lg:grid-cols-12 lg:grid-rows-[minmax(320px,42vh)_minmax(320px,42vh)]">
          {content.items.map((item, index) => (
            <ProjectCard
              key={`${item.index}-${item.title}`}
              item={item}
              index={index}
              setCardRef={setCardRef}
              revealed={revealed.has(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlogSection({ content, size }) {
  return (
    <section id="blog" className="bg-[#0c100d] px-3 py-16 sm:px-5 lg:px-7 lg:py-24" style={{ minHeight: `${size}vh` }}>
      <div className="frame-board mx-auto max-w-[1500px] p-0">
        <div className="grid gap-2 lg:grid-cols-[0.78fr_1.22fr]">
          <header className="module-card flex flex-col justify-between bg-[#cf4c3e] p-6 text-[#f5eee6] sm:p-9 lg:p-11">
            <p className="font-jakarta text-[10px] font-bold uppercase text-white/72">{content.eyebrow}</p>
            <div className="mt-16">
              <h2 className="display-rounded max-w-[11ch] text-4xl uppercase leading-[0.92] sm:text-6xl">{content.title}</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/68">{content.description}</p>
            </div>
          </header>

          <div className="module-card bg-[#151a16] p-5 sm:p-8">
            <div className="hide-scrollbar flex h-full min-h-[420px] snap-x gap-3 overflow-x-auto lg:grid lg:grid-cols-3 lg:overflow-visible">
              {content.items.map((item, index) => (
                <a
                  key={`${item.category}-${item.title}`}
                  className="group module-card module-lift flex min-w-[250px] snap-center flex-col justify-between bg-[#ece9df] p-4 text-[#172018] lg:min-w-0"
                  href={detailHref(`blog-${index}`)}
                  onClick={rememberHomeScrollPosition}
                >
                  <div className="aspect-square overflow-hidden rounded-full bg-[#d6d8d2]">
                    <img className="media-zoom h-full w-full object-cover" src={item.asset} alt={item.title} />
                  </div>
                  <div className="pt-6">
                    <p className="text-[10px] font-black uppercase text-[#cf4c3e]">{item.category} / {item.meta}</p>
                    <h3 className="mt-3 text-xl font-black leading-[1.05]">{item.title}</h3>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="font-jakarta text-[10px] font-black">0{index + 1}</span>
                      <span className="grid size-10 place-items-center rounded-full border border-[#172018]/20">
                        <ArrowUpRight size={17} />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ResumeSection({ content, size }) {
  const tones = [
    "bg-[#415241] text-[#ece9df]",
    "bg-[#171c18] text-[#ece9df]",
    "bg-[#ece9df] text-[#172018]",
    "bg-[#cf4c3e] text-[#f5eee6]",
  ];

  return (
    <section id="resume" className="bg-[#090c0a] px-3 py-16 sm:px-5 lg:px-7 lg:py-24" style={{ minHeight: `${size}vh` }}>
      <div className="frame-board mx-auto max-w-[1500px] p-0">
        <header className="module-card grid gap-8 bg-[#151a16] p-6 sm:p-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:p-11">
          <div>
            <p className="font-jakarta text-[10px] font-bold uppercase text-[#df6254]">{content.eyebrow}</p>
            <h2 className="display-rounded mt-5 max-w-[11ch] text-4xl uppercase leading-[0.92] text-[#ece9df] sm:text-6xl">{content.title}</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/52 lg:justify-self-end">{content.description}</p>
        </header>

        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, index) => (
            <a
              key={item.step}
              className={`group module-card module-lift flex min-h-[390px] flex-col justify-between p-5 sm:p-6 ${tones[index % tones.length]}`}
              href={detailHref(`resume-${index}`)}
              aria-label={`Open ${item.title} gallery`}
              onClick={rememberHomeScrollPosition}
            >
              <div className="flex items-start justify-between gap-5">
                <div className="size-28 overflow-hidden rounded-full bg-black/10 sm:size-32">
                  <img className="media-zoom h-full w-full object-cover" src={item.asset} alt={item.title} />
                </div>
                <ArrowUpRight className="opacity-55 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" size={20} />
              </div>
              <div>
                <span className="font-jakarta text-[11px] font-black opacity-55">{item.step}</span>
                <h3 className="display-rounded mt-4 text-2xl uppercase leading-[0.95]">{item.title}</h3>
                <p className="mt-4 line-clamp-4 text-xs leading-5 opacity-62">{item.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection({ content, size }) {
  const previewImages = (content.gallery?.length ? content.gallery : [content.image]).slice(0, 3);

  return (
    <section id="about" className="bg-[#0c100d] px-3 pb-5 pt-16 sm:px-5 lg:px-7 lg:pt-24" style={{ minHeight: `${size}vh` }}>
      <div className="frame-board mx-auto max-w-[1500px] p-0">
        <div className="grid gap-2 lg:grid-cols-[1.05fr_0.95fr]">
          <a
            className="group module-card module-lift relative min-h-[520px] overflow-hidden bg-[#111512] lg:min-h-[720px]"
            href={detailHref("about")}
            aria-label="Open personal gallery"
            onClick={rememberHomeScrollPosition}
          >
            <img className="media-zoom absolute inset-0 h-full w-full object-cover opacity-88" src={content.image} alt={content.name} />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,11,9,0.82)_0%,transparent_58%)]" />
            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-5 sm:inset-x-8 sm:bottom-8">
              <div>
                <p className="text-xl font-black text-[#ece9df]">{content.name}</p>
                <p className="mt-1 text-xs text-white/58">{content.role}</p>
              </div>
              <span className="grid size-12 place-items-center rounded-full bg-[#ece9df] text-[#172018]">
                <ArrowUpRight size={20} />
              </span>
            </div>
          </a>

          <div className="module-card flex min-h-[520px] flex-col justify-between bg-[#ece9df] p-6 text-[#172018] sm:p-9 lg:min-h-[720px] lg:p-11">
            <div>
              <p className="font-jakarta text-[10px] font-black uppercase text-[#cf4c3e]">{content.eyebrow}</p>
              <h2 className="display-rounded mt-5 max-w-[11ch] text-4xl uppercase leading-[0.92] sm:text-6xl lg:text-[68px]">{content.title}</h2>
              <p className="mt-8 max-w-2xl text-sm leading-7 text-[#172018]/68 sm:text-base sm:leading-8">{content.bio}</p>
            </div>

            <div className="mt-12 grid gap-6 border-t border-[#172018]/15 pt-7 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase text-[#172018]/45">Email</p>
                <a className="mt-3 inline-flex items-center gap-2 text-sm font-bold hover:text-[#cf4c3e]" href={`mailto:${content.email}`}>
                  <Mail size={15} /> {content.email}
                </a>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-[#172018]/45">Location</p>
                <p className="mt-3 text-sm font-bold">{content.location}</p>
              </div>
            </div>
          </div>
        </div>

        <a
          className="module-card mt-2 grid gap-7 bg-[#415241] p-6 text-[#ece9df] sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center"
          href={detailHref("about")}
          onClick={rememberHomeScrollPosition}
        >
          <div>
            <p className="text-sm font-black">{content.name}</p>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/55">{content.role}</p>
          </div>
          <div className="flex items-center gap-3">
            {previewImages.map((image, index) => (
              <div key={`${image}-${index}`} className="size-20 overflow-hidden rounded-full border-4 border-[#ece9df]/80 bg-[#d6d8d2] sm:size-24">
                <img className="h-full w-full object-cover" src={image} alt="" />
              </div>
            ))}
          </div>
        </a>

        <footer className="module-card mt-2 flex flex-col gap-4 bg-[#151a16] px-6 py-6 text-[11px] text-white/42 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>{content.name} / {content.role}</span>
          <a className="font-bold text-white/68 hover:text-[#df6254]" href="#top">Return to top</a>
        </footer>
      </div>
    </section>
  );
}
