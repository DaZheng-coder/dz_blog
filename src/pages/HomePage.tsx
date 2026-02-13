import { Link, useNavigate } from "react-router-dom";
import { SiteNav } from "../components/layout/SiteNav";
import { articles, projects, workExperiences } from "../data/blog";

function statusClass(status: string) {
  switch (status) {
    case "Active":
      return "bg-[#65ff7f] text-[#121513]";
    case "Building":
      return "bg-[#1f2321] text-[#65ff7f] border border-[#65ff7f]";
    default:
      return "bg-[#d8d4cb] text-[#1f2321]";
  }
}

export function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f5f2e9] text-[#1f2321]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <SiteNav current="home" className="mb-10" />

        <header>
          <p className="text-xs uppercase tracking-[0.24em] text-[#5c605c]">
            Public Build Log
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
            公开构建产品，持续记录项目与工作经历
          </h1>
          <p className="mt-5 max-w-3xl text-base text-[#3a3f3c] md:text-lg">
            这里是我的个人博客首页。重点记录真实的构建过程：做了什么、为什么做、下一步做什么。
          </p>
        </header>

        <section className="my-20  rounded-2xl border border-[#1f2321] bg-[#1f2321] p-8 text-[#f5f2e9]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="mt-2 text-3xl font-semibold">🧑‍💻 AI 智能对话</h2>
              <p className="mt-3 text-sm text-[#d5dbd5] md:text-base">
                体验创新的 AI
                驱动对话系统，通过对话深入了解我的工作经历和技能，快来了解我吧。
              </p>
            </div>
            <button
              onClick={() => navigate("/chat")}
              className="cursor-pointer rounded-full bg-[#65ff7f] px-6 py-3 text-sm font-semibold text-[#121513] transition hover:bg-[#8dff9e]"
            >
              开始对话 {">>>"}
            </button>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold md:text-3xl">
              工作经历时间线
            </h2>
          </div>

          <div className="mt-6 space-y-8">
            {workExperiences.map((experience) => (
              <article
                key={experience.id}
                className="grid gap-4 md:grid-cols-[180px_1fr] md:gap-6"
              >
                <p className="text-sm font-medium text-[#5c605c]">
                  {experience.period}
                </p>
                <div className="relative rounded-2xl border border-[#d8d4cb] bg-white/70 p-6">
                  <span
                    className="absolute -left-[9px] top-8 h-4 w-4 rounded-full border-2 border-[#f5f2e9] bg-[#65ff7f]"
                    aria-hidden="true"
                  />
                  <h3 className="text-xl font-semibold">{experience.role}</h3>
                  <p className="mt-1 text-sm uppercase tracking-wide text-[#5c605c]">
                    {experience.company}
                  </p>
                  <p className="mt-4 text-[#3a3f3c]">{experience.summary}</p>
                  <ul className="mt-4 space-y-2 text-sm text-[#3a3f3c]">
                    {experience.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span
                          className="mt-2 h-1.5 w-1.5 rounded-full bg-[#65ff7f]"
                          aria-hidden="true"
                        />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold md:text-3xl">项目详情</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.slug}
                to={`/projects/${project.slug}`}
                className="group rounded-2xl border border-[#d8d4cb] bg-white/70 p-6 transition hover:-translate-y-0.5 hover:border-[#65ff7f]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">{project.title}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#4e5350]">
                  {project.subtitle}
                </p>
                <p className="mt-4 text-[#3a3f3c]">{project.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.techStack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-[#c9c5bb] px-3 py-1 text-xs font-medium text-[#3a3f3c]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold md:text-3xl">文章</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                to={`/articles/${article.slug}`}
                className="rounded-2xl border border-[#d8d4cb] bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-[#65ff7f]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[#5c605c]">
                  {article.publishedAt}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{article.title}</h3>
                <p className="mt-3 text-sm text-[#3a3f3c]">{article.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#c9c5bb] px-2.5 py-1 text-[11px] text-[#4e5350]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-14 border-t border-[#d8d4cb] pt-6 text-sm text-[#4e5350]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>MIT License © {new Date().getFullYear()} Zhengjunqin</p>
            <p>
              Contact:{" "}
              <a
                className="text-[#1f2321] underline-offset-4 hover:underline"
                href="mailto:hello@example.com"
              >
                hello@example.com
              </a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
