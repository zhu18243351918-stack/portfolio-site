import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";

function detailHref(id) {
  const contentHash = window.location.hash.startsWith("#content=") ? window.location.hash : "";
  return `?detail=${id}${contentHash}`;
}

function SectionDivider() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="size-1.5 bg-[#5ed29c]" />
      <span className="h-px flex-1 bg-white/12" />
      <span className="size-1.5 bg-[#5ed29c]" />
    </div>
  );
}

function ProjectCard({ item, index, setCardRef, revealed }) {
  return (
    <article
      ref={(node) => setCardRef(index, node)}
      className={`project-card flex min-h-[62vh] flex-col justify-between overflow-hidden border border-white/12 bg-black/25 p-3 backdrop-blur-sm transition-[opacity,transform] duration-700 md:p-5 ${
        revealed ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"
      }`}
      data-project-index={index}
    >
      <a
        className="group/media relative block min-h-[34vh] overflow-hidden bg-black/30"
        href={detailHref(`project-${index}`)}
        aria-label={`Open ${item.title} gallery`}
      >
        <img className="absolute inset-0 h-full w-full object-cover opacity-85" src={item.asset} alt="" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,11,10,0.72),transparent_58%)]" />
        <span className="absolute left-4 top-4 border border-white/20 bg-black/25 px-3 py-2 text-[10px] font-bold uppercase text-white/75 backdrop-blur-md">
          {item.label}
        </span>
        <span className="absolute bottom-4 right-4 font-jakarta text-[11px] font-bold text-[#5ed29c]">{item.index}</span>
        <ArrowUpRight className="absolute right-4 top-4 text-white/45 transition-[color,transform] group-hover/media:-translate-y-0.5 group-hover/media:translate-x-0.5 group-hover/media:text-[#5ed29c]" size={19} />
      </a>

      <div className="grid gap-6 px-2 pb-3 pt-8 md:grid-cols-[1fr_0.72fr] md:items-end">
        <div>
          <h3 className="max-w-xl text-3xl font-semibold leading-[1.05] tracking-[0] text-white md:text-5xl">{item.title}</h3>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/55 md:text-base md:leading-7">{item.description}</p>
        </div>
        <p className="border-l border-[#5ed29c] pl-4 text-xs font-bold uppercase leading-5 text-white/70 md:justify-self-end">
          {item.metric}
        </p>
      </div>
    </article>
  );
}

export function ProjectsSection({ content, size }) {
  const cardRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(() => new Set());

  useEffect(() => {
    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.projectIndex);
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) setActiveIndex(index);
        });
      },
      { threshold: [0.2, 0.55, 0.75] },
    );
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(entry.target.dataset.projectIndex);
          setRevealed((current) => new Set(current).add(index));
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );

    cardRefs.current.forEach((card) => {
      if (!card) return;
      activeObserver.observe(card);
      revealObserver.observe(card);
    });

    return () => {
      activeObserver.disconnect();
      revealObserver.disconnect();
    };
  }, [content.items]);

  const setCardRef = (index, node) => {
    cardRefs.current[index] = node;
  };

  return (
    <section
      id="projects"
      className="relative z-10 -mt-6 rounded-t-[24px] border-t border-white/10 bg-[#0a0f0d] px-5 py-20 sm:px-8 lg:px-12 lg:py-0"
      style={{ minHeight: `${size}vh` }}
    >
      <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[360px_1fr] lg:gap-20 xl:grid-cols-[430px_1fr] xl:gap-28">
        <aside className="lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col lg:justify-between lg:py-28">
          <div>
            <p className="font-jakarta text-[11px] font-bold uppercase text-[#5ed29c]">{content.eyebrow}</p>
            <h2 className="mt-5 max-w-md text-4xl font-semibold leading-[1.05] tracking-[0] text-white sm:text-5xl lg:text-[58px]">
              {content.title}
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/55">{content.description}</p>
          </div>

          <div className="mt-12 hidden lg:block">
            <div className="space-y-2">
              {content.items.map((item, index) => (
                <button
                  key={item.index}
                  className={`flex w-full items-center justify-between border px-4 py-3 text-left text-xs font-semibold transition-colors ${
                    activeIndex === index
                      ? "border-[#5ed29c] bg-[#5ed29c] text-[#070b0a]"
                      : "border-white/10 bg-black/20 text-white/45 hover:text-white"
                  }`}
                  type="button"
                  onClick={() => cardRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                >
                  <span>{item.title}</span>
                  <span className="font-jakarta text-[10px]">{item.index}</span>
                </button>
              ))}
            </div>
            <p className="mt-6 max-w-xs text-xs leading-5 text-white/35">Three stages. One coherent body of work.</p>
          </div>
        </aside>

        <div className="space-y-14 pb-16 lg:space-y-16 lg:py-20">
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
    <section id="blog" className="bg-[#0d1411] px-5 py-24 sm:px-8 lg:px-12 lg:py-32" style={{ minHeight: `${size}vh` }}>
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-3xl">
          <p className="font-jakarta text-[11px] font-bold uppercase text-[#5ed29c]">{content.eyebrow}</p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[0] text-white sm:text-6xl">{content.title}</h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/55">{content.description}</p>
        </div>

        <div className="mt-16">
          {content.items.map((item, index) => (
            <article
              key={`${item.category}-${item.title}`}
              className="border-t border-white/12"
            >
              <a className="group grid gap-5 py-7 md:grid-cols-[90px_1fr_260px_40px] md:items-center" href={detailHref(`blog-${index}`)}>
                <span className="font-jakarta text-[10px] font-bold text-[#5ed29c]">0{index + 1}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/40">{item.category} / {item.meta}</p>
                  <h3 className="mt-2 max-w-2xl text-xl font-semibold leading-tight text-white transition-colors group-hover:text-[#5ed29c] md:text-3xl">
                    {item.title}
                  </h3>
                </div>
                <div className="h-28 overflow-hidden bg-black/25 md:h-36">
                  <img className="h-full w-full object-cover opacity-70 transition-[transform,opacity] duration-500 group-hover:scale-105 group-hover:opacity-90" src={item.asset} alt="" />
                </div>
                <ArrowUpRight className="text-white/35 transition-colors group-hover:text-[#5ed29c]" size={20} />
              </a>
            </article>
          ))}
          <div className="border-t border-white/12" />
        </div>
      </div>
    </section>
  );
}

