// TypeScript interfaces for QFS Ledger

export interface Account {
  id?: number;
  name: string;
  code: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parent?: number | null;
  is_active: boolean;
  created_at?: string;
}

export interface Transaction {
  id?: number;
  reference: string;
  description: string;
  date: string;
  user?: number;
  user_name?: string;
  entries?: JournalEntry[];
  created_at?: string;
}

export interface JournalEntry {
  id?: number;
  transaction?: number;
  account: number;
  account_name?: string;
  account_code?: string;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: string | number;
}

export interface ApiResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}