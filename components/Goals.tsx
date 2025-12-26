import React, { useState } from 'react';
import { Goal } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Target, Plus, TrendingUp, X } from 'lucide-react';

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
      <header className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Metas</h1>
          <p className="text-[#88998C] text-sm">Objetivos futuros.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#ccff00] hover:bg-[#b3ff66] text-black w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg"
        >
          <Plus size={20} strokeWidth={2} />
        </button>
      </header>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161d19] w-full max-w-md p-6 rounded-[2rem] border border-[#2A3530] shadow-2xl relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-5 right-5 p-1 text-[#5a6b61] hover:text-white">
                <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-white mb-6">Criar Objetivo</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#5a6b61] uppercase">Objetivo</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="p-3 bg-[#131a15] text-white rounded-xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm" placeholder="Ex: Viagem" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#5a6b61] uppercase">Meta (R$)</label>
                    <input required type="number" value={target} onChange={e => setTarget(e.target.value)} className="p-3 bg-[#131a15] text-white rounded-xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm" placeholder="0,00" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#5a6b61] uppercase">Início (R$)</label>
                    <input type="number" value={current} onChange={e => setCurrent(e.target.value)} className="p-3 bg-[#131a15] text-white rounded-xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm" placeholder="0,00" />
                  </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#5a6b61] uppercase">Prazo</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="p-3 bg-[#131a15] text-white rounded-xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm" />
              </div>
              <div className="mt-2">
                <button type="submit" className="w-full bg-[#ccff00] text-black py-3 rounded-xl font-semibold hover:bg-[#b3ff66] transition-all text-base">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const remaining = goal.targetAmount - goal.currentAmount;
          
          const today = new Date();
          const deadline = new Date(goal.deadline);
          const monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
          const monthlySuggestion = monthsLeft > 0 ? remaining / monthsLeft : remaining;

          return (
            <div key={goal.id} className="bg-[#161d19] p-6 rounded-[2rem] border border-[#2A3530] flex flex-col justify-between group hover:border-[#ccff00]/30 transition-all">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-[#1F2923] text-white rounded-xl">
                    <Target size={20} strokeWidth={1.5} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#5a6b61] font-bold uppercase tracking-wide">Prazo</p>
                    <p className="text-xs font-semibold text-white">{formatDate(goal.deadline)}</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-0.5">{goal.name}</h3>
                <p className="text-[#88998C] text-xs mb-5 font-medium">Meta: {formatCurrency(goal.targetAmount)}</p>

                <div className="mb-5">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-[#ccff00]">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-[#5a6b61]">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#131a15] rounded-full overflow-hidden border border-[#2A3530]">
                    <div 
                      className="h-full bg-[#ccff00] rounded-full transition-all duration-1000 ease-out relative" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {remaining > 0 ? (
                    <p className="text-[10px] text-[#5a6b61] mt-2">
                      Falta <span className="text-white font-bold">{formatCurrency(remaining)}</span>. 
                      {monthsLeft > 0 && <span className="block mt-0.5 text-[#ccff00]">Guarde {formatCurrency(monthlySuggestion)}/mês</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-[#ccff00] font-bold mt-2">Concluído! 🚀</p>
                  )}
                </div>
              </div>

              {/* Add Money Input */}
              {remaining > 0 && (
                <div className="pt-3 border-t border-[#2A3530]">
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Adicionar valor..." 
                      className="w-full bg-[#1F2923] text-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#ccff00] text-xs border border-[#2A3530]"
                      value={depositAmount[goal.id] || ''}
                      onChange={(e) => setDepositAmount({...depositAmount, [goal.id]: e.target.value})}
                    />
                    <button 
                      onClick={() => handleDeposit(goal.id)}
                      className="bg-[#ccff00] text-black p-2 rounded-lg hover:bg-[#b3ff66] transition-colors"
                    >
                      <TrendingUp size={16} strokeWidth={2} />
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