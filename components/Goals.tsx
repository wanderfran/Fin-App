import React, { useState } from 'react';
import { Goal } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Target, Plus, TrendingUp } from 'lucide-react';

interface GoalsProps {
  goals: Goal[];
  onAdd: (g: any, initial: number) => void;
  onUpdate: (id: string, amount: number) => void;
}

export const Goals: React.FC<GoalsProps> = ({ goals, onAdd, onUpdate }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [date, setDate] = useState('');

  // Deposit State (simple implementation: one global deposit input for demo)
  const [depositAmount, setDepositAmount] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      targetAmount: parseFloat(target),
      deadline: date
    }, parseFloat(current) || 0);
    setName(''); setTarget(''); setCurrent(''); setDate('');
    setIsFormOpen(false);
  };

  const handleDeposit = (id: string) => {
    const val = parseFloat(depositAmount[id]);
    if (val > 0) {
      onUpdate(id, val);
      setDepositAmount(prev => ({ ...prev, [id]: '' }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Metas & Sonhos</h1>
          <p className="text-slate-500">Defina objetivos e acompanhe seu progresso.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Nova Meta
        </button>
      </header>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-100 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Objetivo (Ex: Celular)</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="p-3 bg-slate-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Quanto custa? (Total)</label>
              <input required type="number" value={target} onChange={e => setTarget(e.target.value)} className="p-3 bg-slate-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Já tem quanto guardado?</label>
              <input type="number" value={current} onChange={e => setCurrent(e.target.value)} className="p-3 bg-slate-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0,00" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Prazo final</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="p-3 bg-slate-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-1 md:col-span-2 mt-2">
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">Criar Meta</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const remaining = goal.targetAmount - goal.currentAmount;
          
          // Calculate monthly savings needed
          const today = new Date();
          const deadline = new Date(goal.deadline);
          const monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
          const monthlySuggestion = monthsLeft > 0 ? remaining / monthsLeft : remaining;

          return (
            <div key={goal.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-2 w-fit">
                    <Target size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Prazo</p>
                    <p className="text-sm font-semibold text-slate-600">{formatDate(goal.deadline)}</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{goal.name}</h3>
                <p className="text-slate-500 text-sm mb-4">Meta: {formatCurrency(goal.targetAmount)}</p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-indigo-600">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-slate-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {remaining > 0 ? (
                    <p className="text-xs text-slate-400 mt-2">
                      Faltam {formatCurrency(remaining)}. 
                      {monthsLeft > 0 && <span className="block text-indigo-500 font-medium">Sugestão: Guarde {formatCurrency(monthlySuggestion)}/mês</span>}
                    </p>
                  ) : (
                    <p className="text-sm text-emerald-600 font-bold mt-2">Meta Atingida! Parabéns!</p>
                  )}
                </div>
              </div>

              {/* Add Money Input */}
              {remaining > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Adicionar Economia</p>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Valor" 
                      className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      value={depositAmount[goal.id] || ''}
                      onChange={(e) => setDepositAmount({...depositAmount, [goal.id]: e.target.value})}
                    />
                    <button 
                      onClick={() => handleDeposit(goal.id)}
                      className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <TrendingUp size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
