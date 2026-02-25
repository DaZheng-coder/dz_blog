import { Link } from "react-router-dom";
import { RevealOnView } from "../components/layout/RevealOnView";
import { SiteNav } from "../components/layout/SiteNav";
import { articles } from "../data/blog";

export function ArticleListPage() {
  return (
    <main className="blog-theme page-enter min-h-screen bg-[#0a0a0b] text-[#f4f4f5]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <RevealOnView className="nav-enter mb-10">
          <SiteNav current="articles" />
        </RevealOnView>

        <RevealOnView>
          <header className="border-b border-[#27272a] pb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[#71717a]">Articles</p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">文章列表</h1>
            <p className="mt-3 text-[#d4d4d8]">记录公开构建中的决策、复盘与技术实践。</p>
          </header>
        </RevealOnView>

        <RevealOnView className="stagger-grid mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/articles/${article.slug}`}
              className="card-interactive rounded-2xl border border-[#27272a] bg-[#111114]/80 p-6 transition hover:-translate-y-0.5 hover:border-[#f59e0b]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#71717a]">{article.publishedAt}</p>
              <h2 className="mt-2 text-xl font-semibold">{article.title}</h2>
              <p className="mt-3 text-sm text-[#d4d4d8]">{article.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#3f3f46] px-2.5 py-1 text-[11px] text-[#a1a1aa]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </RevealOnView>
      </div>
    </main>
  );
}
