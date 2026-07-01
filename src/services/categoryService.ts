import type { Category, CreateCategoryDto } from '@/types/transaction';
import api from './api';

export const categoryService = {
  /** GET /api/categories */
  getCategories: () =>
    api.get<Category[]>('/api/categories').then((r) => r.data),

  /** POST /api/categories */
  createCategory: (data: CreateCategoryDto) =>
    api.post<Category>('/api/categories', data).then((r) => r.data),

  /** DELETE /api/categories/:id */
  deleteCategory: (id: number) =>
    api.delete(`/api/categories/${id}`).then((r) => r.data),
};
