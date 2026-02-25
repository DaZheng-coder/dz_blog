import { Link, useParams } from "react-router-dom";
import { getProjectBySlug } from "../data/blog";

function getStatusClass(status: string) {
  switch (status) {
    case "Active":
      return "bg-[#f59e0b] text-[#0a0a0b]";
    case "Building":
      return "bg-[#111114]/80 text-[#f59e0b] border border-[#f59e0b]";
    default:
      return "bg-[#27272a] text-[#f4f4f5]";
  }
}

export function ProjectDetailPage() {
  const { slug = "" } = useParams();
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <main className="blog-theme min-h-screen bg-[#0a0a0b] text-[#f4f4f5] px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#27272a] bg-[#111114]/80 p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[#71717a]">Project</p>
          <h1 className="mt-2 text-3xl font-semibold">未找到项目</h1>
          <p className="mt-4 text-[#d4d4d8]">该项目可能已被移除，或链接不正确。</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-[#f59e0b] px-5 py-2 text-sm font-medium text-[#0a0a0b] transition hover:bg-[#fbbf24]"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="blog-theme min-h-screen bg-[#0a0a0b] text-[#f4f4f5]">
      <div className="mx-auto max-w-5xl px-4 py-14 md:py-20">
        <Link
          to="/"
          className="inline-flex rounded-full border border-[#3f3f46] px-4 py-2 text-sm text-[#d4d4d8] transition hover:border-[#f59e0b] hover:text-[#f4f4f5]"
        >
          ← 返回时间线
        </Link>

        <header className="mt-8 border-b border-[#27272a] pb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#71717a]">Project Detail</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{project.title}</h1>
          <p className="mt-3 text-base text-[#d4d4d8] md:text-lg">{project.subtitle}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span
              className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusClass(
                project.status,
              )}`}
            >
              {project.status}
            </span>
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-[#3f3f46] px-4 py-1 text-xs font-medium text-[#d4d4d8]"
              >
                {tech}
              </span>
            ))}
          </div>
        </header>

        <section className="mt-10 grid gap-8">
          {project.screenshots.map((shot) => (
            <figure key={shot.src} className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#111114]/80">
              <img src={shot.src} alt={shot.alt} className="h-auto w-full object-cover" />
              <figcaption className="border-t border-[#18181b] px-4 py-3 text-sm text-[#a1a1aa]">
                {shot.caption}
              </figcaption>
            </figure>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-[#27272a] bg-[#111114]/80 p-6 md:p-8">
          <h2 className="text-xl font-semibold">构建记录</h2>
          <ul className="mt-4 space-y-3 text-[#d4d4d8]">
            {project.details.map((detail) => (
              <li key={detail} className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-[#f59e0b]" aria-hidden="true" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
