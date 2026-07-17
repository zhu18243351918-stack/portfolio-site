import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Mail, MapPin } from "lucide-react";
import { rememberHomeScrollPosition } from "./scrollPosition";

function detailHref(id) {
  const contentHash = window.location.hash.startsWith("#content=") ? window.location.hash : "";
  return `?detail=${id}${contentHash}`;
}

function useReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: options.threshold ?? 0.12, rootMargin: options.rootMargin ?? "0px 0px -8%" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return { ref, visible };
}

function SectionLabel({ index, children }) {
  return (
    <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-[#c9c8bb]/56">
      <span className="font-mono text-[#d8d3b8]">{index}</span>
      <span className="h-px w-10 bg-white/20" />
      <span>{children}</span>
    </div>
  );
}

function RevealBlock({ children, className = "" }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`reveal-block ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function ExperienceSection({ content, projectCount, size }) {
  const stats = [
    ["05+", "Years in design"],
    [String(projectCount).padStart(2, "0"), "Selected cases"],
    ["04", "Industry contexts"],
    ["02", "Cross-cultural markets"],
  ];

  return (
    <section id="about" className="bg-[#08090b] px-5 py-24 text-[#e8e6d8] sm:px-8 sm:py-32 lg:px-12 lg:py-40" style={{ minHeight: `${Math.max(100, size)}vh` }}>
      <RevealBlock className="mx-auto max-w-[1700px]">
        <div className="border-t border-white/16 pt-7">
          <SectionLabel index="01">Profile / Experience</SectionLabel>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 xl:gap-28">
          <a
            className="group relative block min-h-[620px] overflow-hidden rounded-[6px] bg-[#111317] lg:min-h-[760px]"
            href={detailHref("about")}
            aria-label="Open personal experience gallery"
            onClick={rememberHomeScrollPosition}
          >
            <img
              className="media-zoom absolute inset-0 h-full w-full object-cover grayscale-[0.18]"
              src={content.image}
              alt={content.name}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(4,5,7,0.88)_100%)]" />
            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 sm:inset-x-8 sm:bottom-8">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#d8d3b8]/62">Based in Shanghai</p>
                <p className="mt-2 text-sm font-semibold text-white">{content.role}</p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-white/28 bg-black/28 text-white backdrop-blur-md transition-colors group-hover:bg-[#e5ff48] group-hover:text-[#090a0c]">
                <ArrowUpRight size={18} />
              </span>
            </div>
          </a>

          <div className="flex flex-col justify-between lg:py-2">
            <div>
              <p className="text-sm font-medium uppercase text-[#e5ff48]">{content.eyebrow}</p>
              <h2 className="display-editorial mt-7 max-w-[18ch] text-[44px] leading-[0.96] text-[#f1efe4] sm:text-6xl lg:text-[64px] xl:text-[72px]">
                {content.title}
              </h2>
              <p className="mt-9 max-w-3xl text-base leading-8 text-[#d0cec2]/66 sm:text-lg sm:leading-9">{content.bio}</p>
            </div>

            <div className="mt-14 grid grid-cols-2 border-y border-white/14 sm:grid-cols-4 lg:mt-20">
              {stats.map(([value, label], index) => (
                <div key={label} className={`py-7 sm:px-5 lg:py-9 ${index ? "border-l border-white/14" : ""}`}>
                  <strong className="display-editorial text-4xl font-medium text-[#f1efe4] sm:text-5xl">{value}</strong>
                  <span className="mt-3 block max-w-[11ch] text-[9px] font-bold uppercase leading-4 text-[#d0cec2]/42">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <a className="inline-flex items-center gap-3 text-sm font-semibold text-[#f1efe4] hover:text-[#e5ff48]" href={`mailto:${content.email}`}>
                <Mail size={16} /> {content.email}
              </a>
              <p className="inline-flex items-center gap-3 text-sm text-[#d0cec2]/52">
                <MapPin size={16} /> {content.location}
              </p>
            </div>
          </div>
        </div>
      </RevealBlock>
    </section>
  );
}

export function ProjectsSection({ content, size }) {
  return (
    <section id="projects" className="bg-[#0d0f12] px-5 py-24 text-[#eeeade] sm:px-8 sm:py-28 lg:px-12 lg:py-32" style={{ minHeight: `${Math.max(180, size)}vh` }}>
      <div className="mx-auto max-w-[1700px]">
        <RevealBlock>
          <div className="border-t border-white/16 pt-7">
            <SectionLabel index="02">Selected Projects</SectionLabel>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-end lg:gap-16">
            <h2 className="display-editorial max-w-[14ch] text-[50px] leading-[0.94] sm:text-7xl lg:text-[82px] xl:text-[94px]">
              {content.title}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[#cfcdc1]/58 sm:text-base sm:leading-8 lg:justify-self-end">{content.description}</p>
          </div>
        </RevealBlock>

        <div className="mt-16 space-y-8 lg:mt-20 lg:space-y-12">
          {content.items.map((item, index) => (
            <RevealBlock key={item.index}>
              <article className="project-feature group relative min-h-[560px] overflow-hidden rounded-[6px] bg-[#15171b] sm:min-h-[680px] lg:min-h-[min(82vh,920px)]">
                <a
                  className="absolute inset-0"
                  href={detailHref(`project-${index}`)}
                  aria-label={`Open ${item.title} gallery`}
                  onClick={rememberHomeScrollPosition}
                >
                  <img className="media-zoom absolute inset-0 h-full w-full object-cover" src={item.asset} alt={item.title} />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.08)_25%,rgba(5,6,8,0.88)_100%)]" />
                  <div className="absolute inset-x-6 top-6 flex items-center justify-between text-[10px] font-bold uppercase text-white/68 sm:inset-x-9 sm:top-9">
                    <span>{item.index} / {item.label}</span>
                    <span className="hidden sm:block">{item.metric}</span>
                  </div>
                  <div className="absolute inset-x-6 bottom-6 grid gap-5 sm:inset-x-9 sm:bottom-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-12">
                    <h3 className="display-editorial max-w-[16ch] text-4xl leading-[0.94] text-white sm:text-6xl lg:text-[66px] xl:text-[76px]">{item.title}</h3>
                    <div className="flex items-end justify-between gap-5 lg:justify-self-end">
                      <p className="hidden max-w-lg text-sm leading-7 text-white/62 sm:block">{item.description}</p>
                      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#e5ff48] text-[#090a0c] transition-transform duration-500 group-hover:rotate-45 group-hover:scale-105">
                        <ArrowUpRight size={20} />
                      </span>
                    </div>
                  </div>
                </a>
              </article>
            </RevealBlock>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StrengthsSection({ content, capabilities, size }) {
  return (
    <section id="strengths" className="bg-[#08090b] px-5 py-24 text-[#e8e6d8] sm:px-8 sm:py-28 lg:px-12 lg:py-32" style={{ minHeight: `${Math.max(110, size)}vh` }}>
      <div className="mx-auto max-w-[1700px]">
        <RevealBlock>
          <div className="border-t border-white/16 pt-7">
            <SectionLabel index="03">Strengths / Capabilities</SectionLabel>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16">
            <h2 className="display-editorial max-w-[14ch] text-[46px] leading-[0.95] sm:text-7xl lg:text-[76px] xl:text-[88px]">{content.title}</h2>
            <p className="max-w-2xl text-sm leading-7 text-[#cfcdc1]/58 sm:text-base sm:leading-8 lg:justify-self-end">{content.description}</p>
          </div>
        </RevealBlock>

        <div className="mt-14 grid gap-3 lg:mt-18 lg:grid-cols-3">
          {content.items.map((item, index) => (
            <RevealBlock key={`${item.category}-${item.title}`}>
              <a
                className="group relative block min-h-[470px] overflow-hidden rounded-[6px] border border-white/10 bg-[#14161a]"
                href={detailHref(`blog-${index}`)}
                onClick={rememberHomeScrollPosition}
              >
                <img className="media-zoom absolute inset-0 h-full w-full object-cover opacity-55 grayscale-[0.28]" src={item.asset} alt={item.title} />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,10,0.15),rgba(7,8,10,0.92))]" />
                <div className="absolute inset-6 flex flex-col justify-between sm:inset-8">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-white/52">
                    <span>{item.category}</span>
                    <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" size={18} />
                  </div>
                  <div>
                    <h3 className="display-editorial text-4xl leading-[0.98] text-white sm:text-5xl">{item.title}</h3>
                    <p className="mt-4 text-xs font-semibold uppercase text-[#e5ff48]">{item.meta}</p>
                  </div>
                </div>
              </a>
            </RevealBlock>
          ))}
        </div>

        <RevealBlock className="mt-20 lg:mt-28">
          <div className="flex flex-col gap-5 border-b border-white/14 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-[#e5ff48]">{capabilities.eyebrow}</p>
              <h3 className="display-editorial mt-4 max-w-[16ch] text-4xl leading-[0.96] text-[#f0eee3] sm:text-6xl">{capabilities.title}</h3>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#cfcdc1]/52">{capabilities.description}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.items.map((item, index) => (
              <a
                key={item.step}
                className={`group min-h-[300px] border-white/12 p-6 transition-colors hover:bg-[#11141a] sm:p-8 ${index % 4 ? "lg:border-l" : ""} ${index >= 4 ? "border-t" : ""} ${index % 2 ? "sm:border-l" : ""}`}
                href={detailHref(`resume-${index}`)}
                onClick={rememberHomeScrollPosition}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-white/40">
                  <span>{item.step}</span>
                  <ArrowUpRight className="opacity-0 transition-opacity group-hover:opacity-100" size={16} />
                </div>
                <h4 className="display-editorial mt-16 text-3xl leading-none text-[#efede1]">{item.title}</h4>
                <p className="mt-5 text-sm leading-7 text-[#cfcdc1]/48">{item.description}</p>
              </a>
            ))}
          </div>
        </RevealBlock>
      </div>
    </section>
  );
}

