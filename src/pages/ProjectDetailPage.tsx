import { Link, useParams } from "react-router-dom";
import { getProjectBySlug } from "../data/blog";

function getStatusClass(status: string) {
  switch (status) {
    case "Active":
      return "bg-[#65ff7f] text-[#121513]";
    case "Building":
      return "bg-[#1f2321] text-[#65ff7f] border border-[#65ff7f]";
    default:
      return "bg-[#d8d4cb] text-[#1f2321]";
  }
}

export function ProjectDetailPage() {
  const { slug = "" } = useParams();
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f5f2e9] text-[#1f2321] px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#d8d4cb] bg-white/60 p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[#5c605c]">Project</p>
          <h1 className="mt-2 text-3xl font-semibold">未找到项目</h1>
          <p className="mt-4 text-[#3a3f3c]">该项目可能已被移除，或链接不正确。</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-[#1f2321] px-5 py-2 text-sm font-medium text-[#f5f2e9] transition hover:bg-[#151816]"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f2e9] text-[#1f2321]">
      <div className="mx-auto max-w-5xl px-4 py-14 md:py-20">
        <Link
          to="/"
          className="inline-flex rounded-full border border-[#c9c5bb] px-4 py-2 text-sm text-[#3a3f3c] transition hover:border-[#65ff7f] hover:text-[#1f2321]"
        >
          ← 返回时间线
        </Link>

        <header className="mt-8 border-b border-[#d8d4cb] pb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#5c605c]">Project Detail</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{project.title}</h1>
          <p className="mt-3 text-base text-[#3a3f3c] md:text-lg">{project.subtitle}</p>

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
                className="rounded-full border border-[#c9c5bb] px-4 py-1 text-xs font-medium text-[#3a3f3c]"
              >
                {tech}
              </span>
            ))}
          </div>
        </header>

        <section className="mt-10 grid gap-8">
          {project.screenshots.map((shot) => (
            <figure key={shot.src} className="overflow-hidden rounded-2xl border border-[#d8d4cb] bg-white/70">
              <img src={shot.src} alt={shot.alt} className="h-auto w-full object-cover" />
              <figcaption className="border-t border-[#ece7dd] px-4 py-3 text-sm text-[#4e5350]">
                {shot.caption}
              </figcaption>
            </figure>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-[#d8d4cb] bg-white/70 p-6 md:p-8">
          <h2 className="text-xl font-semibold">构建记录</h2>
          <ul className="mt-4 space-y-3 text-[#3a3f3c]">
            {project.details.map((detail) => (
              <li key={detail} className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-[#65ff7f]" aria-hidden="true" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
