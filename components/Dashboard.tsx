import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Wallet, CalendarClock, TrendingUp, Calendar, Filter, X } from 'lucide-react';
import { Transaction, Bill, Goal } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface DashboardProps {
  transactions: Transaction[];
  bills: Bill[];
  goals: Goal[];
}

const COLORS = ['#ccff00', '#ffffff', '#5a6b61', '#2f3b34', '#88998C', '#b3ff66'];

type DateFilter = 'today' | '7d' | '30d' | '3m' | 'custom';

export const Dashboard: React.FC<DashboardProps> = ({ transactions, bills, goals }) => {
  const [filter, setFilter] = useState<DateFilter>('30d');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    // Zerar horas para comparação justa de datas
    now.setHours(23, 59, 59, 999);
    
    return transactions.filter(t => {
      const tDate = new Date(t.date + 'T12:00:00'); // Adiciona hora para evitar problemas de timezone UTC
      
      switch (filter) {
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
    });
  }, [transactions, filter, customDate]);

  // Calculations based on Filtered Data
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key],
  }));

  const todayDay = new Date().getDate();
  // Bills are future looking, so we don't filter them by past dates usually, 
  // keeping them as is for "Upcoming" visibility.
  const upcomingBills = bills
    .filter(b => !b.isPaid)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 3);

  const FilterButton = ({ type, label }: { type: DateFilter, label: string }) => (
    <button
      onClick={() => {
        setFilter(type);
        if (type !== 'custom') setShowCustomPicker(false);
        else setShowCustomPicker(true);
      }}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
        filter === type 
          ? 'bg-[#ccff00] text-black shadow-[0_0_10px_rgba(204,255,0,0.2)]' 
          : 'bg-[#1F2923] text-[#88998C] hover:text-white border border-[#2A3530]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="mb-2">
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">Visão Geral</h1>
                <p className="text-[#88998C] text-sm mt-1">Resumo financeiro filtrado.</p>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <FilterButton type="today" label="Hoje" />
                <FilterButton type="7d" label="7 Dias" />
                <FilterButton type="30d" label="30 Dias" />
                <FilterButton type="3m" label="3 Meses" />
                <FilterButton type="custom" label="Dia Específico" />
            </div>

            {/* Custom Date Picker */}
            {filter === 'custom' && showCustomPicker && (
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Balance Card */}
        <div className="bg-[#ccff00] p-6 rounded-[1.5rem] shadow-lg shadow-[#ccff00]/5 flex flex-col justify-between h-40 relative overflow-hidden group transition-transform hover:-translate-y-1 duration-300">
          <div className="flex justify-between items-start z-10">
             <div className="p-2 bg-black/5 rounded-full text-black">
                <Wallet size={20} strokeWidth={1.5} />
             </div>
             <span className="text-[10px] font-bold text-black/70 uppercase tracking-widest border border-black/10 px-2 py-0.5 rounded-full">
                Saldo {filter === 'today' ? 'do Dia' : filter === 'custom' ? 'do Dia' : ''}
             </span>
          </div>
          
          <div className="z-10">
            <h3 className="text-3xl font-bold text-black tracking-tight">
              {formatCurrency(balance)}
            </h3>
            <p className="text-black/60 font-medium text-xs mt-1">
                {balance >= 0 ? 'Positivo' : 'Negativo'} no período
            </p>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-[#161d19] p-6 rounded-[1.5rem] border border-[#2A3530] flex flex-col justify-between h-40 hover:border-[#ccff00]/30 transition-colors">
          <div className="flex justify-between items-start">
             <div className="p-2 bg-[#1F2923] rounded-full text-[#ccff00]">
                <TrendingUp size={20} strokeWidth={1.5} />
             </div>
          </div>
          <div>
            <p className="text-[#88998C] font-semibold text-[10px] uppercase tracking-widest mb-1">Entradas</p>
            <h3 className="text-2xl font-medium text-white">{formatCurrency(totalIncome)}</h3>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-[#161d19] p-6 rounded-[1.5rem] border border-[#2A3530] flex flex-col justify-between h-40 hover:border-white/20 transition-colors">
          <div className="flex justify-between items-start">
             <div className="p-2 bg-[#1F2923] rounded-full text-white">
                <ArrowDownLeft size={20} strokeWidth={1.5} />
             </div>
          </div>
          <div>
            <p className="text-[#88998C] font-semibold text-[10px] uppercase tracking-widest mb-1">Saídas</p>
            <h3 className="text-2xl font-medium text-white">{formatCurrency(totalExpense)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expenses Chart */}
        <div className="lg:col-span-2 bg-[#161d19] p-6 rounded-[2rem] border border-[#2A3530]">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-base font-medium text-white">Gastos por Categoria</h3>
             <span className="text-xs text-[#5a6b61] bg-[#1F2923] px-2 py-1 rounded-lg border border-[#2A3530]">
                {filter === 'custom' 
                    ? formatDate(customDate) 
                    : filter === 'today' ? 'Hoje' 
                    : filter === '7d' ? 'Últimos 7 dias'
                    : filter === '30d' ? 'Últimos 30 dias'
                    : 'Últimos 3 meses'
                }
             </span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#1A221B', borderRadius: '12px', border: '1px solid #2A3530', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {chartData.slice(0, 6).map((entry, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-[#88998C] truncate font-medium">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-[#5a6b61] bg-[#131a15] rounded-2xl border border-[#1F2923] border-dashed">
              <Filter size={24} className="mb-2 opacity-50"/>
              <p className="text-xs">Sem gastos neste período.</p>
            </div>
          )}
        </div>

        {/* Right Column: Bills & Goals */}
        {/* Note: Bills and Goals usually show FUTURE/GLOBAL state, so they are not filtered by the past date filter */}
        <div className="space-y-6">
          {/* Bills Widget */}
          <div className="bg-[#161d19] p-6 rounded-[2rem] border border-[#2A3530]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-white">Pendências</h3>
              <div className="text-[#ccff00]">
                 <CalendarClock size={18} strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="space-y-2">
              {upcomingBills.length > 0 ? (
                upcomingBills.map(bill => {
                  const isLate = bill.dueDate < todayDay;
                  return (
                    <div key={bill.id} className="flex items-center justify-between p-3 bg-[#1F2923] rounded-xl border border-transparent hover:border-[#2A3530] transition-colors">
                      <div>
                        <p className="font-medium text-white text-xs">{bill.name}</p>
                        <p className={`text-[10px] mt-0.5 font-medium ${isLate ? 'text-red-400' : 'text-[#88998C]'}`}>
                          Dia {bill.dueDate} {isLate && '!'}
                        </p>
                      </div>
                      <span className="font-semibold text-[#ccff00] text-sm">{formatCurrency(bill.amount)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[#5a6b61] text-xs text-center py-6 bg-[#131a15] rounded-xl">Nada pendente.</div>
              )}
            </div>
          </div>

           {/* Goals Widget - Simplified */}
           <div className="bg-[#1F2923] p-6 rounded-[2rem] border border-[#2A3530]">
            <h3 className="text-base font-medium text-white mb-4">Objetivos</h3>
            {goals.length > 0 ? (
               <div className="space-y-4">
                 {goals.slice(0,2).map(goal => {
                   const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                   return (
                     <div key={goal.id}>
                       <div className="flex justify-between text-[10px] font-bold mb-1.5 text-[#88998C] uppercase tracking-wide">
                         <span className="text-white">{goal.name}</span>
                         <span>{Math.round(progress)}%</span>
                       </div>
                       <div className="h-1.5 bg-[#131a15] rounded-full overflow-hidden">
                         <div className="h-full bg-[#ccff00]" style={{ width: `${progress}%` }}></div>
                       </div>
                     </div>
                   )
                 })}
               </div>
            ) : (
              <p className="text-[#5a6b61] text-xs text-center">Nenhuma meta.</p>
            )}
           </div>

        </div>
      </div>
    </div>
  );
};