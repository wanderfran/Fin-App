
export type TransactionType = 'expense' | 'income';

export type Category = 
  | 'Alimentação'
  | 'Transporte'
  | 'Lazer'
  | 'Casa'
  | 'Educação'
  | 'Saúde'
  | 'Salário'
  | 'Extra'
  | 'Outros';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

export interface UserProfile {
  id: string;
  display_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string YYYY-MM-DD
  category: string;
  paymentMethod: string;
  description?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: number; // Day of month (1-31)
  isRecurring: boolean;
  isPaid: boolean;
  paidDate?: string; // Month-Year string of last payment to track recurrence
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO string
}

export const CATEGORIES: Category[] = [
  'Alimentação', 'Transporte', 'Lazer', 'Casa', 'Educação', 'Saúde', 'Salário', 'Extra', 'Outros'
];

export const PAYMENT_METHODS = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto'];
