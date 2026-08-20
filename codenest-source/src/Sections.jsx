import { useState } from "react";
import { ArrowRight, ArrowUpRight, Mail, MapPin, MessageCircle, Plus } from "lucide-react";
import { rememberHomeScrollPosition } from "./scrollPosition";
import { resetSpecularEdge, steerSpecularEdge } from "./specularEdge";

function detailHref(id) {
  const params = new URLSearchParams(window.location.search);
  params.set("detail", id);
  const contentHash = window.location.hash.startsWith("#content=") ? window.location.hash : "";
  return `${window.location.pathname}?${params.toString()}${contentHash}`;
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

export function ExperienceSection({ content, size }) {
  return (
    <section
      id="about"
      data-motion-section
      className="bg-[#08090b] px-5 py-[clamp(48px,6dvh,64px)] text-[#e8e6d8] sm:px-8 sm:pb-16 sm:pt-20 lg:px-12 lg:pb-16 lg:pt-24"
      style={{ minHeight: `${Math.max(70, Number(size) || 80)}vh` }}
    >
      <div className="portfolio-layout mx-auto max-w-[1700px]">
        <div data-motion-header className="border-t border-white/16 pt-7">
          <div data-motion-label>
            <SectionLabel index="01">Profile / Experience</SectionLabel>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 xl:gap-20">
          <a
            data-motion-intro
            className="cursor-target specular-frame group relative block h-[clamp(400px,56dvh,480px)] min-h-0 overflow-hidden rounded-[6px] bg-[#111317] sm:h-auto sm:min-h-[540px] lg:min-h-[640px]"
            href={detailHref("about")}
            aria-label="Open personal experience gallery"
            onClick={rememberHomeScrollPosition}
            onPointerMove={steerSpecularEdge}
            onPointerLeave={resetSpecularEdge}
          >
            <img
              data-parallax
              className="media-zoom absolute inset-x-0 h-full w-full object-cover object-[center_36%] grayscale-[0.18] sm:object-center"
              src={content.image}
              alt={content.name}
              style={content.imageFocus ? { objectPosition: content.imageFocus } : undefined}
              data-edit-path="about.image"
              data-edit-kind="image"
              data-edit-label="人物图片"
              data-edit-section="关于我"
              data-edit-gallery-path="about.gallery"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(4,5,7,0.88)_100%)]" />
            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 sm:inset-x-8 sm:bottom-8">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#d8d3b8]/62">Based in Shanghai</p>
                <p className="mt-2 text-sm font-semibold text-white" data-edit-path="about.role" data-edit-kind="text" data-edit-label="身份 / 职位" data-edit-section="关于我">{content.role}</p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-white/28 bg-black/28 text-white backdrop-blur-md transition-colors group-hover:bg-[#e5ff48] group-hover:text-[#090a0c]">
                <ArrowUpRight size={18} />
              </span>
            </div>
          </a>

          <div data-motion-intro className="flex flex-col justify-between lg:py-2">
            <div>
              <p data-motion-copy className="text-sm font-medium uppercase text-[#e5ff48]" data-edit-path="about.eyebrow" data-edit-kind="text" data-edit-label="个人介绍小标题" data-edit-section="关于我">{content.eyebrow}</p>
              <div data-motion-heading-wrap className="motion-heading-mask mt-7">
                <h2 data-motion-heading className="display-editorial max-w-[18ch] text-[44px] leading-[0.96] text-[#f1efe4] sm:text-6xl lg:text-[64px] xl:text-[72px]" data-edit-path="about.title" data-edit-kind="text" data-edit-label="个人介绍标题" data-edit-section="关于我" data-edit-multiline="true">
                  {content.title}
                </h2>
              </div>
              <p data-motion-copy className="mt-9 max-w-3xl text-base leading-8 text-[#d0cec2]/66 sm:text-lg sm:leading-9" data-edit-path="about.bio" data-edit-kind="text" data-edit-label="个人简介" data-edit-section="关于我" data-edit-multiline="true">{content.bio}</p>
            </div>

            <div
              data-motion-copy
              className="specular-frame specular-frame--quiet mt-12 grid grid-cols-2 overflow-hidden rounded-[6px] border border-white/14 sm:grid-cols-4 lg:mt-14"
              onPointerMove={steerSpecularEdge}
              onPointerLeave={resetSpecularEdge}
            >
              {content.stats.map((stat, index) => (
                <div
                  key={`${stat.label}-${index}`}
                  className={`min-h-[112px] border-white/14 p-5 sm:min-h-0 sm:px-5 lg:py-7 ${index % 2 ? "border-l" : ""} ${
                    index >= 2 ? "border-t sm:border-t-0" : ""
                  } ${index > 0 ? "sm:border-l" : "sm:border-l-0"}`}
                >
                  <strong className="display-editorial block whitespace-nowrap text-[38px] font-medium leading-none text-[#f1efe4] sm:text-[40px] xl:text-5xl" data-edit-path={`about.stats.${index}.value`} data-edit-kind="text" data-edit-label={`个人数据 ${index + 1} 数值`} data-edit-section="关于我">{stat.value}</strong>
                  <span className="mt-4 block max-w-[14ch] text-[9px] font-bold uppercase leading-4 text-[#d0cec2]/46" data-edit-path={`about.stats.${index}.label`} data-edit-kind="text" data-edit-label={`个人数据 ${index + 1} 说明`} data-edit-section="关于我">{stat.label}</span>
                </div>
              ))}
            </div>

            <div data-motion-copy className="mt-8 flex min-w-0 flex-wrap items-center gap-x-8 gap-y-4">
              <a className="cursor-target inline-flex min-w-0 items-center gap-3 break-all text-[13px] font-semibold text-[#f1efe4] hover:text-[#e5ff48] sm:text-sm" href={`mailto:${content.email}`} data-edit-path="about.email" data-edit-kind="text" data-edit-label="邮箱" data-edit-section="关于我">
                <Mail className="shrink-0" size={16} /> {content.email}
              </a>
              {content.wechat && (
                <p className="inline-flex min-w-0 items-center gap-3 text-[13px] text-[#d0cec2]/64 sm:text-sm" data-edit-path="about.wechat" data-edit-kind="text" data-edit-label="微信号" data-edit-section="关于我">
                  <MessageCircle className="shrink-0" size={16} /> <span className="min-w-0 break-all">{content.wechat}</span>
                </p>
              )}
              <p className="inline-flex min-w-0 items-start gap-3 text-[13px] leading-6 text-[#d0cec2]/52 sm:items-center sm:text-sm" data-edit-path="about.location" data-edit-kind="text" data-edit-label="地点" data-edit-section="关于我">
                <MapPin className="mt-1 shrink-0 sm:mt-0" size={16} /> <span className="min-w-0 break-words">{content.location}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReferenceExperienceSection({ content, size }) {
  return (
    <section
      id="about"
      data-motion-section
      className="about-reference-section bg-[#08090b] px-5 py-[clamp(48px,6dvh,72px)] text-[#e8e6d8] sm:px-8 lg:px-12"
      style={{ minHeight: `${Math.max(72, Number(size) || 80)}vh` }}
    >
      <div className="portfolio-layout mx-auto max-w-[1700px]">
        <article data-motion-intro className="about-reference-card">
          <a className="about-reference-card__visual cursor-target" href={detailHref("about")} onClick={rememberHomeScrollPosition} aria-label="Open personal experience gallery">
            <img src="./portfolio/concept/about-reference-base.jpg" alt="Creative studio portrait campaign" />
          </a>
          <div className="about-reference-card__bio">
            <p data-edit-path="about.name" data-edit-kind="text" data-edit-label="姓名" data-edit-section="关于我">{content.name}</p>
            <span data-edit-path="about.role" data-edit-kind="text" data-edit-label="身份 / 职位" data-edit-section="关于我">{content.role}</span>
          </div>
          <div className="about-reference-card__footer">
            <span data-edit-path="about.email" data-edit-kind="text" data-edit-label="邮箱" data-edit-section="关于我">({content.email})</span>
            <span data-edit-path="about.location" data-edit-kind="text" data-edit-label="地点" data-edit-section="关于我">({content.location})</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export function LatestCasesSection({ content }) {
  const items = (content.latestItems?.length ? content.latestItems : content.catalogItems || []).slice(0, 3);

  return (
    <section
      id="latest-cases"
      data-motion-section
      className="latest-cases-section bg-[#090b0e] px-5 py-16 text-[#f1efe4] sm:px-8 sm:py-20 lg:px-12 lg:py-24"
      aria-labelledby="latest-cases-title"
    >
      <div className="latest-cases-shell w-full">
        <div data-motion-header data-editor-size-target className="latest-cases-board grid gap-12 border-y border-white/14 py-8 lg:grid-cols-[0.82fr_2.18fr] lg:gap-16 lg:py-10">
          <div className="latest-cases-heading flex flex-col justify-between gap-8">
            <div>
              <span className="latest-cases-kicker">Latest Cases / 2026</span>
              <div data-motion-heading-wrap className="motion-heading-mask mt-7">
                <h2 id="latest-cases-title" data-motion-heading className="latest-cases-title">
                  <span className="latest-cases-title-line" data-edit-path="projects.latestTitleLead" data-edit-kind="text" data-edit-label="最新案例大标题" data-edit-section="最新案例推荐">{content.latestTitleLead ?? "SELECTED"}</span>
                  <span className="latest-cases-title-line latest-cases-title-line--accent">
                    <span data-edit-path="projects.latestTitleAccent" data-edit-kind="text" data-edit-label="最新案例强调标题" data-edit-section="最新案例推荐">{content.latestTitleAccent ?? "WORKS"}</span>
                    <ArrowUpRight className="latest-cases-title-arrow" aria-hidden="true" size={34} strokeWidth={2.2} />
                  </span>
                </h2>
              </div>
            </div>
            <p data-motion-copy className="max-w-[30ch] text-sm leading-7 text-[#cfcdc1]/58" data-edit-path="projects.latestDescription" data-edit-kind="text" data-edit-label="最新案例说明" data-edit-section="最新案例推荐" data-edit-multiline="true">
              {content.latestDescription ?? "最近完成的品牌、电商与全渠道视觉项目。点击案例，查看完整的设计过程与视觉成果。"}
            </p>
          </div>

          <div className="latest-cases-grid grid gap-4 sm:grid-cols-3">
            {items.map((item, index) => (
              <a
                key={`${item.title}-${index}`}
                data-motion-card
                className="latest-case-card cursor-target specular-frame group block overflow-hidden rounded-[6px] border border-white/14 bg-[#111419]"
                href={detailHref(`catalog-${item.projectIndex ?? index}`)}
                onClick={rememberHomeScrollPosition}
                onPointerMove={steerSpecularEdge}
                onPointerLeave={resetSpecularEdge}
                aria-label={`查看 ${item.title} 案例详情`}
                data-edit-path={`projects.latestItems.${index}`}
                data-edit-kind="group"
                data-edit-label={`${item.title} 最新案例卡片`}
                data-edit-section="最新案例推荐"
              >
                <div className="latest-case-card__image relative aspect-[4/3] overflow-hidden bg-[#15181d]">
                  <img
                    className="media-zoom absolute inset-0 h-full w-full object-cover"
                    src={item.image}
                    alt={item.title}
                    data-edit-path={`projects.latestItems.${index}.image`}
                    data-edit-kind="image"
                    data-edit-label={`${item.title} 最新案例封面`}
                    data-edit-section="最新案例推荐"
                  />
                  <span className="absolute left-4 top-4 z-10 font-mono text-[9px] font-bold uppercase text-white/72">0{index + 1}</span>
                  <span className="absolute right-4 top-4 z-10 rounded-full border border-white/18 bg-black/32 px-2 py-1 text-[9px] font-bold uppercase text-white/72 backdrop-blur-sm">Open case</span>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                </div>
                <div className="p-5 sm:p-4 lg:p-5">
                  <p className="font-mono text-[9px] font-bold uppercase text-[#e5ff48]/78" data-edit-path={`projects.latestItems.${index}.category`} data-edit-kind="text" data-edit-label="最新案例分类" data-edit-section="最新案例推荐">{item.category}</p>
                  <h3 className="mt-3 text-[19px] font-semibold leading-tight text-[#f1efe4] sm:text-[17px] lg:text-[20px]" data-edit-path={`projects.latestItems.${index}.title`} data-edit-kind="text" data-edit-label="最新案例标题" data-edit-section="最新案例推荐">{item.title}</h3>
                  <p className="mt-3 line-clamp-3 text-xs leading-6 text-[#cfcdc1]/52" data-edit-path={`projects.latestItems.${index}.description`} data-edit-kind="text" data-edit-label="最新案例说明" data-edit-section="最新案例推荐" data-edit-multiline="true">{item.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase text-[#f1efe4] transition-colors group-hover:text-[#e5ff48]">View project <ArrowUpRight size={14} /></span>
                </div>
              </a>
            ))}
          </div>
          <a className="latest-cases-arrow cursor-target" href="#projects" aria-label="查看全部作品">
            <ArrowRight size={30} strokeWidth={2.2} />
          </a>
        </div>
      </div>
    </section>
  );
}

export function CareerSection({ content, size }) {
  const [expandedItem, setExpandedItem] = useState(null);

  return (
    <section
      id="experience"
      data-motion-section
      className="bg-[#0a0c0f] px-5 py-[clamp(48px,6dvh,64px)] text-[#eeeade] sm:px-8 sm:py-16 lg:px-12 lg:py-16"
      style={{ minHeight: `${Math.max(82, Math.min(100, Number(size) || 92))}vh` }}
      aria-labelledby="career-title"
    >
      <div className="portfolio-layout mx-auto max-w-[1700px]">
        <div data-motion-header className="border-t border-white/16 pt-7">
          <div data-motion-label>
            <SectionLabel index="02">Work History / Selected Roles</SectionLabel>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-end lg:gap-16">
            <div data-motion-heading-wrap className="motion-heading-mask">
              <h2
                id="career-title"
                data-motion-heading
                className="display-editorial max-w-[16ch] text-[48px] leading-[0.94] text-[#f1efe4] sm:text-6xl lg:text-[72px] xl:text-[82px]"
                data-edit-path="career.title"
                data-edit-kind="text"
                data-edit-label="工作履历标题"
                data-edit-section="工作履历"
                data-edit-multiline="true"
              >
                {content.title}
              </h2>
            </div>
            <div data-motion-copy className="lg:justify-self-end">
              <p className="text-[10px] font-bold uppercase text-[#e5ff48]" data-edit-path="career.eyebrow" data-edit-kind="text" data-edit-label="工作履历小标题" data-edit-section="工作履历">{content.eyebrow}</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#cfcdc1]/58 sm:text-base sm:leading-8" data-edit-path="career.description" data-edit-kind="text" data-edit-label="工作履历简介" data-edit-section="工作履历" data-edit-multiline="true">
                {content.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-b border-white/14">
          {content.items.map((item, itemIndex) => (
            <article
              key={`${item.index}-${item.company}`}
              tabIndex={0}
              aria-label={`${item.company} 工作履历，聚焦或悬停查看详情`}
              aria-expanded={expandedItem === itemIndex}
              onClick={(event) => {
                if (event.target.closest("a, button, input, textarea, summary")) return;
                setExpandedItem((current) => current === itemIndex ? null : itemIndex);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setExpandedItem((current) => current === itemIndex ? null : itemIndex);
              }}
              data-motion-card
              data-edit-path={`career.items.${itemIndex}`}
              data-edit-kind="group"
              data-edit-label={`${item.company} 工作履历`}
              data-edit-section="工作履历"
              className={`career-row group grid gap-6 border-t border-white/14 py-5 lg:grid-cols-[0.3fr_0.82fr_1.12fr_1fr] lg:gap-8 xl:grid-cols-[0.28fr_0.9fr_1.15fr_1.05fr] xl:gap-12 ${expandedItem === itemIndex ? "is-expanded" : ""}`}
            >
              <div className="flex items-start justify-between gap-6 lg:flex-col lg:justify-start">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#e5ff48]" data-edit-path={`career.items.${itemIndex}.index`} data-edit-kind="text" data-edit-label="履历序号" data-edit-section="工作履历">{item.index}</span>
                  <p className="mt-3 font-mono text-[11px] font-semibold uppercase leading-5 text-[#d8d3b8]/58 lg:max-w-[15ch]" data-edit-path={`career.items.${itemIndex}.period`} data-edit-kind="text" data-edit-label="工作时间" data-edit-section="工作履历">
                    {item.period}
                  </p>
                </div>
                {item.logo ? (
                  <div className="career-logo-frame mt-0 grid h-[48px] w-[100px] shrink-0 place-items-center overflow-hidden rounded-[4px] border border-white/12 bg-[#f4f4f0] p-1.5 lg:mt-4">
                    <img className="h-full w-full object-contain" src={item.logo} alt={`${item.company} logo`} data-edit-path={`career.items.${itemIndex}.logo`} data-edit-kind="image" data-edit-label={`${item.company} Logo`} data-edit-section="工作履历" />
                  </div>
                ) : (
                  <div className="career-logo-frame mt-0 grid h-[48px] w-[100px] shrink-0 place-items-center rounded-[4px] border border-white/14 bg-white/[0.035] px-3 text-center font-mono text-[9px] font-bold uppercase text-white/40 lg:mt-4" data-edit-path={`career.items.${itemIndex}.logo`} data-edit-kind="image" data-edit-label={`${item.company} Logo`} data-edit-section="工作履历">
                    {item.company.slice(0, 8)}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-white/34">Company / Role</p>
                <h3 className="mt-3 max-w-[19ch] text-[24px] font-semibold leading-[1.14] text-[#f1efe4] transition-colors duration-300 group-hover:text-white sm:text-[27px]" data-edit-path={`career.items.${itemIndex}.company`} data-edit-kind="text" data-edit-label="公司名称" data-edit-section="工作履历">
                  {item.company}
                </h3>
                <p className="mt-3 max-w-[30ch] text-xs font-semibold leading-5 text-[#e5ff48]/78" data-edit-path={`career.items.${itemIndex}.meta`} data-edit-kind="text" data-edit-label="公司性质 / 职位" data-edit-section="工作履历">{item.meta}</p>
              </div>

              <div className="career-detail-zone lg:col-span-2">
                <div className="career-summary-line relative grid min-h-[64px] gap-7 overflow-hidden pr-12 lg:grid-cols-[1.08fr_1fr] lg:gap-8 xl:gap-12">
                  <div className="hidden min-w-0 lg:block">
                    <p className="text-[10px] font-bold uppercase text-white/34">Responsibilities</p>
                    <p className="career-summary-copy mt-3 max-w-[52ch] text-sm leading-6 text-[#cfcdc1]/52" data-edit-path={`career.items.${itemIndex}.responsibilities`} data-edit-kind="text" data-edit-label="工作内容" data-edit-section="工作履历" data-edit-multiline="true">
                      {item.responsibilities}
                    </p>
                  </div>

                  <div className="min-w-0 lg:border-l lg:border-white/12 lg:pl-8 xl:pl-10">
                    <p className="text-[10px] font-bold uppercase text-[#e5ff48]">Major Project</p>
                    <h4 className="mt-3 max-w-[34ch] text-base font-semibold leading-7 text-[#f1efe4] sm:text-lg" data-edit-path={`career.items.${itemIndex}.projectTitle`} data-edit-kind="text" data-edit-label="重点项目名称" data-edit-section="工作履历">
                      {item.projectTitle}
                    </h4>
                    <p className="career-summary-copy mt-2 hidden max-w-[48ch] text-sm leading-6 text-[#cfcdc1]/44 xl:-mb-1 xl:block" data-edit-path={`career.items.${itemIndex}.projectDescription`} data-edit-kind="text" data-edit-label="重点项目介绍" data-edit-section="工作履历" data-edit-multiline="true">
                      {item.projectDescription}
                    </p>
                  </div>

                  <span className="career-expand-control absolute right-0 top-0 grid size-9 shrink-0 place-items-center rounded-full border border-white/16 text-white/46" aria-hidden="true">
                    <Plus className="career-expand-icon" size={15} strokeWidth={1.7} />
                  </span>
                </div>

                <div className="career-expand-content">
                  <div className="career-expand-inner overflow-hidden">
                    <div className="grid gap-7 lg:grid-cols-[1.08fr_1fr] lg:gap-8 xl:gap-12">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-white/34">Responsibilities</p>
                        <p className="mt-4 max-w-[52ch] text-sm leading-7 text-[#cfcdc1]/62 sm:text-[15px] sm:leading-8" data-edit-path={`career.items.${itemIndex}.responsibilities`} data-edit-kind="text" data-edit-label="工作内容" data-edit-section="工作履历" data-edit-multiline="true">
                          {item.responsibilities}
                        </p>
                      </div>

                      <div className="border-t border-white/12 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-10">
                        <p className="text-[10px] font-bold uppercase text-[#e5ff48]">Major Project</p>
                        <h4 className="mt-4 max-w-[24ch] text-lg font-semibold leading-7 text-[#f1efe4] sm:text-xl" data-edit-path={`career.items.${itemIndex}.projectTitle`} data-edit-kind="text" data-edit-label="重点项目名称" data-edit-section="工作履历">
                          {item.projectTitle}
                        </h4>
                        <p className="mt-4 max-w-[48ch] text-sm leading-7 text-[#cfcdc1]/52" data-edit-path={`career.items.${itemIndex}.projectDescription`} data-edit-kind="text" data-edit-label="重点项目介绍" data-edit-section="工作履历" data-edit-multiline="true">{item.projectDescription}</p>
                      </div>
                    </div>

                    {item.moreDetails && (
                      <div className="mt-7 border-t border-white/10 pt-5">
                        <p className="text-[10px] font-bold uppercase text-white/40">More Context</p>
                        <p className="max-w-[92ch] pb-2 pt-4 text-sm leading-7 text-[#cfcdc1]/58 sm:text-[15px] sm:leading-8" data-edit-path={`career.items.${itemIndex}.moreDetails`} data-edit-kind="text" data-edit-label="更多工作信息" data-edit-section="工作履历" data-edit-multiline="true">
                          {item.moreDetails}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CatalogCard({ item, index, duplicate = false }) {
  return (
    <div className="work-catalog-cell" data-motion-card={!duplicate ? "" : undefined}>
      <a
        className="cursor-target work-catalog-card group"
        href={detailHref(`catalog-${index}`)}
        data-edit-path={`projects.catalogItems.${index}`}
        data-edit-kind="group"
        data-edit-label={`${item.title} 内容组`}
        data-edit-section="优秀作品"
        aria-label={`Open ${item.title} gallery`}
        aria-hidden={duplicate || undefined}
        tabIndex={duplicate ? -1 : undefined}
        onClick={rememberHomeScrollPosition}
      >
        <img className="work-catalog-image" src={item.image} alt={duplicate ? "" : item.title} data-edit-path={`projects.catalogItems.${index}.image`} data-edit-kind="image" data-edit-label={`${item.title} 封面`} data-edit-section="优秀作品" data-edit-gallery-path={`projects.catalogItems.${index}.gallery`} />
        <div className="work-catalog-shade" aria-hidden="true" />
        <div className="absolute inset-x-5 top-5 z-10 flex items-center justify-between gap-4 text-[9px] font-bold uppercase text-white/72 sm:inset-x-6 sm:top-6">
          <span data-edit-path={`projects.catalogItems.${index}.category`} data-edit-kind="text" data-edit-label={`${item.title} 分类`} data-edit-section="优秀作品">{item.index} / {item.category}</span>
          <ArrowUpRight className="transition-transform duration-500 group-hover:rotate-45" size={16} />
        </div>
        <div className="absolute inset-x-5 bottom-5 z-10 sm:inset-x-6 sm:bottom-6">
          <h3 className="display-editorial max-w-[12ch] text-[28px] leading-[0.98] text-white sm:text-[34px]" data-edit-path={`projects.catalogItems.${index}.title`} data-edit-kind="text" data-edit-label="作品标题" data-edit-section="优秀作品">
            {item.title}
          </h3>
          <p className="work-catalog-description mt-4 max-w-[34ch] text-xs leading-6 text-white/64" data-edit-path={`projects.catalogItems.${index}.description`} data-edit-kind="text" data-edit-label="作品简介" data-edit-section="优秀作品" data-edit-multiline="true">
            {item.description}
          </p>
        </div>
      </a>
    </div>
  );
}

export function ProjectsSection({ content, size }) {
  const catalogItems = content.catalogItems || [];
  const catalogEntries = catalogItems.map((item, index) => ({ item, index }));
  const rowOffset = Math.ceil(catalogEntries.length / 2);
  const catalogRows = [
    catalogEntries,
    [...catalogEntries.slice(rowOffset), ...catalogEntries.slice(0, rowOffset)],
  ];

  return (
    <section
      id="projects"
      data-motion-section
      className="overflow-hidden bg-[#0d0f12] py-[clamp(52px,7dvh,72px)] text-[#eeeade] sm:py-20 lg:py-24"
      style={{ minHeight: `${Math.max(85, Number(size) || 85)}vh` }}
    >
      <div className="portfolio-layout mx-auto max-w-[1700px] px-5 sm:px-8 lg:px-12">
        <div data-motion-header>
          <div className="border-t border-white/16 pt-7">
            <div data-motion-label>
              <SectionLabel index="03">Selected Work / Portfolio</SectionLabel>
            </div>
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-end lg:gap-16">
            <div data-motion-heading-wrap className="motion-heading-mask">
              <h2 data-motion-heading className="display-editorial max-w-[14ch] text-[48px] leading-[0.94] sm:text-6xl lg:text-[74px] xl:text-[84px]" data-edit-path="projects.title" data-edit-kind="text" data-edit-label="优秀作品标题" data-edit-section="优秀作品" data-edit-multiline="true">
                {content.title}
              </h2>
            </div>
            <div data-motion-copy className="lg:justify-self-end">
              <p className="text-[10px] font-bold uppercase text-[#e5ff48]">Click a work to explore</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#cfcdc1]/58 sm:text-base sm:leading-8" data-edit-path="projects.description" data-edit-kind="text" data-edit-label="优秀作品简介" data-edit-section="优秀作品" data-edit-multiline="true">{content.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="work-catalog-stack mt-12 sm:mt-14 lg:mt-16" data-motion-group>
        {catalogRows.map((entries, rowIndex) => (
          <div
            key={rowIndex}
            className={`work-catalog-shell ${rowIndex === 1 ? "work-catalog-shell--secondary" : ""}`}
          >
            <div className="work-catalog-track">
              {[0, 1].map((groupIndex) => (
                <div key={groupIndex} className="work-catalog-group" aria-hidden={groupIndex === 1 || undefined}>
                  {entries.map(({ item, index }) => (
                    <CatalogCard
                      key={`${rowIndex}-${groupIndex}-${item.index}-${item.title}`}
                      item={item}
                      index={index}
                      duplicate={groupIndex === 1 || rowIndex === 1}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShowcaseCase({ item, index, reverse = false }) {
  const image = item.gallery?.[0] || item.image;
  const frameCount = Math.max(1, item.gallery?.length || 0);

  return (
    <article data-motion-card className="border-t border-white/14">
      <a
        className="cursor-target group grid lg:grid-cols-[1.24fr_0.76fr]"
        href={detailHref(`catalog-${index}`)}
        aria-label={`Open ${item.title} gallery`}
        onClick={rememberHomeScrollPosition}
        data-edit-path={`projects.catalogItems.${index}`}
        data-edit-kind="group"
        data-edit-label={`${item.title} 内容组`}
        data-edit-section="优秀作品"
      >
        <div className={`relative aspect-video overflow-hidden bg-[#111317] ${reverse ? "lg:order-2" : ""}`}>
          <img
            className="h-full w-full object-cover transition-[transform,filter] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.018] group-hover:saturate-[1.04]"
            src={image}
            alt={item.title}
            data-edit-path={`projects.catalogItems.${index}.gallery.0`}
            data-edit-kind="image"
            data-edit-label={`${item.title} 旗舰展示图`}
            data-edit-section="优秀作品"
            data-edit-gallery-path={`projects.catalogItems.${index}.gallery`}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(5,6,8,0.46)_100%)] opacity-60 transition-opacity duration-700 group-hover:opacity-30" />
          <span className="absolute bottom-5 right-5 grid size-12 place-items-center rounded-full border border-white/24 bg-black/42 text-white backdrop-blur-md transition-[background-color,color,transform] duration-500 group-hover:rotate-45 group-hover:bg-[#e5ff48] group-hover:text-[#090a0c] sm:bottom-7 sm:right-7">
            <ArrowUpRight size={18} />
          </span>
        </div>

        <div className={`flex min-h-[360px] flex-col justify-between gap-12 py-8 sm:min-h-[420px] sm:py-10 lg:min-h-0 lg:px-10 lg:py-12 xl:px-14 xl:py-16 ${reverse ? "lg:order-1 lg:border-r lg:border-white/12" : "lg:border-l lg:border-white/12"}`}>
          <div className="flex items-center justify-between gap-5 text-[10px] font-bold uppercase text-white/38">
            <span>{item.index} / {item.category}</span>
            <span>{String(frameCount).padStart(2, "0")} Frames</span>
          </div>
          <div>
            <h3
              className="display-editorial max-w-[11ch] text-[42px] leading-[0.94] text-[#f1efe4] sm:text-[56px] lg:text-[60px] xl:text-[68px]"
              data-edit-path={`projects.catalogItems.${index}.title`}
              data-edit-kind="text"
              data-edit-label="作品标题"
              data-edit-section="优秀作品"
            >
              {item.title}
            </h3>
            <p
              className="mt-7 max-w-[42ch] text-sm leading-7 text-[#cfcdc1]/62 sm:text-base sm:leading-8"
              data-edit-path={`projects.catalogItems.${index}.description`}
              data-edit-kind="text"
              data-edit-label="作品简介"
              data-edit-section="优秀作品"
              data-edit-multiline="true"
            >
              {item.description}
            </p>
            <span className="mt-9 inline-flex min-h-11 items-center gap-3 border-b border-[#e5ff48]/55 pb-2 text-[10px] font-bold uppercase text-[#e5ff48] transition-[gap,border-color] duration-300 group-hover:gap-5 group-hover:border-[#e5ff48]">
              View full case study <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}

function ShowcaseArchiveItem({ item, index, duplicate = false }) {
  return (
    <a
      data-motion-card={!duplicate ? "" : undefined}
      className="cursor-target showcase-archive-card group block border-t border-white/14 pt-5"
      href={detailHref(`catalog-${index}`)}
      aria-label={`Open ${item.title} gallery`}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
      onClick={rememberHomeScrollPosition}
      data-edit-path={duplicate ? undefined : `projects.catalogItems.${index}`}
      data-edit-kind={duplicate ? undefined : "group"}
      data-edit-label={duplicate ? undefined : `${item.title} 内容组`}
      data-edit-section={duplicate ? undefined : "优秀作品"}
    >
      <div className="relative aspect-video overflow-hidden bg-[#111317]">
        <img
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]"
          src={item.image}
          alt={duplicate ? "" : item.title}
          data-edit-path={duplicate ? undefined : `projects.catalogItems.${index}.image`}
          data-edit-kind={duplicate ? undefined : "image"}
          data-edit-label={duplicate ? undefined : `${item.title} 封面`}
          data-edit-section={duplicate ? undefined : "优秀作品"}
          data-edit-gallery-path={duplicate ? undefined : `projects.catalogItems.${index}.gallery`}
        />
      </div>
      <div className="flex items-start justify-between gap-5 py-6">
        <div>
          <p className="text-[9px] font-bold uppercase text-white/36">{item.index} / {item.category}</p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight text-[#f1efe4]" data-edit-path={duplicate ? undefined : `projects.catalogItems.${index}.title`} data-edit-kind={duplicate ? undefined : "text"} data-edit-label={duplicate ? undefined : "作品标题"} data-edit-section={duplicate ? undefined : "优秀作品"}>{item.title}</h3>
          <p className="mt-4 max-w-[38ch] text-sm leading-7 text-[#cfcdc1]/52" data-edit-path={duplicate ? undefined : `projects.catalogItems.${index}.description`} data-edit-kind={duplicate ? undefined : "text"} data-edit-label={duplicate ? undefined : "作品简介"} data-edit-section={duplicate ? undefined : "优秀作品"} data-edit-multiline={duplicate ? undefined : "true"}>{item.description}</p>
        </div>
        <ArrowUpRight className="mt-1 shrink-0 text-white/42 transition-[transform,color] duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#e5ff48]" size={18} />
      </div>
    </a>
  );
}

export function ProjectsShowcasePreview({ content }) {
  const catalogItems = content.catalogItems || [];
  const featuredItems = Array.from({ length: 4 }, (_, index) => ({
    ...(catalogItems[index] || {}),
    ...(content.mosaicItems?.[index] || {}),
  }));
  const archiveItems = catalogItems.slice(-4);
  const archiveStartIndex = Math.max(0, catalogItems.length - archiveItems.length);
  const primary = featuredItems[0];
  const portrait = featuredItems[1] || primary;
  const landscape = featuredItems[2] || primary;
  const vertical = featuredItems[3] || landscape || primary;
  const archiveLoopLength = archiveItems.length ? Math.ceil(8 / archiveItems.length) * archiveItems.length : 0;
  const archiveLoopItems = Array.from(
    { length: archiveLoopLength },
    (_, index) => ({ item: archiveItems[index % archiveItems.length], sourceIndex: index % archiveItems.length }),
  );

  if (!primary) return null;

  return (
    <section id="projects" data-motion-section className="featured-mosaic-section overflow-hidden bg-[#050505] px-5 py-14 text-white sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="portfolio-layout mx-auto max-w-[1700px]">
        <div data-motion-header className="mb-7 flex items-end justify-between gap-6 border-t border-white/16 pt-6 sm:mb-9">
          <p className="text-[10px] font-bold uppercase text-white/42">Selected Work / 01-04</p>
          <p className="max-w-[42ch] text-right text-[10px] font-semibold uppercase leading-5 text-white/34">Brand systems · E-commerce · AI visual production</p>
        </div>

        <div data-motion-group className="featured-mosaic">
          <a
            className="cursor-target featured-mosaic__card featured-mosaic__card--hero group"
            href={detailHref("catalog-0")}
            onClick={rememberHomeScrollPosition}
            data-edit-path="projects.mosaicItems.0"
            data-edit-kind="group"
            data-edit-label={`${primary.title} 主视觉卡片`}
            data-edit-section="优秀作品"
            data-edit-layout-key="featured-mosaic-hero"
            data-edit-drag-root="true"
          >
            <img src={primary.image} alt={primary.title} data-edit-path="projects.mosaicItems.0.image" data-edit-kind="image" data-edit-label={`${primary.title} 拼贴图片`} data-edit-section="优秀作品" />
            <div className="featured-mosaic__shade" />
            <div className="featured-mosaic__hero-copy">
              <p data-edit-path="projects.mosaicItems.0.category" data-edit-kind="text" data-edit-label="主项目分类" data-edit-section="优秀作品">{primary.category}</p>
              <h2 data-edit-path="projects.title" data-edit-kind="text" data-edit-label="优秀作品标题" data-edit-section="优秀作品" data-edit-multiline="true">{content.title}</h2>
              <span data-edit-path="projects.description" data-edit-kind="text" data-edit-label="优秀作品简介" data-edit-section="优秀作品" data-edit-multiline="true">{content.description}</span>
            </div>
            <span className="featured-mosaic__copyright">©</span>
          </a>

          <a
            className="cursor-target featured-mosaic__card featured-mosaic__card--portrait group"
            href={detailHref("catalog-1")}
            onClick={rememberHomeScrollPosition}
            data-edit-path="projects.mosaicItems.1"
            data-edit-kind="group"
            data-edit-label={`${portrait.title} 辅助卡片`}
            data-edit-section="优秀作品"
            data-edit-layout-key="featured-mosaic-portrait"
            data-edit-drag-root="true"
          >
            <img src={portrait.image} alt={portrait.title} data-edit-path="projects.mosaicItems.1.image" data-edit-kind="image" data-edit-label={`${portrait.title} 拼贴图片`} data-edit-section="优秀作品" />
            <div className="featured-mosaic__shade featured-mosaic__shade--soft" />
            <span className="featured-mosaic__arrow"><ArrowRight size={25} /></span>
            <p className="featured-mosaic__micro-label" data-edit-path="projects.mosaicItems.1.title" data-edit-kind="text" data-edit-label="作品标题" data-edit-section="优秀作品">{portrait.title}</p>
          </a>

          <a
            className="cursor-target featured-mosaic__card featured-mosaic__card--landscape group"
            href={detailHref("catalog-2")}
            onClick={rememberHomeScrollPosition}
            data-edit-path="projects.mosaicItems.2"
            data-edit-kind="group"
            data-edit-label={`${landscape.title} 横向卡片`}
            data-edit-section="优秀作品"
            data-edit-layout-key="featured-mosaic-landscape"
            data-edit-drag-root="true"
          >
            <img src={landscape.image} alt={landscape.title} data-edit-path="projects.mosaicItems.2.image" data-edit-kind="image" data-edit-label={`${landscape.title} 拼贴图片`} data-edit-section="优秀作品" />
            <div className="featured-mosaic__shade featured-mosaic__shade--soft" />
            <div className="featured-mosaic__corner-copy">
              <p data-edit-path="projects.mosaicItems.2.category" data-edit-kind="text" data-edit-label="作品分类" data-edit-section="优秀作品">{landscape.category}</p>
              <h3 data-edit-path="projects.mosaicItems.2.title" data-edit-kind="text" data-edit-label="作品标题" data-edit-section="优秀作品">{landscape.title}</h3>
            </div>
          </a>

          <div className="featured-mosaic__rail">
            <a
              className="cursor-target featured-mosaic__card featured-mosaic__card--vertical group"
              href={detailHref("catalog-3")}
              onClick={rememberHomeScrollPosition}
              data-edit-path="projects.mosaicItems.3"
              data-edit-kind="group"
              data-edit-label={`${vertical.title} 竖向卡片`}
              data-edit-section="优秀作品"
              data-edit-layout-key="featured-mosaic-vertical"
              data-edit-drag-root="true"
            >
              <img src={vertical.image} alt={vertical.title} data-edit-path="projects.mosaicItems.3.image" data-edit-kind="image" data-edit-label={`${vertical.title} 拼贴图片`} data-edit-section="优秀作品" />
              <div className="featured-mosaic__shade featured-mosaic__shade--top" />
            </a>
            <a className="cursor-target featured-mosaic__info group" href={detailHref("catalog-3")} onClick={rememberHomeScrollPosition}>
              <div>
                <h3 data-edit-path="projects.mosaicItems.3.title" data-edit-kind="text" data-edit-label="作品标题" data-edit-section="优秀作品">{vertical.title}</h3>
                <p data-edit-path="projects.mosaicItems.3.description" data-edit-kind="text" data-edit-label="作品简介" data-edit-section="优秀作品" data-edit-multiline="true">{vertical.description}</p>
              </div>
              <div className="featured-mosaic__info-meta">
                <strong>{vertical.index}</strong>
                <span><ArrowUpRight size={22} /></span>
              </div>
            </a>
          </div>
        </div>

        {archiveItems.length > 0 && (
          <div data-motion-subsection className="mt-16 sm:mt-20 lg:mt-24">
            <div data-motion-header className="flex flex-col gap-5 border-b border-white/14 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <h3
                data-motion-heading
                className="display-editorial text-[40px] leading-none text-[#f1efe4] sm:text-[54px]"
                data-edit-path="projects.archiveTitle"
                data-edit-kind="text"
                data-edit-label="更多作品标题"
                data-edit-section="优秀作品"
                data-edit-multiline="true"
              >
                {content.archiveTitle ?? "More selected work."}
              </h3>
              <p
                className="max-w-lg text-sm leading-7 text-[#cfcdc1]/52"
                data-edit-path="projects.archiveDescription"
                data-edit-kind="text"
                data-edit-label="更多作品说明"
                data-edit-section="优秀作品"
                data-edit-multiline="true"
              >
                {content.archiveDescription ?? "AI 创意、IP 角色与视觉规范持续循环展示；悬停作品可暂停移动并进入完整案例。"}
              </p>
            </div>
            <div data-motion-group className="showcase-archive-shell mt-9">
              <div className="showcase-archive-track">
                {[0, 1].map((groupIndex) => (
                  <div className="showcase-archive-group" key={groupIndex} aria-hidden={groupIndex === 1 || undefined}>
                    {archiveLoopItems.map(({ item, sourceIndex }, archiveIndex) => (
                      <ShowcaseArchiveItem
                        key={`${groupIndex}-${archiveIndex}-${item.index}-${item.title}`}
                        item={item}
                        index={sourceIndex + archiveStartIndex}
                        duplicate={groupIndex === 1 || archiveIndex >= archiveItems.length}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function StrengthsSection({ content, capabilities, size }) {
  return (
    <section
      id="strengths"
      data-motion-section
      className="bg-[#08090b] px-5 py-14 text-[#e8e6d8] sm:px-8 sm:py-16 lg:px-12 lg:py-16"
      style={{ minHeight: `${Math.max(88, Math.min(100, Number(size) || 92))}vh` }}
    >
      <div className="portfolio-layout mx-auto max-w-[1700px]">
        <div data-motion-header>
          <div className="border-t border-white/16 pt-7">
            <div data-motion-label>
              <SectionLabel index="04">Strengths / Capabilities</SectionLabel>
            </div>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16">
            <div data-motion-heading-wrap className="motion-heading-mask">
              <h2 data-motion-heading className="display-editorial max-w-[14ch] text-[46px] leading-[0.95] sm:text-7xl lg:text-[76px] xl:text-[88px]" data-edit-path="blog.title" data-edit-kind="text" data-edit-label="个人优势标题" data-edit-section="个人优势" data-edit-multiline="true">{content.title}</h2>
            </div>
            <p data-motion-copy className="max-w-2xl text-sm leading-7 text-[#cfcdc1]/58 sm:text-base sm:leading-8 lg:justify-self-end" data-edit-path="blog.description" data-edit-kind="text" data-edit-label="个人优势简介" data-edit-section="个人优势" data-edit-multiline="true">{content.description}</p>
          </div>
        </div>

        <div data-motion-group className="mt-14 grid gap-3 lg:mt-18 lg:grid-cols-3">
          {content.items.map((item, index) => (
            <a
              key={`${item.category}-${item.title}`}
              data-motion-card
              data-edit-path={`blog.items.${index}`}
              data-edit-kind="group"
              data-edit-label={`${item.title} 内容组`}
              data-edit-section="个人优势"
              className="cursor-target specular-frame specular-frame--quiet group relative block min-h-[400px] overflow-hidden rounded-[6px] border border-white/10 bg-[#14161a] sm:min-h-[470px]"
              href={detailHref(`blog-${index}`)}
              onClick={rememberHomeScrollPosition}
              onPointerMove={steerSpecularEdge}
              onPointerLeave={resetSpecularEdge}
            >
              <img data-parallax className="media-zoom absolute inset-x-0 h-full w-full object-cover opacity-55 grayscale-[0.28]" src={item.asset} alt={item.title} data-edit-path={`blog.items.${index}.asset`} data-edit-kind="image" data-edit-label={`${item.title} 封面`} data-edit-section="个人优势" data-edit-gallery-path={`blog.items.${index}.gallery`} />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,10,0.15),rgba(7,8,10,0.92))]" />
              <div className="absolute inset-6 flex flex-col justify-between sm:inset-8">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-white/52">
                  <span data-edit-path={`blog.items.${index}.category`} data-edit-kind="text" data-edit-label="优势分类" data-edit-section="个人优势">{item.category}</span>
                  <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" size={18} />
                </div>
                <div>
                  <h3 className="display-editorial text-4xl leading-[0.98] text-white sm:text-5xl" data-edit-path={`blog.items.${index}.title`} data-edit-kind="text" data-edit-label="优势标题" data-edit-section="个人优势">{item.title}</h3>
                  <p className="mt-4 text-xs font-semibold uppercase text-[#e5ff48]" data-edit-path={`blog.items.${index}.meta`} data-edit-kind="text" data-edit-label="优势副标签" data-edit-section="个人优势">{item.meta}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div data-motion-subsection className="mt-14 sm:mt-20 lg:mt-28">
          <div data-motion-header className="flex flex-col gap-5 border-b border-white/14 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-motion-label className="text-[10px] font-bold uppercase text-[#e5ff48]" data-edit-path="resume.eyebrow" data-edit-kind="text" data-edit-label="能力列表小标题" data-edit-section="个人优势">{capabilities.eyebrow}</p>
              <div data-motion-heading-wrap className="motion-heading-mask mt-4">
                <h3 data-motion-heading className="display-editorial max-w-[16ch] text-4xl leading-[0.96] text-[#f0eee3] sm:text-6xl" data-edit-path="resume.title" data-edit-kind="text" data-edit-label="能力列表标题" data-edit-section="个人优势" data-edit-multiline="true">{capabilities.title}</h3>
              </div>
            </div>
            <p data-motion-copy className="max-w-xl text-sm leading-7 text-[#cfcdc1]/52" data-edit-path="resume.description" data-edit-kind="text" data-edit-label="能力列表简介" data-edit-section="个人优势" data-edit-multiline="true">{capabilities.description}</p>
          </div>

          <div
            data-motion-group
            className="specular-frame specular-frame--quiet grid overflow-hidden rounded-[6px] sm:grid-cols-2 lg:grid-cols-4"
            onPointerMove={steerSpecularEdge}
            onPointerLeave={resetSpecularEdge}
          >
            {capabilities.items.map((item, index) => (
              <a
                key={item.step}
                data-motion-card
                data-edit-path={`resume.items.${index}`}
                data-edit-kind="group"
                data-edit-label={`${item.title} 内容组`}
                data-edit-section="个人优势"
                className={`cursor-target group min-h-[220px] border-white/12 p-5 transition-colors hover:bg-[#11141a] sm:min-h-[300px] sm:p-8 ${index % 4 ? "lg:border-l" : ""} ${index >= 4 ? "border-t" : ""} ${index % 2 ? "sm:border-l" : ""}`}
                href={detailHref(`resume-${index}`)}
                onClick={rememberHomeScrollPosition}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-white/40">
                  <span data-edit-path={`resume.items.${index}.step`} data-edit-kind="text" data-edit-label="能力序号" data-edit-section="个人优势">{item.step}</span>
                  <ArrowUpRight className="opacity-0 transition-opacity group-hover:opacity-100" size={16} />
                </div>
                <h4 className="display-editorial mt-10 text-3xl leading-none text-[#efede1] sm:mt-16" data-edit-path={`resume.items.${index}.title`} data-edit-kind="text" data-edit-label="能力标题" data-edit-section="个人优势">{item.title}</h4>
                <p className="mt-5 text-sm leading-7 text-[#cfcdc1]/48" data-edit-path={`resume.items.${index}.description`} data-edit-kind="text" data-edit-label="能力描述" data-edit-section="个人优势" data-edit-multiline="true">{item.description}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VisualReelCard({ item, duplicate = false }) {
  const imagePath = `projects.visualItems.${item.visualIndex}.image`;

  return (
    <a
      className="cursor-target visual-reel-card group relative block overflow-hidden rounded-[8px] border border-white/10 bg-[#111318]"
      href={detailHref(`catalog-${item.projectIndex}`)}
      aria-label={`Open ${item.title} gallery`}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
      onClick={rememberHomeScrollPosition}
      data-motion-card={!duplicate ? "" : undefined}
      data-edit-path={duplicate ? undefined : imagePath}
      data-edit-kind={duplicate ? undefined : "image"}
      data-edit-label={duplicate ? undefined : `${item.title} 视觉样本`}
      data-edit-section={duplicate ? undefined : "视觉作品"}
    >
      <img
        className="absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035] group-hover:saturate-[1.08]"
        src={item.image}
        alt={duplicate ? "" : `${item.title} visual sample`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(5,6,8,0.78)_100%)] opacity-65 transition-opacity duration-500 group-hover:opacity-90" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-5 p-5 opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:p-6">
        <div>
          <p className="text-[9px] font-bold uppercase text-[#e5ff48]">{item.category}</p>
          <h3 className="mt-2 max-w-[20ch] text-lg font-semibold leading-tight text-white sm:text-xl">{item.title}</h3>
        </div>
        <ArrowUpRight className="shrink-0 text-white" size={18} />
      </div>
    </a>
  );
}

function VisualReelRow({ items, reverse = false }) {
  return (
    <div className="visual-reel-shell">
      <div className={`visual-reel-track ${reverse ? "visual-reel-track--reverse" : ""}`}>
        {[0, 1].map((groupIndex) => (
          <div className="visual-reel-group" key={groupIndex} aria-hidden={groupIndex === 1 || undefined}>
            {items.map((item) => (
              <VisualReelCard
                key={`${groupIndex}-${item.visualIndex}`}
                item={item}
                duplicate={groupIndex === 1}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisualGallerySection({ content }) {
  const sourceItems = content.visualItems?.length
    ? content.visualItems
    : (content.catalogItems || []).flatMap((project, projectIndex) => {
        const images = project.gallery?.length ? project.gallery : [project.image];
        return images.filter(Boolean).map((image) => ({
          image,
          projectIndex,
          title: project.title,
          category: project.category,
        }));
      });
  const visualItems = sourceItems.map((item, visualIndex) => ({ ...item, visualIndex }));
  const firstRow = visualItems.filter((_, index) => index % 2 === 0);
  const secondRow = visualItems.filter((_, index) => index % 2 === 1);

  if (!firstRow.length || !secondRow.length) return null;

  return (
    <section id="visual-range" data-motion-section className="overflow-hidden bg-[#0a0c0f] py-14 text-[#eeeade] sm:py-16 lg:py-16">
      <div className="portfolio-layout mx-auto max-w-[1700px] px-5 sm:px-8 lg:px-12">
        <div data-motion-header className="grid gap-8 border-t border-white/16 pt-7 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-20">
          <div>
            <div data-motion-label>
              <SectionLabel index="05">Visual Range / Selected Experiments</SectionLabel>
            </div>
            <div data-motion-heading-wrap className="motion-heading-mask motion-heading-mask--descender mt-8">
              <h2 data-motion-heading className="display-editorial max-w-[12ch] text-[50px] leading-[0.94] sm:text-[72px] lg:text-[88px] xl:text-[98px]">
                Visual range.
              </h2>
            </div>
            <p className="mt-4 text-lg font-semibold text-[#cfcdc1]/64 sm:text-2xl">不同风格的视觉作品</p>
          </div>
          <div data-motion-copy className="lg:justify-self-end">
            <p className="max-w-[48ch] text-sm leading-7 text-[#cfcdc1]/58 sm:text-base sm:leading-8">
              从电商内容、品牌系统与零售终端，到 AI 创意和角色视觉，以连续画面呈现不同项目语境下的设计跨度。
            </p>
            <p className="mt-5 text-[9px] font-bold uppercase text-[#e5ff48]">Hover to pause / Click to explore</p>
          </div>
        </div>
      </div>

      <div data-motion-group className="mt-12 space-y-4 sm:mt-16 sm:space-y-5 lg:mt-20 lg:space-y-6">
        <VisualReelRow items={firstRow} />
        <VisualReelRow items={secondRow} reverse />
      </div>
    </section>
  );
}

export function ContactSection({ content, projects }) {
  const availableWorks = projects?.contactItems?.length ? projects.contactItems : projects?.catalogItems || [];
  const contactWorks = availableWorks.length
    ? Array.from({ length: 7 }, (_, index) => availableWorks[index % availableWorks.length])
    : [];

  return (
    <section
      id="contact"
      data-motion-section
      className="contact-showcase relative min-h-[780px] overflow-hidden bg-white text-[#111]"
    >
      <div className="contact-showcase__intro relative z-20 mx-auto flex max-w-[920px] flex-col items-center px-6 pt-10 text-center sm:pt-12 lg:pt-9">
        <p className="contact-showcase__eyebrow" data-edit-path="about.contactEyebrow" data-edit-kind="text" data-edit-label="联系页顶部提示" data-edit-section="联系方式">
          <span /> {content.contactEyebrow ?? "Available for collaboration → Build better brands"}
        </p>
        <div className="mt-5">
          <h2 className="contact-showcase__title">
            <span data-edit-path="about.contactTitleLine1" data-edit-kind="text" data-edit-label="联系页标题第一行" data-edit-section="联系方式">{content.contactTitleLine1 ?? "Visuals designed for"}</span>
            <span><span data-edit-path="about.contactTitleLine2" data-edit-kind="text" data-edit-label="联系页标题第二行" data-edit-section="联系方式">{content.contactTitleLine2 ?? "speed, clarity, and"}</span> <em data-edit-path="about.contactTitleAccent" data-edit-kind="text" data-edit-label="联系页斜体标题" data-edit-section="联系方式">{content.contactTitleAccent ?? "conversion."}</em></span>
          </h2>
        </div>
        <p className="contact-showcase__description" data-edit-path="about.bio" data-edit-kind="text" data-edit-label="联系页简介" data-edit-section="联系方式" data-edit-multiline="true">
          {content.bio}
        </p>
        <div className="contact-showcase__actions">
          <a className="cursor-target contact-showcase__button contact-showcase__button--primary" href={`mailto:${content.email}`} data-edit-path="about.email" data-edit-kind="text" data-edit-label="联系邮箱" data-edit-section="联系方式">
            Book a call today
          </a>
          <a className="cursor-target contact-showcase__button contact-showcase__button--secondary" href="#projects">
            Recent projects <ArrowUpRight size={13} />
          </a>
        </div>
      </div>

      <div className="contact-showcase__works" aria-label="Selected portfolio previews">
        {contactWorks.map((item, index) => (
          <a
            key={`${item.title}-${index}`}
            className={`cursor-target contact-showcase__work contact-showcase__work--${index + 1}`}
            href={detailHref(`catalog-${item.projectIndex ?? index % Math.max(1, projects?.catalogItems?.length || 1)}`)}
            onClick={rememberHomeScrollPosition}
            data-edit-path={`projects.contactItems.${index}`}
            data-edit-kind="group"
            data-edit-label={`${item.title} 联系页作品卡`}
            data-edit-section="联系方式"
            data-edit-layout-key={`contact-work-${index}`}
            data-edit-drag-root="true"
            data-edit-draggable="true"
          >
            <img src={item.image} alt={item.title} data-edit-path={`projects.contactItems.${index}.image`} data-edit-kind="image" data-edit-label={`${item.title} 联系页图片`} data-edit-section="联系方式" />
          </a>
        ))}
      </div>

      <div className="contact-showcase__capabilities">
        <span>Brand Design</span>
        <span>Visual Systems</span>
        <span>E-commerce</span>
        <span>AI Creative</span>
        <span>Omnichannel</span>
        <span>IP Design</span>
      </div>

      <footer className="contact-showcase__footer">
        <p data-edit-path="about.location" data-edit-kind="text" data-edit-label="地点" data-edit-section="联系方式">{content.location}</p>
        <p data-edit-path="about.wechat" data-edit-kind="text" data-edit-label="微信号" data-edit-section="联系方式">{content.wechat ? `WeChat · ${content.wechat}` : ""}</p>
        <a className="cursor-target" href="#top" aria-label="Back to top"><ArrowUpRight size={15} /></a>
      </footer>
    </section>
  );
}