export function ResumeSection({ content, size }) {
  return (
    <section id="resume" className="bg-[#090e0c] px-5 py-24 sm:px-8 lg:px-12 lg:py-32" style={{ minHeight: `${size}vh` }}>
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div>
            <p className="font-jakarta text-[11px] font-bold uppercase text-[#5ed29c]">{content.eyebrow}</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[0] text-white sm:text-6xl">{content.title}</h2>
          </div>
          <p className="max-w-xl self-end text-sm leading-7 text-white/55 lg:justify-self-end">{content.description}</p>
        </div>

        <div className="mt-16 grid border-l border-t border-white/12 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, index) => (
            <article key={item.step} className="border-b border-r border-white/12">
              <a className="group flex min-h-[500px] h-full flex-col" href={detailHref(`resume-${index}`)} aria-label={`Open ${item.title} gallery`}>
                <div className="relative h-48 overflow-hidden bg-black/25 lg:h-56">
                  <img className="h-full w-full object-cover opacity-55 transition-[transform,opacity] duration-500 group-hover:scale-105 group-hover:opacity-85" src={item.asset} alt="" />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(9,14,12,0.78),transparent_70%)]" />
                  <span className="absolute left-5 top-5 font-jakarta text-[11px] font-bold text-[#5ed29c]">{item.step}</span>
                  <ArrowUpRight className="absolute right-5 top-5 text-white/35 transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#5ed29c]" size={18} />
                </div>
                <div className="flex flex-1 flex-col justify-end p-6 lg:p-8">
                  <h3 className="text-2xl font-semibold text-white transition-colors group-hover:text-[#5ed29c]">{item.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-white/50">{item.description}</p>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection({ content, size }) {
  return (
    <section id="about" className="bg-[#0c1210] px-5 pb-8 pt-24 sm:px-8 lg:px-12 lg:pt-32" style={{ minHeight: `${size}vh` }}>
      <div className="mx-auto max-w-[1440px]">
        <SectionDivider />
        <div className="grid gap-12 py-16 lg:grid-cols-[0.86fr_1.14fr] lg:gap-24 lg:py-24">
          <a className="group relative block min-h-[520px] overflow-hidden bg-black/25 lg:min-h-[680px]" href={detailHref("about")} aria-label="Open personal gallery">
            <img className="absolute inset-0 h-full w-full object-cover opacity-80" src={content.image} alt="" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,11,10,0.8),transparent_55%)]" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between border-t border-white/20 pt-5">
              <div>
                <p className="text-lg font-semibold text-white">{content.name}</p>
                <p className="mt-1 text-xs text-white/50">{content.role}</p>
              </div>
              <span className="font-jakarta text-[10px] font-bold text-[#5ed29c]">CODE / CAREER / CRAFT</span>
            </div>
            <ArrowUpRight className="absolute right-6 top-6 text-white/45 transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#5ed29c]" size={21} />
          </a>

          <div className="flex flex-col justify-between">
            <div>
              <p className="font-jakarta text-[11px] font-bold uppercase text-[#5ed29c]">{content.eyebrow}</p>
              <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[0] text-white sm:text-6xl lg:text-[68px]">{content.title}</h2>
              <p className="mt-8 max-w-2xl text-base leading-8 text-white/58 md:text-lg">{content.bio}</p>
            </div>

            <div className="mt-14 grid gap-5 border-t border-white/12 pt-7 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-white/35">Email</p>
                <a className="mt-2 inline-flex items-center gap-2 text-sm text-white hover:text-[#5ed29c]" href={`mailto:${content.email}`}>
                  <Mail size={15} /> {content.email}
                </a>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-white/35">Location</p>
                <p className="mt-2 text-sm text-white">{content.location}</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-4 border-t border-white/12 py-7 text-[11px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>CodeNest / Career-ready coding education</span>
          <a className="text-white/55 hover:text-[#5ed29c]" href="#top">Return to top</a>
        </footer>
      </div>
    </section>
  );
}
