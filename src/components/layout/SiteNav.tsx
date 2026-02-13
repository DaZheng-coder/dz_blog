import { NavLink } from "react-router-dom";

type SiteNavProps = {
  current?: "home" | "articles" | "chat";
  rightSlot?: React.ReactNode;
  className?: string;
};

const baseItemClass =
  "rounded-full px-4 py-2 font-medium transition border border-[#c9c5bb]";

function navItemClass(isActive: boolean) {
  return isActive
    ? `${baseItemClass} bg-[#1f2321] text-[#f5f2e9] border-[#1f2321]`
    : `${baseItemClass} text-[#3a3f3c] hover:border-[#65ff7f] hover:text-[#1f2321]`;
}

export function SiteNav({ current, rightSlot, className = "" }: SiteNavProps) {
  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-3 rounded-full border border-[#d8d4cb] bg-white/70 px-6 py-3 backdrop-blur-sm ${className}`}
    >
      <NavLink to="/" className="text-sm font-semibold text-[#1f2321]">
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
