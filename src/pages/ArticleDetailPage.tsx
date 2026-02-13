import { Link, useParams } from "react-router-dom";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { getArticleBySlug } from "../data/blog";

export function ArticleDetailPage() {
  const { slug = "" } = useParams();
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <main className="min-h-screen bg-[#f5f2e9] text-[#1f2321] px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#d8d4cb] bg-white/60 p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[#5c605c]">Article</p>
          <h1 className="mt-2 text-3xl font-semibold">未找到文章</h1>
          <p className="mt-4 text-[#3a3f3c]">该文章可能尚未发布，或链接不正确。</p>
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
      <article className="mx-auto max-w-4xl px-4 py-14 md:py-20">
        <Link
          to="/"
          className="inline-flex rounded-full border border-[#c9c5bb] px-4 py-2 text-sm text-[#3a3f3c] transition hover:border-[#65ff7f] hover:text-[#1f2321]"
        >
          ← 返回首页
        </Link>

        <header className="mt-8 border-b border-[#d8d4cb] pb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#5c605c]">{article.publishedAt}</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{article.title}</h1>
          <p className="mt-4 text-base text-[#3a3f3c] md:text-lg">{article.excerpt}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#c9c5bb] px-3 py-1 text-xs font-medium text-[#3a3f3c]"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="mt-8">
          <MarkdownRenderer content={article.content} />
        </div>
      </article>
    </main>
  );
}
