import type {
  Transaction,
  CreateTransactionDto,
  TransactionSummary,
} from '@/types/transaction';
import api from './api';

export const transactionService = {
  /** GET /api/Transactions — paginated list */
  getTransactions: (params?: {
    shortBy?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => api.get<Transaction[]>('/api/Transactions', { params }).then((r) => r.data),

  /** GET /api/Transactions/summary */
  getSummary: () =>
    api.get<TransactionSummary>('/api/Transactions/summary').then((r) => r.data),

  /** GET /api/Transactions/total */
  getTotal: () =>
    api.get<unknown>('/api/Transactions/total').then((r) => r.data),

  /** GET /api/Transactions/category/{categoryId} */
  getByCategory: (categoryId: number) =>
    api.get<Transaction[]>(`/api/Transactions/category/${categoryId}`).then((r) => r.data),

  /** POST /api/Transactions */
  createTransaction: (data: CreateTransactionDto) =>
    api.post<Transaction>('/api/Transactions', data).then((r) => r.data),

  /** PUT /api/Transactions/{id} */
  updateTransaction: (id: number, data: Transaction) =>
    api.put<Transaction>(`/api/Transactions/${id}`, data).then((r) => r.data),

  /** DELETE /api/Transactions/{id} */
  deleteTransaction: (id: number) =>
    api.delete<void>(`/api/Transactions/${id}`).then((r) => r.data),
};
