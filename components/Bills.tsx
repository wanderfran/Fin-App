import React, { useState, useMemo } from 'react';
import { Bill } from '../types';
import { formatCurrency } from '../utils';
import { CheckCircle2, Circle, AlertCircle, Plus, CalendarClock, X, Calendar } from 'lucide-react';

interface BillsProps {
  bills: Bill[];
  onAdd: (b: any) => void;
  onPay: (id: string) => void;
}

type DateFilter = 'today' | '7d' | 'month' | 'custom';

export const Bills: React.FC<BillsProps> = ({ bills, onAdd, onPay }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<DateFilter>('month');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Form State
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

  const todayDay = new Date().getDate();

  const filteredBills = useMemo(() => {
     return bills.filter(b => {
         switch(filterDate) {
             case 'today':
                 return b.dueDate === todayDay;
             case '7d':
                 // Simples lógica para os próximos 7 dias no mês corrente
                 return b.dueDate >= todayDay && b.dueDate <= todayDay + 7;
             case 'month':
                 return true;
             case 'custom':
                 const day = parseInt(customDate.split('-')[2]);
                 return b.dueDate === day;
             default:
                 return true;
         }
     }).sort((a, b) => a.dueDate - b.dueDate);
  }, [bills, filterDate, customDate, todayDay]);

  const totalPending = filteredBills.filter(b => !b.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = filteredBills.filter(b => b.isPaid).reduce((acc, curr) => acc + curr.amount, 0);

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
    <div className="space-y-6 animate-in fade-in duration-500">
       <header className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
            <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Contas Fixas</h1>
            <p className="text-[#88998C] text-sm">Mensalidades e boletos.</p>
            </div>
            <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-[#ccff00] hover:bg-[#b3ff66] text-black w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg"
            >
            <Plus size={20} strokeWidth={2} />
            </button>
        </div>

        {/* Date Filters */}
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <FilterButton type="today" label="Vence Hoje" />
                <FilterButton type="7d" label="Próx. 7 Dias" />
                <FilterButton type="month" label="Mês Atual" />
                <FilterButton type="custom" label="Dia Específico" />
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

      {/* Stats - Minimal */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161d19] p-4 rounded-[1.5rem] border border-[#2A3530]">
          <p className="text-[10px] text-[#88998C] font-bold uppercase tracking-widest">A Pagar ({filterDate === 'today' ? 'Hoje' : filterDate === 'month' ? 'Mês' : 'Período'})</p>
          <p className="text-xl font-medium text-white mt-1">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-[#1F2923] p-4 rounded-[1.5rem] border border-[#2A3530]">
          <p className="text-[10px] text-[#ccff00] font-bold uppercase tracking-widest">Pago ({filterDate === 'today' ? 'Hoje' : filterDate === 'month' ? 'Mês' : 'Período'})</p>
          <p className="text-xl font-medium text-[#ccff00] mt-1">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161d19] w-full max-w-md p-6 rounded-[2rem] border border-[#2A3530] shadow-2xl relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-5 right-5 text-[#5a6b61] hover:text-white"><X size={20}/></button>
            <h3 className="text-lg font-semibold text-white mb-6">Nova Conta</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#5a6b61] uppercase">Nome</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="p-3 bg-[#131a15] text-white rounded-xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm" placeholder="Ex: Internet" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#5a6b61] uppercase">Valor</label>
                    <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="p-3 bg-[#131a15] text-white rounded-xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm" placeholder="0,00" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#5a6b61] uppercase">Vencimento (Dia)</label>
                    <input required type="number" min="1" max="31" value={dueDate} onChange={e => setDueDate(e.target.value)} className="p-3 bg-[#131a15] text-white rounded-xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm" />
                  </div>
              </div>
              <div className="flex items-center gap-3 mt-2 bg-[#1F2923] p-3 rounded-xl border border-[#2A3530]">
                <input type="checkbox" id="recur" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-4 h-4 text-[#ccff00] rounded focus:ring-[#ccff00] bg-black border-none" />
                <label htmlFor="recur" className="text-white text-sm font-medium cursor-pointer">Recorrente mensal</label>
              </div>
              <div className="mt-2">
                <button type="submit" className="w-full bg-[#ccff00] text-black py-3 rounded-xl font-semibold hover:bg-[#b3ff66] transition-all text-base">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredBills.length > 0 ? (
            filteredBills.map(bill => {
            const isLate = !bill.isPaid && bill.dueDate < todayDay;
            return (
                <div key={bill.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${bill.isPaid ? 'bg-[#131a15]/50 border-[#1F2923] opacity-60' : 'bg-[#161d19] border-[#2A3530] hover:border-[#ccff00]/20'}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${isLate ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-[#1F2923] text-white border-[#2A3530]'}`}>
                    {bill.dueDate}
                    </div>
                    <div>
                    <h4 className="font-medium text-white text-sm">{bill.name}</h4>
                    <p className="text-[10px] text-[#5a6b61] uppercase tracking-wide">{bill.isRecurring ? 'Mensal' : 'Única'}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-right">
                    <p className="font-medium text-white text-sm">{formatCurrency(bill.amount)}</p>
                    {isLate && <span className="flex items-center justify-end text-[10px] text-red-400 font-medium gap-1"><AlertCircle size={10}/> Atraso</span>}
                    </div>
                    <button 
                    onClick={() => onPay(bill.id)}
                    className={`p-1 rounded-full transition-colors ${bill.isPaid ? 'text-[#ccff00]' : 'text-[#2A3530] hover:text-[#ccff00]'}`}
                    >
                    {bill.isPaid ? <CheckCircle2 size={24} fill="#ccff00" className="text-black" /> : <Circle size={24} strokeWidth={1.5} />}
                    </button>
                </div>
                </div>
            )
            })
        ) : (
            <div className="p-10 text-center text-[#5a6b61]">
                <Calendar size={32} className="mx-auto mb-2 opacity-20" strokeWidth={1} />
                <p className="text-sm">Nenhuma conta para este filtro.</p>
            </div>
        )}
      </div>
    </div>
  );
};