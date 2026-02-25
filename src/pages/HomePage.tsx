import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RevealOnView } from "../components/layout/RevealOnView";
import { articles, projects, workExperiences } from "../data/blog";

const navItems = [
  { id: "home", label: "首页" },
  { id: "projects", label: "个人项目" },
  { id: "experience", label: "工作经历" },
  { id: "articles", label: "文章列表" },
] as const;

function projectGradient(index: number) {
  const gradients = [
    "from-emerald-500 to-indigo-500",
    "from-amber-500 to-orange-500",
    "from-cyan-500 to-blue-600",
    "from-fuchsia-500 to-pink-600",
  ];

  return gradients[index % gradients.length];
}

export function HomePage() {
  const [activeSection, setActiveSection] = useState("home");
  const [isNavSolid, setIsNavSolid] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const currentProject = useMemo(() => projects[currentSlide % projects.length], [currentSlide]);

  useEffect(() => {
    const onScroll = () => setIsNavSolid(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % projects.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    if (index < 0) {
      setCurrentSlide(projects.length - 1);
      return;
    }

    setCurrentSlide(index % projects.length);
  };

  return (
    <main className="blog-theme blog-grid-bg page-enter min-h-screen text-[#f4f4f5]">
      <div className="blog-glow blog-glow-1" aria-hidden="true" />
      <div className="blog-glow blog-glow-2" aria-hidden="true" />

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isNavSolid ? "border-b border-[#27272a] bg-[#0a0a0b]/88 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#home" className="blog-nav-brand text-xl font-bold tracking-tight">
            <span className="text-[#f59e0b]">Dev</span>Blog
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`blog-nav-link ${activeSection === item.id ? "active" : ""}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-md border border-[#27272a] p-2 text-[#f4f4f5] md:hidden"
            aria-label="打开菜单"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-[#27272a] bg-[#111114]/95 px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileOpen(false);
                  }}
                  className={`blog-nav-link ${activeSection === item.id ? "active" : ""}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <section id="home" className="relative z-10 flex min-h-screen items-center pt-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <RevealOnView>
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#111114]/80 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-[#a1a1aa]">开放工作机会</span>
              </div>

              <h1 className="text-4xl font-bold leading-tight md:text-6xl">
                你好，我是
                <br />
                <span className="text-[#f59e0b]">全栈开发者</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg text-[#a1a1aa]">
                专注于构建高性能、用户友好的 Web 应用。热衷于探索前沿技术，分享开发经验与技术见解。
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#projects"
                  onClick={() => setActiveSection("projects")}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#f59e0b] px-6 py-3 font-semibold text-[#0a0a0b] transition hover:bg-[#fbbf24]"
                >
                  查看项目
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="#articles"
                  onClick={() => setActiveSection("articles")}
                  className="rounded-lg border border-[#27272a] px-6 py-3 text-[#f4f4f5] transition hover:border-[#f59e0b]"
                >
                  阅读文章
                </a>
              </div>
            </div>
          </RevealOnView>

          <RevealOnView>
            <div className="relative">
              <div className="rounded-2xl border border-[#27272a] bg-[#111114]/80 p-6">
                <div className="rounded-lg border border-[#27272a] bg-[#0a0a0b] p-4 font-mono text-sm text-[#a1a1aa]">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <pre className="overflow-x-auto">
                    <code>{`const developer = {
  name: "张三",
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python"
  ],
  passion: "Building great products",
  available: true
};

developer.createAmazingThings();`}</code>
                  </pre>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-lg border border-[#f59e0b]/35" />
              <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full border border-[#f59e0b]/20" />
            </div>
          </RevealOnView>
        </div>
      </section>

      <section id="projects" className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <RevealOnView>
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">个人项目</h2>
              <p className="mx-auto mt-4 max-w-xl text-[#a1a1aa]">精选一些我独立完成或参与开发的项目，涵盖 Web 应用、工具工程与 AI 产品。</p>
            </div>
          </RevealOnView>

          <RevealOnView>
            <div className="relative overflow-hidden rounded-2xl border border-[#27272a] bg-[#111114]/80 p-6 md:p-8">
              <button
                type="button"
                onClick={() => goToSlide(currentSlide - 1)}
                className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#27272a] bg-[#0a0a0b] text-[#f4f4f5] transition hover:border-[#f59e0b] hover:text-[#f59e0b]"
                aria-label="上一个项目"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() => goToSlide(currentSlide + 1)}
                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#27272a] bg-[#0a0a0b] text-[#f4f4f5] transition hover:border-[#f59e0b] hover:text-[#f59e0b]"
                aria-label="下一个项目"
              >
                ›
              </button>

              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div className={`flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br ${projectGradient(currentSlide)}`}>
                  <img src={currentProject.screenshots[0]?.src} alt={currentProject.screenshots[0]?.alt} className="h-full w-full rounded-xl object-cover opacity-85" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold">{currentProject.title}</h3>
                  <p className="mt-2 text-sm text-[#a1a1aa]">{currentProject.subtitle}</p>
                  <p className="mt-4 text-[#d4d4d8]">{currentProject.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentProject.techStack.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#f59e0b]/15 px-3 py-1 text-xs text-[#f59e0b]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/projects/${currentProject.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#f59e0b] hover:text-[#fbbf24]"
                  >
                    查看详情 →
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              {projects.map((project, index) => (
                <button
                  type="button"
                  key={project.slug}
                  onClick={() => goToSlide(index)}
                  className={`carousel-dot ${currentSlide === index ? "active" : ""}`}
                  aria-label={`跳转到项目 ${index + 1}`}
                />
              ))}
            </div>
          </RevealOnView>
        </div>
      </section>

      <section id="experience" className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <RevealOnView>
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">工作经历</h2>
              <p className="mt-4 text-[#a1a1aa]">我的职业成长之路</p>
            </div>
          </RevealOnView>

          <div className="relative">
            <div className="absolute left-4 top-0 h-full w-px bg-[#27272a] md:left-1/2" />
            <div className="space-y-10">
              {workExperiences.map((experience, index) => (
                <RevealOnView key={experience.id}>
                  <div className={`relative pl-12 md:pl-0 ${index % 2 === 0 ? "md:pr-[50%]" : "md:pl-[50%]"}`}>
                    <span className="absolute left-[9px] top-3 h-3 w-3 rounded-full bg-[#f59e0b] md:left-1/2 md:-translate-x-1/2" />
                    <article className={`card-interactive rounded-2xl border border-[#27272a] bg-[#111114]/80 p-6 ${index % 2 === 0 ? "md:mr-8 md:text-right" : "md:ml-8"}`}>
                      <p className="text-sm font-semibold text-[#f59e0b]">{experience.period}</p>
                      <h3 className="mt-2 text-2xl font-semibold">{experience.company}</h3>
                      <p className="mt-1 text-[#a1a1aa]">{experience.role}</p>
                      <p className="mt-3 text-sm text-[#d4d4d8]">{experience.summary}</p>
                      <div className={`mt-4 flex flex-wrap gap-2 ${index % 2 === 0 ? "md:justify-end" : ""}`}>
                        {experience.highlights.slice(0, 3).map((item) => (
                          <span key={item} className="rounded-full bg-[#f59e0b]/15 px-3 py-1 text-xs text-[#f59e0b]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>
                </RevealOnView>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="articles" className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <RevealOnView>
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">文章列表</h2>
              <p className="mt-4 text-[#a1a1aa]">技术分享与思考</p>
            </div>
          </RevealOnView>

          <RevealOnView className="stagger-grid grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 6).map((article) => (
              <Link
                key={article.slug}
                to={`/articles/${article.slug}`}
                className="card-interactive rounded-2xl border border-[#27272a] bg-[#111114]/80 p-6 transition hover:border-[#f59e0b]"
              >
                <span className="inline-block rounded-full bg-[#f59e0b]/15 px-3 py-1 text-xs text-[#f59e0b]">
                  {article.tags[0] || "Tech"}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{article.title}</h3>
                <p className="mt-3 text-sm text-[#a1a1aa]">{article.excerpt}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-[#71717a]">
                  <span>{article.publishedAt}</span>
                  <span>{Math.max(5, Math.ceil(article.content.length / 320))} 分钟阅读</span>
                </div>
              </Link>
            ))}
          </RevealOnView>
        </div>
      </section>

      <Link
        to="/chat"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-[#0a0a0b] shadow-[0_12px_40px_rgba(245,158,11,0.4)] transition hover:scale-105"
        aria-label="打开 AI 对话"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </Link>
    </main>
  );
}
