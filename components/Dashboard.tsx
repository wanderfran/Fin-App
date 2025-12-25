import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, CalendarClock } from 'lucide-react';
import { Transaction, Bill, Goal } from '../types';
import { formatCurrency } from '../utils';

interface DashboardProps {
  transactions: Transaction[];
  bills: Bill[];
  goals: Goal[];
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, bills, goals }) => {
  // Calculate Totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  // Chart Data
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key],
  }));

  // Upcoming Bills (Simple logic: just show unpaid bills sorted by due day)
  const todayDay = new Date().getDate();
  const upcomingBills = bills
    .filter(b => !b.isPaid)
    .sort((a, b) => {
       // logic to handle days wrapping to next month could be here, 
       // but for MVP we sort strictly by day number
       return a.dueDate - b.dueDate;
    })
    .slice(0, 3); // Top 3

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
        <p className="text-slate-500">Como está sua vida financeira hoje.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Saldo Atual</p>
            <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
              {formatCurrency(balance)}
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
            <Wallet size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Receitas</p>
            <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <ArrowUpCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Despesas</p>
            <h3 className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpense)}</h3>
          </div>
          <div className="p-3 bg-rose-50 rounded-full text-rose-600">
            <ArrowDownCircle size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expenses Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Gastos por Categoria</h3>
          {chartData.length > 0 ? (
            <div className="h-64 flex flex-col sm:flex-row items-center justify-center">
              <div className="w-full h-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 grid grid-cols-2 gap-2 mt-4 sm:mt-0">
                {chartData.slice(0, 6).map((entry, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-slate-600 truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-2xl">
              Nenhuma despesa registrada
            </div>
          )}
        </div>

        {/* Right Column: Bills & Goals Snippet */}
        <div className="space-y-6">
          {/* Bills Widget */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Contas Pendentes</h3>
              <CalendarClock size={20} className="text-slate-400" />
            </div>
            
            <div className="space-y-3">
              {upcomingBills.length > 0 ? (
                upcomingBills.map(bill => {
                  const isLate = bill.dueDate < todayDay;
                  return (
                    <div key={bill.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-semibold text-slate-700">{bill.name}</p>
                        <p className={`text-xs ${isLate ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                          Vence dia {bill.dueDate} {isLate && '(Atrasada)'}
                        </p>
                      </div>
                      <span className="font-bold text-slate-700">{formatCurrency(bill.amount)}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">Tudo pago por enquanto! 🎉</p>
              )}
            </div>
          </div>

           {/* Goals Widget */}
           <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg text-white">
            <h3 className="text-lg font-bold mb-4">Seus Objetivos</h3>
            {goals.length > 0 ? (
               <div className="space-y-4">
                 {goals.slice(0,2).map(goal => {
                   const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                   return (
                     <div key={goal.id}>
                       <div className="flex justify-between text-sm mb-1 opacity-90">
                         <span>{goal.name}</span>
                         <span>{Math.round(progress)}%</span>
                       </div>
                       <div className="h-2 bg-indigo-800 rounded-full overflow-hidden">
                         <div className="h-full bg-white opacity-80 rounded-full" style={{ width: `${progress}%` }}></div>
                       </div>
                     </div>
                   )
                 })}
               </div>
            ) : (
              <p className="text-indigo-200 text-sm">Crie uma meta para começar a poupar.</p>
            )}
           </div>

        </div>
      </div>
    </div>
  );
};
