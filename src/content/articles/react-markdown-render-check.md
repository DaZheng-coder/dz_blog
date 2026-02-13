# ReactMarkdown 渲染验证

这是一篇用于验证 `react-markdown` 渲染能力的测试文章，包含普通文本、图片和表格。

## 文本段落

公开构建过程中，文档可读性和结构化信息非常关键。Markdown 是一个低成本、可维护的内容格式。

## 图片

下方图片来自本地 `public/screenshots` 目录：

![构建日志首页截图](/screenshots/build-log-home.svg)

## 表格

| 模块 | 目标 | 当前状态 |
| --- | --- | --- |
| 文章系统 | 支持 Markdown 发布 | 已完成 |
| 图片展示 | 支持本地静态资源 | 已完成 |
| 表格渲染 | 支持 GFM Table | 已完成 |

## 结论

如果你能在文章详情页看到上面的表格是网格布局，而不是一段普通文本，说明 `react-markdown + remark-gfm` 生效。
