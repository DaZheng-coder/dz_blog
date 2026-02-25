import { Link, useNavigate, useParams } from "react-router-dom";
import { RevealOnView } from "../components/layout/RevealOnView";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { getArticleBySlug } from "../data/blog";

export function ArticleDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <main className="blog-theme min-h-screen bg-[#0a0a0b] text-[#f4f4f5] px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#27272a] bg-[#111114]/80 p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[#71717a]">
            Article
          </p>
          <h1 className="mt-2 text-3xl font-semibold">未找到文章</h1>
          <p className="mt-4 text-[#d4d4d8]">
            该文章可能尚未发布，或链接不正确。
          </p>
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
    <main className="blog-theme page-enter min-h-screen bg-[#0a0a0b] text-[#f4f4f5]">
      <article className="mx-auto max-w-4xl px-4 py-14 md:py-20">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="card-interactive cursor-pointer inline-flex rounded-full border border-[#3f3f46] px-4 py-2 text-sm text-[#d4d4d8] transition hover:border-[#f59e0b] hover:text-[#f4f4f5]"
        >
          ← 返回
        </button>

        <RevealOnView className="mt-8">
          <header className="border-b border-[#27272a] pb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[#71717a]">
              {article.publishedAt}
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              {article.title}
            </h1>
            <p className="mt-4 text-base text-[#d4d4d8] md:text-lg">
              {article.excerpt}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#3f3f46] px-3 py-1 text-xs font-medium text-[#d4d4d8]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>
        </RevealOnView>

        <RevealOnView className="prose-article mt-8">
          <MarkdownRenderer content={article.content} />
        </RevealOnView>
      </article>
    </main>
  );
}
