import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownRendererProps = {
  content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mt-8 text-3xl font-semibold leading-tight text-[#1f2321]">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-7 text-2xl font-semibold leading-tight text-[#1f2321]">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-6 text-xl font-semibold leading-tight text-[#1f2321]">{children}</h3>
        ),
        p: ({ children }) => <p className="mt-4 leading-7 text-[#2f3431]">{children}</p>,
        ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6 text-[#2f3431]">{children}</ul>,
        ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6 text-[#2f3431]">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-[#d8d4cb] text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-[#ece7dd]">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-[#d8d4cb]">{children}</tr>,
        th: ({ children }) => (
          <th className="border border-[#d8d4cb] px-3 py-2 text-left font-semibold text-[#1f2321]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-[#d8d4cb] px-3 py-2 text-[#2f3431]">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
