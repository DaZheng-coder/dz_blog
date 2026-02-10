/**
 * 全局类型定义
 */

// 用户数据类型
export type TUserData = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// API响应类型
export type TApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
}

// 博客文章类型
export type TBlogPost = {
  id: string;
  title: string;
  content: string;
  author: TUserData;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}
