export const DEFAULT_CONTENT = {
  brand: "CodeNest",
  logoImage: "",
  navigation: {
    projects: "PROJECTS",
    blog: "BLOG",
    about: "ABOUT",
    resume: "RESUME",
  },
  eyebrow: "Career-Ready Curriculum",
  headline: "Launch your coding career",
  description:
    "Master in-demand coding skills through focused projects, expert feedback, and a portfolio designed to get you hired.",
  ctaLabel: "Get Started",
  mediaMode: "galaxy",
  backgroundImage: "",
  card: {
    year: "[ 2025 ]",
    lead: "Taught by",
    accent: "Industry",
    tail: "Professionals",
    description: "Learn production workflows from engineers building real products at scale.",
  },
  sectionSizes: {
    projects: 230,
    blog: 100,
    resume: 170,
    about: 110,
  },
  projects: {
    eyebrow: "Project-Based Learning",
    title: "Build work that proves what you can do.",
    description:
      "Move from guided fundamentals to portfolio-ready products. Each project mirrors the decisions, constraints, and feedback loops of a real engineering team.",
    items: [
      {
        index: "01",
        title: "Ship a production-ready product",
        label: "Full-stack systems",
        description:
          "Design the data model, build the interface, connect the API, and deploy a product that can be reviewed like real work.",
        metric: "8-week guided build",
        asset:
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=85",
        galleryHeight: 72,
        gallery: [
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        index: "02",
        title: "Learn inside a professional workflow",
        label: "Reviews and iteration",
        description:
          "Work with tickets, branches, code review, design constraints, and structured feedback instead of isolated tutorial exercises.",
        metric: "Weekly expert review",
        asset:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=85",
        galleryHeight: 72,
        gallery: [
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        index: "03",
        title: "Turn the project into career proof",
        label: "Portfolio and interview",
        description:
          "Document your decisions, present the trade-offs, and practice explaining the work with the clarity hiring teams expect.",
        metric: "Publishable case study",
        asset:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=85",
        galleryHeight: 72,
        gallery: [
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=2000&q=88",
        ],
      },
    ],
  },
  blog: {
    eyebrow: "Field Notes",
    title: "Clear thinking for the work between lessons.",
    description:
      "Short, practical notes on building, debugging, collaborating, and becoming easier to hire.",
    items: [
      {
        category: "Learning",
        title: "Why copying code feels fast and learning feels slow",
        meta: "6 min read",
        asset:
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        category: "Portfolio",
        title: "A project becomes impressive when the decisions are visible",
        meta: "8 min read",
        asset:
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        category: "Career",
        title: "How to speak about unfinished work in an interview",
        meta: "5 min read",
        asset:
          "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2000&q=88",
        ],
      },
    ],
  },
  resume: {
    eyebrow: "The Learning Path",
    title: "A curriculum that moves from understanding to ownership.",
    description:
      "Each stage reduces support and increases responsibility, so confidence grows from evidence rather than motivation alone.",
    items: [
      {
        step: "01",
        title: "Foundations",
        description: "Programming logic, Git, the browser, APIs, data, and the habits that make debugging repeatable.",
        asset: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        step: "02",
        title: "Guided builds",
        description: "Small products with clear constraints, review checkpoints, and professional implementation patterns.",
        asset: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        step: "03",
        title: "Independent project",
        description: "Own the architecture, scope, trade-offs, testing, deployment, and written product narrative.",
        asset: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        step: "04",
        title: "Career launch",
        description: "Portfolio review, technical storytelling, interview practice, and a focused application strategy.",
        asset: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        step: "05",
        title: "Frontend craft",
        description: "Build responsive interfaces with strong hierarchy, accessible interaction, and maintainable component systems.",
        asset: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1400&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        step: "06",
        title: "Backend systems",
        description: "Model data, design reliable APIs, handle authentication, and reason clearly about system boundaries.",
        asset: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        step: "07",
        title: "Team workflow",
        description: "Practice planning, branching, reviews, written decisions, and the communication habits behind dependable delivery.",
        asset: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=2000&q=88",
        ],
      },
      {
        step: "08",
        title: "Professional growth",
        description: "Create a repeatable plan for learning, shipping, gathering feedback, and growing after the course ends.",
        asset: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85",
        galleryHeight: 68,
        gallery: [
          "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=88",
          "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=2000&q=88",
        ],
      },
    ],
  },
  about: {
    eyebrow: "Personal Introduction",
    title: "Teaching the parts of coding that tutorials leave out.",
    name: "The person behind CodeNest",
    role: "Founder / Lead Instructor",
    bio:
      "CodeNest was built around a simple belief: people learn faster when the work feels real, the feedback is specific, and the path is calm enough to follow. Replace this text with your own background, teaching philosophy, experience, and the kind of students or clients you want to work with.",
    email: "hello@codenest.dev",
    location: "Remote / Worldwide",
    image:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1400&q=85",
    galleryHeight: 72,
    gallery: [
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=2000&q=88",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=88",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2000&q=88",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=88",
    ],
  },
};

export const CONTENT_STORAGE_KEY = "codenest-content-v2";
