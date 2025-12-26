import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Trash2, Plus, Filter, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';

interface TransactionsProps {
  data: Transaction[];
  onAdd: (t: any) => void;
  onDelete: (id: string) => void;
  onOpenAdd?: () => void;
}

type DateFilter = 'today' | '7d' | '30d' | '3m' | 'custom';

export const Transactions: React.FC<TransactionsProps> = ({ data, onDelete, onOpenAdd }) => {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterDate, setFilterDate] = useState<DateFilter>('30d');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Filter Logic
  const filteredData = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    return data
      .filter(t => {
        // 1. Filter by Type
        if (filterType !== 'all' && t.type !== filterType) return false;

        // 2. Filter by Date
        const tDate = new Date(t.date + 'T12:00:00');
        
        switch (filterDate) {
            case 'today':
              return t.date === new Date().toISOString().split('T')[0];
            case '7d': {
              const past = new Date();
              past.setDate(now.getDate() - 7);
              past.setHours(0, 0, 0, 0);
              return tDate >= past && tDate <= now;
            }
            case '30d': {
              const past = new Date();
              past.setDate(now.getDate() - 30);
              past.setHours(0, 0, 0, 0);
              return tDate >= past && tDate <= now;
            }
            case '3m': {
              const past = new Date();
              past.setMonth(now.getMonth() - 3);
              past.setHours(0, 0, 0, 0);
              return tDate >= past && tDate <= now;
            }
            case 'custom':
              return t.date === customDate;
            default:
              return true;
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filterType, filterDate, customDate]);

  // Calculations based on Filtered Data (Dynamic Dashboard)
  const totalIncome = filteredData
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filteredData
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;
  const totalVolume = totalIncome + totalExpense;
  const incomePct = totalVolume > 0 ? (totalIncome / totalVolume) * 100 : 0;
  const expensePct = totalVolume > 0 ? (totalExpense / totalVolume) * 100 : 0;

  const FilterButton = ({ type, label }: { type: DateFilter, label: string }) => (
    <button
      onClick={() => {
        setFilterDate(type);
        if (type !== 'custom') setShowCustomPicker(false);
        else setShowCustomPicker(true);
      }}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
        filterDate === type 
          ? 'bg-[#ccff00] text-black shadow-[0_0_10px_rgba(204,255,0,0.2)]' 
          : 'bg-[#1F2923] text-[#88998C] hover:text-white border border-[#2A3530]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
            <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">Extrato</h1>
                <p className="text-[#88998C] text-sm">Histórico.</p>
            </div>
            
            <button 
            onClick={onOpenAdd}
            className="bg-[#1F2923] hover:bg-[#2A3530] text-[#ccff00] w-10 h-10 rounded-full flex items-center justify-center transition-all border border-[#2A3530]"
            >
            <Plus size={20} strokeWidth={2} />
            </button>
        </div>

        {/* Date Filters */}
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <FilterButton type="today" label="Hoje" />
                <FilterButton type="7d" label="7 Dias" />
                <FilterButton type="30d" label="30 Dias" />
                <FilterButton type="3m" label="3 Meses" />
                <FilterButton type="custom" label="Data Específica" />
            </div>

             {/* Custom Date Picker */}
             {filterDate === 'custom' && showCustomPicker && (
                <div className="bg-[#1F2923] p-2 rounded-xl border border-[#2A3530] flex items-center gap-2 w-fit animate-in slide-in-from-top-2 fade-in">
                    <Calendar size={16} className="text-[#ccff00]" />
                    <input 
                        type="date" 
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none font-medium"
                    />
                </div>
            )}
        </div>
      </header>

      {/* Comparison Dashboard - Minimalist */}
      <div className="bg-[#161d19] p-6 rounded-[2rem] border border-[#2A3530]">
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center md:text-left">
            <p className="text-[10px] text-[#88998C] font-bold uppercase tracking-widest mb-1">Entradas</p>
            <p className="text-lg font-medium text-white">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="text-center md:text-left border-l border-[#2A3530] pl-4">
            <p className="text-[10px] text-[#88998C] font-bold uppercase tracking-widest mb-1">Saídas</p>
            <p className="text-lg font-medium text-white">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="text-center md:text-left border-l border-[#2A3530] pl-4">
            <p className="text-[10px] text-[#ccff00] font-bold uppercase tracking-widest mb-1">Saldo</p>
            <p className="text-lg font-medium text-[#ccff00]">{formatCurrency(balance)}</p>
          </div>
        </div>

        {/* Visual Bar - Thinner */}
        {totalVolume > 0 && (
          <div className="mt-2">
             <div className="h-1.5 w-full bg-[#131a15] rounded-full overflow-hidden flex">
                <div style={{ width: `${incomePct}%` }} className="h-full bg-[#ccff00]"></div>
                <div style={{ width: `${expensePct}%` }} className="h-full bg-white/20"></div>
             </div>
          </div>
        )}
      </div>

      {/* Type Filter Tabs */}
      <div className="flex gap-1 p-1 bg-[#161d19] rounded-xl w-fit border border-[#2A3530]">
        {['all', 'income', 'expense'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filterType === f ? 'bg-[#ccff00] text-black' : 'text-[#5a6b61] hover:text-white'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'income' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-[#161d19] rounded-[2rem] border border-[#2A3530] overflow-hidden p-1">
        {filteredData.length > 0 ? (
          <div className="space-y-0.5">
            {filteredData.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-[#1F2923] transition-colors group rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-[#ccff00]/10 text-[#ccff00]' : 'bg-white/5 text-white'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={16} strokeWidth={1.5} /> : <ArrowDownLeft size={16} strokeWidth={1.5} />}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{t.description || t.category}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] text-[#5a6b61] uppercase tracking-wide">{formatDate(t.date)}</p>
                        <span className="text-[10px] text-[#5a6b61]">•</span>
                        <p className="text-[10px] text-[#5a6b61] uppercase tracking-wide">{t.paymentMethod}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-medium text-sm ${t.type === 'income' ? 'text-[#ccff00]' : 'text-white'}`}>
                    {t.type === 'expense' && '- '}
                    {formatCurrency(t.amount)}
                  </span>
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="p-1.5 text-[#2A3530] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-[#5a6b61]">
            <Filter size={32} className="mx-auto mb-2 opacity-20" strokeWidth={1} />
            <p className="text-sm">Vazio para este período.</p>
          </div>
        )}
      </div>
    </div>
  );
};