import { useState, useEffect } from 'react';
import { Transaction, Bill, Goal } from './types';
import { supabase } from './supabaseClient';

export const useStore = (userId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Data from Supabase
  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setBills([]);
      setGoals([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const [txRes, billRes, goalRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('bills').select('*').order('due_date', { ascending: true }),
        supabase.from('goals').select('*').order('created_at', { ascending: true })
      ]);

      if (txRes.data) {
        setTransactions(txRes.data.map((t: any) => ({
          ...t,
          paymentMethod: t.payment_method
        })));
      }

      if (billRes.data) {
        setBills(billRes.data.map((b: any) => ({
          ...b,
          dueDate: b.due_date,
          isRecurring: b.is_recurring,
          isPaid: b.is_paid
        })));
      }

      if (goalRes.data) {
        setGoals(goalRes.data.map((g: any) => ({
          ...g,
          targetAmount: g.target_amount,
          currentAmount: g.current_amount
        })));
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // --- ACTIONS ---

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    // Optimistic Update
    const tempId = Math.random().toString();
    const newTx = { ...t, id: tempId, user_id: userId };
    setTransactions(prev => [newTx as any, ...prev]);

    const { data, error } = await supabase.from('transactions').insert({
      user_id: userId,
      type: t.type,
      amount: t.amount,
      category: t.category,
      payment_method: t.paymentMethod,
      date: t.date,
      description: t.description
    }).select().single();

    if (data) {
      setTransactions(prev => prev.map(item => item.id === tempId ? { ...data, paymentMethod: data.payment_method } : item));
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from('transactions').delete().eq('id', id);
  };

  const addBill = async (b: Omit<Bill, 'id' | 'isPaid'>) => {
    const tempId = Math.random().toString();
    const newBill = { ...b, id: tempId, isPaid: false };
    setBills(prev => [...prev, newBill]);

    const { data } = await supabase.from('bills').insert({
      user_id: userId,
      name: b.name,
      amount: b.amount,
      due_date: b.dueDate,
      is_recurring: b.isRecurring,
      is_paid: false
    }).select().single();

    if (data) {
      setBills(prev => prev.map(item => item.id === tempId ? {
          ...data,
          dueDate: data.due_date,
          isRecurring: data.is_recurring,
          isPaid: data.is_paid
      } : item));
    }
  };

  const toggleBillPaid = async (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    const isNowPaid = !bill.isPaid;
    
    // Update Local
    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: isNowPaid } : b));

    // Update DB
    await supabase.from('bills').update({ is_paid: isNowPaid }).eq('id', id);

    // Create Transaction Automatically if Paid
    if (isNowPaid) {
      const today = new Date().toISOString().split('T')[0];
      await addTransaction({
        type: 'expense',
        amount: bill.amount,
        category: 'Casa', 
        date: today,
        paymentMethod: 'Boleto',
        description: `Pagamento: ${bill.name}`
      } as any);
    }
  };

  const addGoal = async (g: Omit<Goal, 'id' | 'currentAmount'>, initialDeposit: number) => {
    const tempId = Math.random().toString();
    const newGoal = { ...g, id: tempId, currentAmount: initialDeposit };
    setGoals(prev => [...prev, newGoal]);

    const { data } = await supabase.from('goals').insert({
      user_id: userId,
      name: g.name,
      target_amount: g.targetAmount,
      current_amount: initialDeposit,
      deadline: g.deadline
    }).select().single();

    if (data) {
      setGoals(prev => prev.map(item => item.id === tempId ? {
          ...data,
          targetAmount: data.target_amount,
          currentAmount: data.current_amount
      } : item));
    }
  };

  const updateGoalProgress = async (id: string, amountToAdd: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    const newAmount = parseFloat(goal.currentAmount.toString()) + amountToAdd;

    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: newAmount } : g));

    await supabase.from('goals').update({ current_amount: newAmount }).eq('id', id);
  };

  return {
    transactions,
    bills,
    goals,
    loading,
    addTransaction,
    deleteTransaction,
    addBill,
    toggleBillPaid,
    addGoal,
    updateGoalProgress
  };
};