import React, { useState } from 'react';
import { Bill } from '../types';
import { formatCurrency } from '../utils';
import { CheckCircle2, Circle, AlertCircle, Plus } from 'lucide-react';

interface BillsProps {
  bills: Bill[];
  onAdd: (b: any) => void;
  onPay: (id: string) => void;
}

export const Bills: React.FC<BillsProps> = ({ bills, onAdd, onPay }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('5');
  const [isRecurring, setIsRecurring] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      amount: parseFloat(amount),
      dueDate: parseInt(dueDate),
      isRecurring
    });
    setName('');
    setAmount('');
    setIsFormOpen(false);
  };

  const sortedBills = [...bills].sort((a, b) => a.dueDate - b.dueDate);
  const totalPending = bills.filter(b => !b.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = bills.filter(b => b.isPaid).reduce((acc, curr) => acc + curr.amount, 0);

  const todayDay = new Date().getDate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contas do Mês</h1>
          <p className="text-slate-500">Gerencie seus pagamentos recorrentes.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Nova Conta
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">A Pagar</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 shadow-sm">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Já Pago</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-100 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nome da Conta</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="p-3 bg-slate-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Internet" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Valor</label>
              <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="p-3 bg-slate-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0,00" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Dia de Vencimento</label>
              <input required type="number" min="1" max="31" value={dueDate} onChange={e => setDueDate(e.target.value)} className="p-3 bg-slate-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="recur" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
              <label htmlFor="recur" className="text-slate-700 font-medium">Recorrente todo mês?</label>
            </div>
            <div className="col-span-1 md:col-span-2 mt-2">
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">Cadastrar Conta</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {sortedBills.map(bill => {
          const isLate = !bill.isPaid && bill.dueDate < todayDay;
          return (
            <div key={bill.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${bill.isPaid ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full font-bold text-lg w-12 h-12 flex items-center justify-center ${isLate ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {bill.dueDate}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{bill.name}</h4>
                  <p className="text-sm text-slate-500">{bill.isRecurring ? 'Recorrente' : 'Única'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-slate-800">{formatCurrency(bill.amount)}</p>
                  {isLate && <span className="flex items-center text-xs text-red-500 font-bold gap-1"><AlertCircle size={12}/> Atrasada</span>}
                </div>
                <button 
                  onClick={() => onPay(bill.id)}
                  className={`p-2 rounded-full transition-colors ${bill.isPaid ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-emerald-500'}`}
                  title={bill.isPaid ? "Marcada como paga" : "Marcar como paga"}
                >
                  {bill.isPaid ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};