export function ContactSection({ content }) {
  return (
    <section id="contact" className="relative flex min-h-[100dvh] items-end overflow-hidden bg-[#08090b] px-5 py-10 text-[#efede1] sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <img className="absolute inset-0 h-full w-full object-cover opacity-18 grayscale" src="./portfolio/contact.webp" alt="" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,7,9,0.38),rgba(6,7,9,0.98)_82%)]" />
      <div className="noise-overlay absolute inset-0 opacity-25" aria-hidden="true" />

      <RevealBlock className="relative z-10 mx-auto w-full max-w-[1700px]">
        <div className="border-t border-white/16 pt-7">
          <SectionLabel index="04">Contact / Collaboration</SectionLabel>
        </div>
        <div className="mt-16 lg:mt-24">
          <p className="text-sm font-semibold uppercase text-[#e5ff48]">Available for brand and visual collaborations</p>
          <h2 className="display-editorial mt-6 max-w-[13ch] text-[58px] leading-[0.88] sm:text-[92px] lg:text-[132px] xl:text-[164px]">
            Let&apos;s make the brand impossible to ignore.
          </h2>
        </div>

        <div className="mt-14 grid gap-8 border-t border-white/16 pt-8 lg:mt-20 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="max-w-2xl text-sm leading-7 text-[#cfcdc1]/52 sm:text-base">{content.bio}</p>
            <div className="mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:gap-8">
              <p>{content.location}</p>
              <p>{content.role}</p>
            </div>
          </div>
          <a
            className="group inline-flex min-h-16 w-fit items-center gap-5 rounded-full bg-[#e5ff48] px-7 text-sm font-bold uppercase text-[#090a0c] transition-transform hover:-translate-y-1"
            href={`mailto:${content.email}`}
          >
            Contact me
            <span className="grid size-10 place-items-center rounded-full bg-[#090a0c] text-white transition-transform group-hover:rotate-45">
              <ArrowRight size={17} />
            </span>
          </a>
        </div>

        <footer className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 text-[10px] font-bold uppercase text-white/34 sm:flex-row sm:items-center sm:justify-between">
          <span>{content.name} / Portfolio 2026</span>
          <a className="inline-flex items-center gap-2 text-white/52 hover:text-[#e5ff48]" href="#top">
            Back to top <ArrowUpRight size={14} />
          </a>
        </footer>
      </RevealBlock>
    </section>
  );
}
