import React, { useState } from 'react';
import { Transaction, CATEGORIES, PAYMENT_METHODS, TransactionType, Category } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Trash2, Plus, Filter, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface TransactionsProps {
  data: Transaction[];
  onAdd: (t: any) => void;
  onDelete: (id: string) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ data, onAdd, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState('');

  // Calculations for the Dashboard inside Transactions
  const totalIncome = data
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = data
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;
  
  // Percentage for the comparison bar
  const totalVolume = totalIncome + totalExpense;
  const incomePct = totalVolume > 0 ? (totalIncome / totalVolume) * 100 : 0;
  const expensePct = totalVolume > 0 ? (totalExpense / totalVolume) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      type,
      amount: parseFloat(amount),
      date,
      category,
      paymentMethod,
      description
    });
    // Reset and Close
    setAmount('');
    setDescription('');
    setIsFormOpen(false);
  };

  const filteredData = data
    .filter(t => filterType === 'all' || t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lançamentos</h1>
          <p className="text-slate-500">Registre e compare suas entradas e saídas.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Novo Lançamento
        </button>
      </header>

      {/* Comparison Dashboard */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Resumo do Período</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Income Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="p-3 bg-white rounded-full text-emerald-600 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-emerald-800 font-medium">Entradas</p>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
            </div>
          </div>

          {/* Expense Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-100">
            <div className="p-3 bg-white rounded-full text-rose-600 shadow-sm">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-rose-800 font-medium">Saídas</p>
              <p className="text-xl font-bold text-rose-700">{formatCurrency(totalExpense)}</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className={`p-3 bg-white rounded-full shadow-sm ${balance >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Saldo</p>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Comparison Bar */}
        {totalVolume > 0 && (
          <div className="mt-2">
             <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-600">{Math.round(incomePct)}% Receitas</span>
                <span className="text-rose-600">{Math.round(expensePct)}% Despesas</span>
             </div>
             <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${incomePct}%` }} className="h-full bg-emerald-500"></div>
                <div style={{ width: `${expensePct}%` }} className="h-full bg-rose-500"></div>
             </div>
          </div>
        )}
      </div>

      {/* Add Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-100 mb-6 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Adicionar Movimentação</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 flex gap-4 mb-2">
              <label className={`flex-1 cursor-pointer p-3 rounded-xl border-2 text-center font-bold transition-all ${type === 'expense' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-slate-100 text-slate-400'}`}>
                <input type="radio" className="hidden" checked={type === 'expense'} onChange={() => setType('expense')} />
                Despesa
              </label>
              <label className={`flex-1 cursor-pointer p-3 rounded-xl border-2 text-center font-bold transition-all ${type === 'income' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-slate-100 text-slate-400'}`}>
                <input type="radio" className="hidden" checked={type === 'income'} onChange={() => setType('income')} />
                Receita
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Valor (R$)</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="p-3 bg-slate-50 text-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="0,00"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Data</label>
              <input 
                required
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="p-3 bg-slate-50 text-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Categoria</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="p-3 bg-slate-50 text-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Forma de Pagamento</label>
              <select 
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="p-3 bg-slate-50 text-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Descrição (Opcional)</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="p-3 bg-slate-50 text-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="Ex: Compras da semana"
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-200 rounded-xl w-fit">
        {['all', 'income', 'expense'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              filterType === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'income' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredData.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredData.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{t.description || t.category}</p>
                    <p className="text-xs text-slate-500">{formatDate(t.date)} • {t.paymentMethod}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {t.type === 'expense' && '- '}
                    {formatCurrency(t.amount)}
                  </span>
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400">
            <Filter size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum lançamento encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};