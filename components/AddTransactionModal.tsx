import React, { useState } from 'react';
import { TransactionType, Category, CATEGORIES, PAYMENT_METHODS } from '../types';
import { X, ArrowUpRight, ArrowDownLeft, Check, Calendar, Tag, CreditCard, AlignLeft, DollarSign } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: any) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

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
    // Reset form
    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-[#161d19] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-[#2A3530] shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300">
        
        <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white">Nova Movimentação</h3>
                <button 
                    onClick={onClose} 
                    className="p-2 bg-[#1F2923] hover:bg-[#2A3530] text-white rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Type Switcher */}
              <div className="flex bg-[#1F2923] p-1.5 rounded-2xl border border-[#2A3530]">
                <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        type === 'expense' 
                        ? 'bg-[#161d19] text-white shadow-md border border-[#2A3530]' 
                        : 'text-[#5a6b61] hover:text-[#88998C]'
                    }`}
                >
                    <ArrowDownLeft size={18} className={type === 'expense' ? 'text-red-400' : ''} />
                    Saída
                </button>
                <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        type === 'income' 
                        ? 'bg-[#161d19] text-white shadow-md border border-[#2A3530]' 
                        : 'text-[#5a6b61] hover:text-[#88998C]'
                    }`}
                >
                    <ArrowUpRight size={18} className={type === 'income' ? 'text-[#ccff00]' : ''} />
                    Entrada
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#5a6b61] uppercase tracking-wider pl-1">Valor</label>
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6b61] group-focus-within:text-[#ccff00] transition-colors">
                        <DollarSign size={20} strokeWidth={2.5} />
                    </div>
                    <input 
                    required
                    type="number" 
                    step="0.01"
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    className="w-full p-4 pl-12 bg-[#131a15] text-white rounded-2xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-xl font-bold placeholder-[#2A3530]" 
                    placeholder="0.00"
                    autoFocus
                    />
                </div>
              </div>

              {/* Grid for Date & Category */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#5a6b61] uppercase tracking-wider pl-1">Data</label>
                    <div className="relative">
                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6b61]" />
                        <input 
                        required
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        className="w-full p-3.5 pl-11 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm font-medium" 
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#5a6b61] uppercase tracking-wider pl-1">Categoria</label>
                    <div className="relative">
                        <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6b61]" />
                        <select 
                        value={category}
                        onChange={e => setCategory(e.target.value as Category)}
                        className="w-full p-3.5 pl-11 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm font-medium appearance-none"
                        >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                  </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#5a6b61] uppercase tracking-wider pl-1">Método de Pagamento</label>
                <div className="relative">
                    <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6b61]" />
                    <select 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full p-3.5 pl-11 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm font-medium appearance-none"
                    >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#5a6b61] uppercase tracking-wider pl-1">Descrição (Opcional)</label>
                <div className="relative">
                    <AlignLeft size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6b61]" />
                    <input 
                    type="text" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-3.5 pl-11 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] focus:border-[#ccff00] outline-none text-sm font-medium" 
                    placeholder="Ex: Supermercado"
                    />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 pb-2">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-[#ccff00] text-black rounded-2xl font-bold hover:bg-[#b3ff66] transition-all flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                >
                  <Check size={24} strokeWidth={3} />
                  Confirmar
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};