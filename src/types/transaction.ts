// ── Transaction Type ──────────────────────────────────────────────────────
/** 0 = Expense | 1 = Income  (Swagger enum) */
export type TransactionType = 0 | 1;

export const TRANSACTION_TYPE = {
  EXPENSE: 0 as TransactionType,
  INCOME: 1 as TransactionType,
} as const;

// ── Core Entities ─────────────────────────────────────────────────────────
/** 0 = Expense (Gider) | 1 = Income (Gelir) */
export type CategoryType = 0 | 1;

export const CATEGORY_TYPE = {
  EXPENSE: 0 as CategoryType,
  INCOME:  1 as CategoryType,
} as const;

export interface Category {
  id: number;
  /** Max 50 characters */
  name: string;
  /** 0 = Gider | 1 = Gelir */
  type?: CategoryType;
}

export interface Transaction {
  id: number;
  amount: number;
  /** ISO 8601 date-time string */
  date: string;
  description: string | null;
  type: TransactionType;
  /** Backend returns the resolved name directly — no separate FK */
  categoryName?: string;
  /** Present only if the backend joins the category object */
  category?: Category;
  /** May be absent in the paginated response */
  categoryId?: number;
  userId?: number;
}

/** Paginated envelope returned by GET /api/Transactions */
export interface PaginatedTransactions {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  data: Transaction[];
}


// ── Request DTOs ──────────────────────────────────────────────────────────
export interface CreateTransactionDto {
  /** 0.01 – 1,000,000 */
  amount: number;
  /** Max 100 characters */
  description?: string | null;
  type: TransactionType;
  categoryId: number;
}

export interface CreateCategoryDto {
  categoryName: string | null;
  /** 0 = Gider | 1 = Gelir */
  type: CategoryType;
}

// ── Inferred Response Shapes ──────────────────────────────────────────────
// (Swagger marks these as 200 OK with no body; shapes are inferred from
//  standard ASP.NET Core patterns and will be adjusted if the backend
//  returns differently.)

export interface TransactionSummary {
  totalIncome?: number;
  totalExpense?: number;
  balance?: number;
}
