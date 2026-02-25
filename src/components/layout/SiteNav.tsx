import { NavLink } from "react-router-dom";

type SiteNavProps = {
  current?: "home" | "articles" | "chat";
  rightSlot?: React.ReactNode;
  className?: string;
};

const baseItemClass =
  "rounded-full px-4 py-2 font-medium transition border border-[#3f3f46]";

function navItemClass(isActive: boolean) {
  return isActive
    ? `${baseItemClass} bg-[#f4f4f5] text-[#0a0a0b] border-[#f4f4f5]`
    : `${baseItemClass} text-[#d4d4d8] hover:border-[#f59e0b] hover:text-[#f4f4f5]`;
}

export function SiteNav({ current, rightSlot, className = "" }: SiteNavProps) {
  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-3 rounded-full border border-[#27272a] bg-[#111114]/80 px-6 py-3 backdrop-blur-sm ${className}`}
    >
      <NavLink to="/" className="blog-nav-brand text-sm font-semibold text-[#f4f4f5]">
        大大大正的博客
      </NavLink>

      <div className="flex items-center gap-2 text-sm">
        <NavLink to="/" className={() => navItemClass(current === "home")}>
          首页
        </NavLink>
        <NavLink
          to="/articles"
          className={() => navItemClass(current === "articles")}
        >
          文章列表
        </NavLink>
        <NavLink to="/chat" className={() => navItemClass(current === "chat")}>
          AI 对话
        </NavLink>
        {rightSlot}
      </div>
    </nav>
  );
}
