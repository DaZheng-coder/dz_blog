import { Link } from "react-router-dom";
import { RevealOnView } from "../components/layout/RevealOnView";
import { SiteNav } from "../components/layout/SiteNav";
import { articles } from "../data/blog";

export function ArticleListPage() {
  return (
    <main className="page-enter min-h-screen bg-[#f5f2e9] text-[#1f2321]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <RevealOnView className="nav-enter mb-10">
          <SiteNav current="articles" />
        </RevealOnView>

        <RevealOnView>
          <header className="border-b border-[#d8d4cb] pb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[#5c605c]">Articles</p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">文章列表</h1>
            <p className="mt-3 text-[#3a3f3c]">记录公开构建中的决策、复盘与技术实践。</p>
          </header>
        </RevealOnView>

        <RevealOnView className="stagger-grid mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/articles/${article.slug}`}
              className="card-interactive rounded-2xl border border-[#d8d4cb] bg-white/70 p-6 transition hover:-translate-y-0.5 hover:border-[#65ff7f]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#5c605c]">{article.publishedAt}</p>
              <h2 className="mt-2 text-xl font-semibold">{article.title}</h2>
              <p className="mt-3 text-sm text-[#3a3f3c]">{article.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
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
        </RevealOnView>
      </div>
    </main>
  );
}
